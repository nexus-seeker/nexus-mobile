import * as LocalAuthentication from "expo-local-authentication";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_POLICY,
  evaluatePolicy,
  type PolicyAction,
  type PolicyEvaluation,
  type PolicyProtocol,
  type PolicyState,
} from "../features/policy/policy-engine";
import {
  createPolicyVaultClient,
  type PolicySyncResult,
} from "../services/policy/policy-vault-client";
import { loadPolicy, savePolicy } from "../services/policy/policy-storage";

type SavePolicyInput = {
  dailyLimitSol: number;
  allowedProtocols: PolicyProtocol[];
};

type SavePolicyResult = {
  ok: boolean;
  synced: boolean;
  error: string | null;
  syncResult: PolicySyncResult | null;
};

type PolicyContextValue = {
  isReady: boolean;
  isSaving: boolean;
  policy: PolicyState;
  lastError: string | null;
  lastSyncSignature: string | null;
  savePolicy: (input: SavePolicyInput) => Promise<SavePolicyResult>;
  evaluateAction: (action: PolicyAction) => PolicyEvaluation;
  clearPolicyError: () => void;
};

const PolicyContext = createContext<PolicyContextValue | undefined>(undefined);

const policyVaultClient = createPolicyVaultClient();

export function PolicyProvider({ children }: { children: ReactNode }) {
  const [policy, setPolicy] = useState<PolicyState>(DEFAULT_POLICY);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSyncSignature, setLastSyncSignature] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapPolicy() {
      try {
        const storedPolicy = await loadPolicy();

        if (isMounted) {
          setPolicy(storedPolicy);
        }
      } catch (error) {
        if (isMounted) {
          setLastError(toUserMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void bootstrapPolicy();

    return () => {
      isMounted = false;
    };
  }, []);

  const savePolicyWithBiometric = useCallback(
    async (input: SavePolicyInput): Promise<SavePolicyResult> => {
      setIsSaving(true);
      setLastError(null);

      try {
        const biometricResult = await authenticatePolicyUpdate();

        if (!biometricResult.ok) {
          setLastError(biometricResult.error);
          return {
            ok: false,
            synced: false,
            error: biometricResult.error,
            syncResult: null,
          };
        }

        const normalizedPolicy: PolicyState = {
          dailyLimitSol: Math.max(input.dailyLimitSol, 0),
          dailySpentSol: Math.max(Math.min(policy.dailySpentSol, input.dailyLimitSol), 0),
          allowedProtocols: [...new Set(input.allowedProtocols)],
        };

        setPolicy(normalizedPolicy);
        await savePolicy(normalizedPolicy);

        try {
          const syncResult = await policyVaultClient.upsertPolicy(normalizedPolicy);
          setLastSyncSignature(syncResult.signature);

          return {
            ok: true,
            synced: true,
            error: null,
            syncResult,
          };
        } catch (syncError) {
          const message = toUserMessage(syncError);
          setLastError(message);

          return {
            ok: false,
            synced: false,
            error: message,
            syncResult: null,
          };
        }
      } finally {
        setIsSaving(false);
      }
    },
    [policy.dailySpentSol]
  );

  const evaluateAction = useCallback(
    (action: PolicyAction) => evaluatePolicy(policy, action),
    [policy]
  );

  const value = useMemo<PolicyContextValue>(
    () => ({
      isReady,
      isSaving,
      policy,
      lastError,
      lastSyncSignature,
      savePolicy: savePolicyWithBiometric,
      evaluateAction,
      clearPolicyError: () => setLastError(null),
    }),
    [
      evaluateAction,
      isReady,
      isSaving,
      lastError,
      lastSyncSignature,
      policy,
      savePolicyWithBiometric,
    ]
  );

  return <PolicyContext.Provider value={value}>{children}</PolicyContext.Provider>;
}

export function usePolicy() {
  const context = useContext(PolicyContext);

  if (!context) {
    throw new Error("usePolicy must be used inside PolicyProvider");
  }

  return context;
}

async function authenticatePolicyUpdate(): Promise<{
  ok: boolean;
  error: string;
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    return {
      ok: false,
      error:
        "Biometric authentication is unavailable on this device. Policy update rejected.",
    };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirm policy update",
    cancelLabel: "Cancel",
  });

  if (!result.success) {
    return {
      ok: false,
      error: "Biometric confirmation cancelled. Policy update rejected.",
    };
  }

  return {
    ok: true,
    error: "",
  };
}

function toUserMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Unknown policy error.";
}
