import {
  DEFAULT_POLICY,
  evaluatePolicy,
  type PolicyAction,
} from "./policy-engine";

describe("evaluatePolicy", () => {
  it("allows Jupiter swap when within daily limit", () => {
    const action: PolicyAction = {
      amountSol: 0.1,
      protocol: "JUPITER",
    };

    const result = evaluatePolicy(DEFAULT_POLICY, action);

    expect(result.allowed).toBe(true);
    expect(result.requiresApproval).toBe(false);
  });

  it("requires approval when protocol is not whitelisted", () => {
    const action: PolicyAction = {
      amountSol: 0.05,
      protocol: "SPL_TRANSFER",
    };

    const result = evaluatePolicy(DEFAULT_POLICY, action);

    expect(result.allowed).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.reason).toContain("not whitelisted");
  });

  it("requires approval when amount exceeds remaining daily limit", () => {
    const action: PolicyAction = {
      amountSol: 1,
      protocol: "JUPITER",
    };

    const result = evaluatePolicy(
      {
        ...DEFAULT_POLICY,
        dailyLimitSol: 1,
        dailySpentSol: 0.6,
      },
      action
    );

    expect(result.allowed).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.reason).toContain("daily limit");
    expect(result.remainingSol).toBeCloseTo(0.4);
  });
});
