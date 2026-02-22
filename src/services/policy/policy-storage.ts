import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_POLICY,
  type PolicyProtocol,
  type PolicyState,
} from "../../features/policy/policy-engine";

export const POLICY_STORAGE_KEY = "nexus.policy.v1";

const VALID_PROTOCOLS: readonly PolicyProtocol[] = ["JUPITER", "SPL_TRANSFER"];

export function coercePolicy(input: unknown): PolicyState {
  if (!input || typeof input !== "object") {
    return DEFAULT_POLICY;
  }

  const value = input as Partial<PolicyState> & {
    dailySpentSol?: number | string;
    dailyLimitSol?: number | string;
    allowedProtocols?: string[];
    isActive?: boolean;
  };

  const dailyLimitSol = sanitizeSol(value.dailyLimitSol, DEFAULT_POLICY.dailyLimitSol);
  const dailySpentSol = sanitizeSol(value.dailySpentSol, DEFAULT_POLICY.dailySpentSol);
  const allowedProtocols = Array.isArray(value.allowedProtocols)
    ? value.allowedProtocols.filter(isPolicyProtocol)
    : DEFAULT_POLICY.allowedProtocols;
  const isActive = typeof value.isActive === "boolean" ? value.isActive : DEFAULT_POLICY.isActive;

  return {
    dailyLimitSol,
    dailySpentSol,
    allowedProtocols: allowedProtocols.length
      ? dedupeProtocols(allowedProtocols)
      : DEFAULT_POLICY.allowedProtocols,
    isActive,
  };
}

export async function loadPolicy(): Promise<PolicyState> {
  const raw = await AsyncStorage.getItem(POLICY_STORAGE_KEY);

  if (!raw) {
    return DEFAULT_POLICY;
  }

  try {
    return coercePolicy(JSON.parse(raw));
  } catch {
    return DEFAULT_POLICY;
  }
}

export async function savePolicy(policy: PolicyState): Promise<void> {
  await AsyncStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(policy));
}

function sanitizeSol(value: number | string | undefined, fallback: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(parsed, 0);
}

function isPolicyProtocol(value: string): value is PolicyProtocol {
  return VALID_PROTOCOLS.includes(value as PolicyProtocol);
}

function dedupeProtocols(protocols: PolicyProtocol[]): PolicyProtocol[] {
  return [...new Set(protocols)];
}
