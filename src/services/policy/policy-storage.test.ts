import { DEFAULT_POLICY } from "../../features/policy/policy-engine";
import { coercePolicy } from "./policy-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("coercePolicy", () => {
  it("returns default policy for invalid input", () => {
    expect(coercePolicy(null)).toEqual(DEFAULT_POLICY);
    expect(coercePolicy(undefined)).toEqual(DEFAULT_POLICY);
  });

  it("sanitizes numeric values and allowed protocols", () => {
    const result = coercePolicy({
      dailyLimitSol: -1,
      dailySpentSol: "0.2",
      allowedProtocols: ["JUPITER", "NOT_VALID"],
    });

    expect(result.dailyLimitSol).toBe(0);
    expect(result.dailySpentSol).toBe(0.2);
    expect(result.allowedProtocols).toEqual(["JUPITER"]);
  });
});
