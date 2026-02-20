import { parseSwapIntent } from "./intent-parser";

describe("parseSwapIntent", () => {
  it("parses swap intent from natural language", () => {
    const parsed = parseSwapIntent("Swap 0.1 SOL to USDC");

    expect(parsed).toEqual({
      amountSol: 0.1,
      fromToken: "SOL",
      toToken: "USDC",
      protocol: "JUPITER",
    });
  });

  it("returns null for non-swap intent", () => {
    const parsed = parseSwapIntent("show my receipts");

    expect(parsed).toBeNull();
  });
});
