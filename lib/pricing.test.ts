import { describe, expect, it } from "vitest";
import { fromHalalas, toHalalas, totalsForLines } from "./pricing";

describe("pricing", () => {
  it("converts riyals to whole halalas", () => {
    expect(toHalalas(450)).toBe(45000);
    expect(toHalalas("0.10")).toBe(10);
    expect(toHalalas({ toString: () => "19.99" })).toBe(1999);
  });

  it("sums without floating-point drift", () => {
    const { totalHalalas } = totalsForLines([
      { price: 0.1, durationMinutes: 10, quantity: 1 },
      { price: 0.2, durationMinutes: 10, quantity: 1 },
    ]);
    expect(fromHalalas(totalHalalas)).toBe(0.3);
  });

  it("multiplies price and time by quantity", () => {
    expect(
      totalsForLines([
        { price: 450, durationMinutes: 45, quantity: 2 },
        { price: "150.50", durationMinutes: 30, quantity: 1 },
      ]),
    ).toEqual({ totalHalalas: 105050, totalMinutes: 120 });
  });
});
