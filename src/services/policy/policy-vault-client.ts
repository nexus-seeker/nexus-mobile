import { Buffer } from "buffer";
import type {
  Connection,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import type {
  PolicyProtocol,
  PolicyState,
} from "../../features/policy/policy-engine";

const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_POLICY_VAULT_SEED = "policy";
const DEFAULT_AGENT_PROFILE_SEED = "profile";

// Hardcoded discriminators removed — now computed dynamically via anchorDiscriminator()
// Original values for reference:
//   create_profile: [225, 205, 234, 143, 17, 186, 50, 220]
//   update_policy:  [212, 245, 246,   7, 163, 151, 18,  57]
//   policy_vault account: verified below during fetch

const POLICY_VAULT_ACCOUNT_DISCRIMINATOR = Uint8Array.from([
  180, 22, 67, 48, 87, 214, 158, 120,
]);

/**
 * Derives an Anchor instruction discriminator: first 8 bytes of SHA-256("global:<name>").
 * Uses crypto.subtle (available in Hermes/RN ≥ 0.70) with a pure-JS fallback.
 */
async function anchorDiscriminator(instructionName: string): Promise<Uint8Array> {
  const input = `global:${instructionName}`;
  const encoded = new TextEncoder().encode(input);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return new Uint8Array(hashBuffer).slice(0, 8);
  }

  // Pure-JS SHA-256 fallback (for older RN/Jest environments)
  const { createHash } = require('crypto') as typeof import('crypto');
  const digest = createHash('sha256').update(input).digest();
  return new Uint8Array(digest).slice(0, 8);
}

type PolicySigner = (
  transaction: VersionedTransaction,
  minContextSlot: number
) => Promise<string>;

export type PolicySyncResult = {
  signature: string;
  policyVaultAddress: string;
};

export type UpsertPolicyInput = {
  authorityPublicKey: string;
  connection: Connection;
  signAndSendTransaction: PolicySigner;
  policy: PolicyState;
};

export type FetchPolicyInput = {
  authorityPublicKey: string;
  connection: Connection;
};

export interface PolicyVaultClient {
  upsertPolicy(input: UpsertPolicyInput): Promise<PolicySyncResult>;
  fetchPolicy(input: FetchPolicyInput): Promise<PolicyState | null>;
}

