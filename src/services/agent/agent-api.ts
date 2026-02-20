import { parseSwapIntent } from "../../features/agent/intent-parser";
import { type PolicyProtocol } from "../../features/policy/policy-engine";

export type AgentSwapAction = {
  kind: "swap";
  amountSol: number;
  fromToken: "SOL";
  toToken: string;
  protocol: PolicyProtocol;
};

export type AgentPlanResponse = {
  source: "backend" | "mock";
  reasoning: string;
  action: AgentSwapAction | null;
};

type RequestAgentPlanInput = {
  intent: string;
};

type RequestAgentPlanOptions = {
  endpoint?: string;
  fetchImpl?: typeof fetch;
};

const DEFAULT_AGENT_ENDPOINT =
  process.env.EXPO_PUBLIC_AGENT_API_URL || "https://your-backend.com/api/agent";

export async function requestAgentPlan(
  input: RequestAgentPlanInput,
  options: RequestAgentPlanOptions = {}
): Promise<AgentPlanResponse> {
  const endpoint = options.endpoint ?? DEFAULT_AGENT_ENDPOINT;
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ intent: input.intent }),
    });

    if (!response.ok) {
      throw new Error(`Agent backend returned ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const normalized = normalizeAgentPayload(payload);

    if (normalized) {
      return {
        source: "backend",
        reasoning: normalized.reasoning,
        action: normalized.action,
      };
    }

    throw new Error("Backend payload shape is invalid");
  } catch {
    return buildMockPlan(input.intent);
  }
}

function normalizeAgentPayload(payload: unknown): {
  reasoning: string;
  action: AgentSwapAction | null;
} | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as {
    reasoning?: unknown;
    action?: unknown;
  };

  const reasoning =
    typeof value.reasoning === "string"
      ? value.reasoning
      : "Agent backend provided no reasoning.";

  if (!value.action) {
    return {
      reasoning,
      action: null,
    };
  }

  const action = normalizeSwapAction(value.action);

  return {
    reasoning,
    action,
  };
}

function normalizeSwapAction(action: unknown): AgentSwapAction | null {
  if (!action || typeof action !== "object") {
    return null;
  }

  const value = action as {
    kind?: unknown;
    amountSol?: unknown;
    fromToken?: unknown;
    toToken?: unknown;
    protocol?: unknown;
  };

  if (value.kind !== "swap") {
    return null;
  }

  if (
    typeof value.amountSol !== "number" ||
    !Number.isFinite(value.amountSol) ||
    value.amountSol <= 0
  ) {
    return null;
  }

  if (value.fromToken !== "SOL" || typeof value.toToken !== "string") {
    return null;
  }

  const protocol =
    value.protocol === "SPL_TRANSFER" ? "SPL_TRANSFER" : "JUPITER";

  return {
    kind: "swap",
    amountSol: value.amountSol,
    fromToken: "SOL",
    toToken: value.toToken.toUpperCase(),
    protocol,
  };
}

function buildMockPlan(intent: string): AgentPlanResponse {
  const parsed = parseSwapIntent(intent);

  if (!parsed) {
    return {
      source: "mock",
      reasoning:
        "Using fallback parser: intent not recognized. Try 'Swap 0.1 SOL to USDC'.",
      action: null,
    };
  }

  return {
    source: "mock",
    reasoning:
      "Using fallback parser because backend is unavailable. Generated a local swap plan.",
    action: {
      kind: "swap",
      amountSol: parsed.amountSol,
      fromToken: "SOL",
      toToken: parsed.toToken,
      protocol: parsed.protocol,
    },
  };
}
