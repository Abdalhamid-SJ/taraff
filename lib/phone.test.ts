import { describe, expect, it } from "vitest";
import { normalizeSaudiPhone, SAUDI_PHONE_REGEX } from "./phone";

describe("normalizeSaudiPhone", () => {
  it.each([
    "+966501234567",
    "0501234567",
    "501234567",
    "966501234567",
    "00966501234567",
    "+966 50 123 4567",
    "050-123-4567",
    "(050) 123 4567",
    "٠٥٠١٢٣٤٥٦٧",
    "۰۵۰۱۲۳۴۵۶۷",
  ])("normalises %s", (input) => {
    expect(normalizeSaudiPhone(input)).toBe("+966501234567");
  });

  it("keeps landlines (8 digits after the code)", () => {
    expect(normalizeSaudiPhone("011 234 5678")).toBe("+966112345678");
    expect(SAUDI_PHONE_REGEX.test(normalizeSaudiPhone("011 234 5678"))).toBe(true);
  });

  it("leaves non-numbers alone so validation rejects them", () => {
    expect(SAUDI_PHONE_REGEX.test(normalizeSaudiPhone("call me"))).toBe(false);
    expect(SAUDI_PHONE_REGEX.test(normalizeSaudiPhone("+14155550123"))).toBe(false);
  });
});
