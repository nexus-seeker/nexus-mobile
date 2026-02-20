import { DEFAULT_POLICY } from "../../features/policy/policy-engine";
import {
  buildPolicyVaultPayload,
  parsePolicyVaultPayload,
} from "./policy-vault-codec";

describe("policy vault codec", () => {
  it("round-trips encoded policy values", () => {
    const payload = buildPolicyVaultPayload({
      ...DEFAULT_POLICY,
      dailyLimitSol: 1.25,
      dailySpentSol: 0.4,
      allowedProtocols: ["JUPITER", "SPL_TRANSFER"],
    });

    const parsed = parsePolicyVaultPayload(payload);

    expect(parsed.dailyLimitSol).toBeCloseTo(1.25);
    expect(parsed.dailySpentSol).toBeCloseTo(0.4);
    expect(parsed.allowedProtocols).toEqual(["JUPITER", "SPL_TRANSFER"]);
  });

  it("decodes empty protocol bitmask to empty list", () => {
    const payload = buildPolicyVaultPayload({
      ...DEFAULT_POLICY,
      allowedProtocols: [],
    });

    const parsed = parsePolicyVaultPayload(payload);

    expect(parsed.allowedProtocols).toEqual([]);
  });
});
