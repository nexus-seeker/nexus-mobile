import { Buffer } from "buffer";
import type {
  Connection,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import type { PolicyState } from "../../features/policy/policy-engine";
import {
  buildPolicyVaultPayload,
  parsePolicyVaultPayload,
} from "./policy-vault-codec";

const DEFAULT_POLICY_VAULT_SEED = "policy_vault";

const UPSERT_POLICY_DISCRIMINATOR = Uint8Array.from([
  141, 128, 210, 255, 28, 23, 22, 203,
]);

const POLICY_VAULT_ACCOUNT_DISCRIMINATOR = Uint8Array.from([
  180, 22, 67, 48, 87, 214, 158, 120,
]);

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
        TransactionInstruction,
        TransactionMessage,
        VersionedTransaction,
      } = require("@solana/web3.js") as typeof import("@solana/web3.js");

      const authority = new PublicKey(input.authorityPublicKey);
      const programId = new PublicKey(programIdBase58);
      const { address: policyVaultAddress } = derivePolicyVaultAddress(
        input.authorityPublicKey,
        programIdBase58,
        seed
      );

      const instructionData = concatBytes(
        UPSERT_POLICY_DISCRIMINATOR,
        buildPolicyVaultPayload(input.policy)
      );

      const instruction = new TransactionInstruction({
        programId,
        keys: [
          { pubkey: authority, isSigner: true, isWritable: false },
          { pubkey: policyVaultAddress, isSigner: false, isWritable: true },
        ],
        data: Buffer.from(instructionData),
      });

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await input.connection.getLatestBlockhashAndContext();

      const message = new TransactionMessage({
        payerKey: authority,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage();

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

      const policy = parsePolicyVaultPayload(payload);

      return {
        ...policy,
        dailySpentSol: Math.max(policy.dailySpentSol, 0),
      };
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
