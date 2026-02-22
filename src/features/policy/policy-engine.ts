export type PolicyProtocol = "JUPITER" | "SPL_TRANSFER";

export type PolicyState = {
  dailyLimitSol: number;
  dailySpentSol: number;
  allowedProtocols: PolicyProtocol[];
  isActive: boolean;
};

export type PolicyAction = {
  amountSol: number;
  protocol: PolicyProtocol;
};

export type PolicyEvaluation = {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string | null;
  remainingSol: number;
};

export const DEFAULT_POLICY: PolicyState = {
  dailyLimitSol: 0.5,
  dailySpentSol: 0,
  allowedProtocols: ["JUPITER"],
  isActive: true,
};

export function evaluatePolicy(
  policy: PolicyState,
  action: PolicyAction
): PolicyEvaluation {
  const remainingSol = Math.max(policy.dailyLimitSol - policy.dailySpentSol, 0);

  if (!policy.isActive) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: "Policy is currently disabled.",
      remainingSol,
    };
  }

  if (!policy.allowedProtocols.includes(action.protocol)) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: `${action.protocol} is not whitelisted in your policy.`,
      remainingSol,
    };
  }

  if (action.amountSol > remainingSol) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: `Action exceeds your daily limit by ${(action.amountSol - remainingSol).toFixed(4)} SOL.`,
      remainingSol,
    };
  }

  return {
    allowed: true,
    requiresApproval: false,
    reason: null,
    remainingSol,
  };
}
