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
});
