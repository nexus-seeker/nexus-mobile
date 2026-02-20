import { DEFAULT_POLICY } from "../../features/policy/policy-engine";
import { createPolicyVaultClient } from "./policy-vault-client";

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
});
