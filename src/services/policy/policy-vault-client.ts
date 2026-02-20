import type { PolicyState } from "../../features/policy/policy-engine";

export type PolicySyncResult = {
  signature: string;
};

export interface PolicyVaultClient {
  upsertPolicy(policy: PolicyState): Promise<PolicySyncResult>;
}

export function createPolicyVaultClient(): PolicyVaultClient {
  const programId = process.env.EXPO_PUBLIC_POLICY_PROGRAM_ID?.trim();

  if (!programId) {
    return {
      async upsertPolicy() {
        throw new Error(
          "PolicyVault program is not configured. Set EXPO_PUBLIC_POLICY_PROGRAM_ID once the Anchor program is deployed."
        );
      },
    };
  }

  return {
    async upsertPolicy() {
      throw new Error(
        `PolicyVault client integration is pending for program ${programId}.`
      );
    },
  };
}
