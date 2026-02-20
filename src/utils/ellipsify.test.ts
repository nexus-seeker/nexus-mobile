import { ellipsify } from "./ellipsify";

describe("ellipsify", () => {
  it("returns short strings unchanged", () => {
    expect(ellipsify("abc123")).toBe("abc123");
  });

  it("truncates long strings with default length", () => {
    const input = "1234567890123456789012345678901234567890";
    expect(ellipsify(input)).toBe("1234..7890");
  });

  it("uses a custom truncate length", () => {
    const input = "1234567890123456789012345678901234567890";
    expect(ellipsify(input, 6)).toBe("123456..567890");
  });
});
