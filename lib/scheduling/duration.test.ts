import { describe, expect, it } from "vitest";
import { sumDurationMinutes } from "./duration";

describe("sumDurationMinutes", () => {
  it("sums a list of variant durations", () => {
    expect(sumDurationMinutes([45, 60, 30])).toBe(135);
  });

  it("returns 0 for an empty list", () => {
    expect(sumDurationMinutes([])).toBe(0);
  });

  it("handles a single variant", () => {
    expect(sumDurationMinutes([90])).toBe(90);
  });
});
