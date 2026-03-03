import { DEFAULT_POLICY } from "../../features/policy/policy-engine";
import { createPolicyVaultClient } from "./policy-vault-client";

jest.mock("@solana/web3.js", () => {
  class PublicKey {
    value: string;

    constructor(value: string) {
      this.value = value;
    }

    toBuffer() {
      return Buffer.alloc(32, 7);
    }

    toBase58() {
      return this.value;
    }

    static findProgramAddressSync(seeds: Buffer[]) {
      return [new PublicKey(`pda-${seeds[0].toString("utf8")}`), 255] as const;
    }
  }

  class TransactionInstruction {
    payload: unknown;

    constructor(payload: unknown) {
      this.payload = payload;
    }
  }

  class TransactionMessage {
    instructions: unknown[];

    constructor(input: { instructions: unknown[] }) {
      this.instructions = input.instructions;
    }

    compileToLegacyMessage() {
      return {
        compiledInstructions: this.instructions.map((_, index) => ({
          programIdIndex: index,
        })),
      };
    }

    compileToV0Message() {
      return this.compileToLegacyMessage();
    }
  }

  class VersionedTransaction {
    message: { compiledInstructions: unknown[] };

    constructor(message: { compiledInstructions: unknown[] }) {
      this.message = message;
    }
  }

  return {
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    SystemProgram: {
      programId: new PublicKey("11111111111111111111111111111111"),
    },
  };
});

describe("createPolicyVaultClient", () => {
  it("returns an adapter that throws when PolicyVault is not configured", async () => {
    const client = createPolicyVaultClient();

    await expect(
      client.upsertPolicy({
        authorityPublicKey: "authority",
        connection: {} as never,
        signAndSendTransaction: jest.fn(),
        policy: DEFAULT_POLICY,
      })
    ).rejects.toThrow("PolicyVault program is not configured");
  });

  it("prepends create_profile when profile PDA is missing", async () => {
    const client = createPolicyVaultClient({
      programId: "DxV7vXf919YddC74X726PpsrPpHLXNZtdBsk6Lweh3HJ",
    });

    const getAccountInfo = jest.fn().mockResolvedValue(null);
    const confirmTransaction = jest.fn().mockResolvedValue(undefined);
    const getLatestBlockhashAndContext = jest.fn().mockResolvedValue({
      context: { slot: 1 },
      value: {
        blockhash: "11111111111111111111111111111111",
        lastValidBlockHeight: 123,
      },
    });

    let compiledInstructionCount = 0;
    const signAndSendTransaction = jest
      .fn()
      .mockImplementation(async (transaction) => {
        compiledInstructionCount = transaction.message.compiledInstructions.length;
        return "sig-1";
      });

    await client.upsertPolicy({
      authorityPublicKey: "EP4C7RTzhTPqTZZ8fUzfSu443QawGfDUDYjKgWFPfBfZ",
      connection: {
        getAccountInfo,
        getLatestBlockhashAndContext,
        confirmTransaction,
      } as never,
      signAndSendTransaction,
      policy: DEFAULT_POLICY,
    });

    expect(getAccountInfo).toHaveBeenCalledTimes(1);
    expect(compiledInstructionCount).toBe(2);
  });

  it("parses policy vault accounts that include protocol_caps", async () => {
    const client = createPolicyVaultClient({
      programId: "DxV7vXf919YddC74X726PpsrPpHLXNZtdBsk6Lweh3HJ",
    });

    const discriminator = Buffer.from([180, 22, 67, 48, 87, 214, 158, 120]);
    const owner = Buffer.alloc(32, 9);
    const dailyMaxLamports = Buffer.alloc(8);
    dailyMaxLamports.writeBigUInt64LE(500_000_000n);
    const currentSpendLamports = Buffer.alloc(8);
    currentSpendLamports.writeBigUInt64LE(100_000_000n);
    const lastResetTs = Buffer.alloc(8);
    lastResetTs.writeBigInt64LE(1_700_000_000n);

    const allowedProtocolsCount = Buffer.alloc(4);
    allowedProtocolsCount.writeUInt32LE(2);
    const jupiter = Buffer.from("jupiter", "utf8");
    const jupiterLen = Buffer.alloc(4);
    jupiterLen.writeUInt32LE(jupiter.length);
    const splTransfer = Buffer.from("spl_transfer", "utf8");
    const splTransferLen = Buffer.alloc(4);
    splTransferLen.writeUInt32LE(splTransfer.length);

    const protocolCapsCount = Buffer.alloc(4);
    protocolCapsCount.writeUInt32LE(1);
    const capProtocol = Buffer.from("jupiter", "utf8");
    const capProtocolLen = Buffer.alloc(4);
    capProtocolLen.writeUInt32LE(capProtocol.length);
    const capMaxLamports = Buffer.alloc(8);
    capMaxLamports.writeBigUInt64LE(150_000_000n);
    const capCurrentSpend = Buffer.alloc(8);
    capCurrentSpend.writeBigUInt64LE(100_000_000n);

    const nextReceiptId = Buffer.alloc(8);
    nextReceiptId.writeBigUInt64LE(2n);
    const isActive = Buffer.from([1]);
    const bump = Buffer.from([255]);

    const accountData = Buffer.concat([
      discriminator,
      owner,
      dailyMaxLamports,
      currentSpendLamports,
      lastResetTs,
      allowedProtocolsCount,
      jupiterLen,
      jupiter,
      splTransferLen,
      splTransfer,
      protocolCapsCount,
      capProtocolLen,
      capProtocol,
      capMaxLamports,
      capCurrentSpend,
      nextReceiptId,
      isActive,
      bump,
    ]);

    const fetched = await client.fetchPolicy({
      authorityPublicKey: "EP4C7RTzhTPqTZZ8fUzfSu443QawGfDUDYjKgWFPfBfZ",
      connection: {
        getAccountInfo: jest.fn().mockResolvedValue({ data: accountData }),
      } as never,
    });

    expect(fetched).toEqual({
      dailyLimitSol: 0.5,
      dailySpentSol: 0.1,
      allowedProtocols: ["JUPITER", "SPL_TRANSFER"],
      isActive: true,
    });
  });
});