export function createPolicyVaultClient(options?: {
  programId?: string;
  seed?: string;
}): PolicyVaultClient {
  const programIdBase58 =
    options?.programId?.trim() ||
    process.env.EXPO_PUBLIC_POLICY_PROGRAM_ID?.trim() ||
    "";

  const seed = options?.seed ?? DEFAULT_POLICY_VAULT_SEED;

  if (!programIdBase58) {
    return {
      async upsertPolicy() {
        throw new Error(
          "PolicyVault program is not configured. Set EXPO_PUBLIC_POLICY_PROGRAM_ID once the Anchor program is deployed."
        );
      },
      async fetchPolicy() {
        return null;
      },
    };
  }

  return {
    async upsertPolicy(input: UpsertPolicyInput): Promise<PolicySyncResult> {
      const {
        PublicKey,
        SystemProgram,
        TransactionInstruction,
        TransactionMessage,
        VersionedTransaction,
      } = require("@solana/web3.js") as typeof import("@solana/web3.js");

      const authority = new PublicKey(input.authorityPublicKey);
      const programId = new PublicKey(programIdBase58);
      const { address: profileAddress } = deriveAgentProfileAddress(
        input.authorityPublicKey,
        programIdBase58
      );
      const { address: policyVaultAddress } = derivePolicyVaultAddress(
        input.authorityPublicKey,
        programIdBase58,
        seed
      );

      const profileAccount = await input.connection.getAccountInfo(profileAddress);
      const instructions: InstanceType<typeof TransactionInstruction>[] = [];

      if (!profileAccount) {
        const createProfileDiscriminator = await anchorDiscriminator('create_profile');
        instructions.push(
          new TransactionInstruction({
            programId,
            keys: [
              { pubkey: profileAddress, isSigner: false, isWritable: true },
              { pubkey: authority, isSigner: true, isWritable: true },
              { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            data: Buffer.from(createProfileDiscriminator),
          })
        );
      }

      const updatePolicyDiscriminator = await anchorDiscriminator('update_policy');
      const instructionData = buildUpdatePolicyInstructionData(input.policy, updatePolicyDiscriminator);

      const instruction = new TransactionInstruction({
        programId,
        keys: [
          { pubkey: policyVaultAddress, isSigner: false, isWritable: true },
          { pubkey: authority, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(instructionData),
      });
      instructions.push(instruction);

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await input.connection.getLatestBlockhashAndContext();

      const message = new TransactionMessage({
        payerKey: authority,
        recentBlockhash: latestBlockhash.blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);

      const signature = await input.signAndSendTransaction(
        transaction,
        minContextSlot
      );

      await input.connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );

      return {
        signature,
        policyVaultAddress: policyVaultAddress.toBase58(),
      };
    },

    async fetchPolicy(input: FetchPolicyInput): Promise<PolicyState | null> {
      const { address } = derivePolicyVaultAddress(
        input.authorityPublicKey,
        programIdBase58,
        seed
      );

      const accountInfo = await input.connection.getAccountInfo(address);

      if (!accountInfo) {
        return null;
      }

      const accountData = toUint8Array(accountInfo.data);
      const payload = stripAccountDiscriminator(accountData);

      if (!payload) {
        throw new Error("Unexpected PolicyVault account format.");
      }

      return parsePolicyVaultPayload(payload);
    },
  };
}

export function derivePolicyVaultAddress(
  authorityPublicKey: string,
  programIdBase58: string,
  seed = DEFAULT_POLICY_VAULT_SEED
): { address: PublicKey; bump: number } {
  const { PublicKey } = require("@solana/web3.js") as typeof import("@solana/web3.js");

  const authority = new PublicKey(authorityPublicKey);
  const programId = new PublicKey(programIdBase58);

  const [address, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(seed), authority.toBuffer()],
    programId
  );

  return { address, bump };
}

export function deriveAgentProfileAddress(
  authorityPublicKey: string,
  programIdBase58: string,
  seed = DEFAULT_AGENT_PROFILE_SEED
): { address: PublicKey; bump: number } {
  const { PublicKey } = require("@solana/web3.js") as typeof import("@solana/web3.js");

  const authority = new PublicKey(authorityPublicKey);
  const programId = new PublicKey(programIdBase58);

  const [address, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(seed), authority.toBuffer()],
    programId
  );

  return { address, bump };
}

function buildUpdatePolicyInstructionData(policy: PolicyState, discriminator: Uint8Array): Uint8Array {
  const dailyMaxLamports = toLamports(policy.dailyLimitSol);
  const dailyMaxBuffer = Buffer.alloc(8);
  dailyMaxBuffer.writeBigUInt64LE(dailyMaxLamports);

  const allowedProtocols = toProgramProtocols(policy.allowedProtocols);
  const vecLenBuffer = Buffer.alloc(4);
  vecLenBuffer.writeUInt32LE(allowedProtocols.length);

  const protocolBuffers = allowedProtocols.map((protocol) => {
    const value = Buffer.from(protocol, "utf8");
    const length = Buffer.alloc(4);
    length.writeUInt32LE(value.length);
    return Buffer.concat([length, value]);
  });

  const isActiveBuffer = Buffer.from([policy.isActive ? 1 : 0]);

  return concatBytes(
    discriminator,
    Buffer.concat([
      dailyMaxBuffer,
      vecLenBuffer,
      ...protocolBuffers,
      isActiveBuffer,
    ])
  );
}

function parsePolicyVaultPayload(payload: Uint8Array): PolicyState {
  const data = Buffer.from(payload);
  let offset = 0;

  assertRemaining(data, offset, 32);
  offset += 32; // owner

  assertRemaining(data, offset, 8);
  const dailyMaxLamports = data.readBigUInt64LE(offset);
  offset += 8;

  assertRemaining(data, offset, 8);
  const currentSpendLamports = data.readBigUInt64LE(offset);
  offset += 8;

  assertRemaining(data, offset, 8);
  offset += 8; // last_reset_ts

  assertRemaining(data, offset, 4);
  const protocolCount = data.readUInt32LE(offset);
  offset += 4;

  const allowedProtocols: PolicyProtocol[] = [];
  for (let index = 0; index < protocolCount; index += 1) {
    assertRemaining(data, offset, 4);
    const protocolLength = data.readUInt32LE(offset);
    offset += 4;

    assertRemaining(data, offset, protocolLength);
    const protocol = data.toString("utf8", offset, offset + protocolLength);
    offset += protocolLength;

    const mapped = fromProgramProtocol(protocol);
    if (mapped) {
      allowedProtocols.push(mapped);
    }
  }

  assertRemaining(data, offset, 8);
  offset += 8; // next_receipt_id

  assertRemaining(data, offset, 1);
  const isActive = data.readUInt8(offset) === 1;

  return {
    dailyLimitSol: Number(dailyMaxLamports) / LAMPORTS_PER_SOL,
    dailySpentSol: Number(currentSpendLamports) / LAMPORTS_PER_SOL,
    allowedProtocols: [...new Set(allowedProtocols)],
    isActive,
  };
}

function toProgramProtocols(protocols: PolicyProtocol[]): string[] {
  const mapped: string[] = [];

  for (const protocol of protocols) {
    if (protocol === "JUPITER") {
      mapped.push("jupiter");
      continue;
    }

    if (protocol === "SPL_TRANSFER") {
      mapped.push("spl_transfer");
    }
  }

  return [...new Set(mapped)];
}

function fromProgramProtocol(protocol: string): PolicyProtocol | null {
  if (protocol === "jupiter") {
    return "JUPITER";
  }
  if (protocol === "spl_transfer") {
    return "SPL_TRANSFER";
  }
  return null;
}

function toLamports(amountSol: number): bigint {
  const normalized = Number.isFinite(amountSol) ? Math.max(amountSol, 0) : 0;
  return BigInt(Math.round(normalized * LAMPORTS_PER_SOL));
}

function concatBytes(first: Uint8Array, second: Uint8Array): Uint8Array {
  const output = new Uint8Array(first.length + second.length);
  output.set(first, 0);
  output.set(second, first.length);
  return output;
}

function toUint8Array(input: Buffer | Uint8Array): Uint8Array {
  return Uint8Array.from(input);
}

function stripAccountDiscriminator(data: Uint8Array): Uint8Array | null {
  if (data.byteLength < POLICY_VAULT_ACCOUNT_DISCRIMINATOR.length) {
    return null;
  }

  const discriminator = data.slice(0, POLICY_VAULT_ACCOUNT_DISCRIMINATOR.length);

  if (!equalBytes(discriminator, POLICY_VAULT_ACCOUNT_DISCRIMINATOR)) {
    return null;
  }

  return data.slice(POLICY_VAULT_ACCOUNT_DISCRIMINATOR.length);
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

function assertRemaining(data: Buffer, offset: number, size: number): void {
  if (offset + size > data.length) {
    throw new Error("PolicyVault account data is truncated.");
  }
}
