import { requestAgentPlan } from "./agent-api";

describe("requestAgentPlan", () => {
  it("uses backend response when API call succeeds", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reasoning: "Swapping through Jupiter.",
        action: {
          kind: "swap",
          amountSol: 0.2,
          fromToken: "SOL",
          toToken: "USDC",
          protocol: "JUPITER",
        },
      }),
    });

    const result = await requestAgentPlan(
      { intent: "Swap 0.2 SOL to USDC" },
      {
        endpoint: "https://example.com/api/agent",
        fetchImpl,
      }
    );

    expect(result.source).toBe("backend");
    expect(result.action?.kind).toBe("swap");
    expect(result.reasoning).toContain("Swapping through Jupiter");
  });

  it("falls back to local mock parser when backend request fails", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("network failed"));

    const result = await requestAgentPlan(
      { intent: "Swap 0.1 SOL to BONK" },
      {
        endpoint: "https://example.com/api/agent",
        fetchImpl,
      }
    );

    expect(result.source).toBe("mock");
    expect(result.action).toEqual({
      kind: "swap",
      amountSol: 0.1,
      fromToken: "SOL",
      toToken: "BONK",
      protocol: "JUPITER",
    });
    expect(result.reasoning).toContain("fallback");
  });
});
