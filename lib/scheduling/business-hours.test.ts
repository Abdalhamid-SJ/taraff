import { describe, expect, it } from "vitest";
import { clampAvailabilityToBusinessHours } from "./business-hours";

const hours = [
  { dayOfWeek: 0, startMinute: 9 * 60, endMinute: 21 * 60 },
  { dayOfWeek: 5, startMinute: 0, endMinute: 0 }, // closed
];

describe("clampAvailabilityToBusinessHours", () => {
  it("trims a rule that starts before opening and ends after closing", () => {
    expect(
      clampAvailabilityToBusinessHours([{ dayOfWeek: 0, startMinute: 7 * 60, endMinute: 23 * 60 }], hours),
    ).toEqual([{ dayOfWeek: 0, startMinute: 9 * 60, endMinute: 21 * 60 }]);
  });

  it("keeps a rule that is already inside opening hours", () => {
    const rule = { dayOfWeek: 0, startMinute: 10 * 60, endMinute: 18 * 60 };
    expect(clampAvailabilityToBusinessHours([rule], hours)).toEqual([rule]);
  });

  it("drops rules on a closed day and rules entirely outside opening hours", () => {
    expect(
      clampAvailabilityToBusinessHours(
        [
          { dayOfWeek: 5, startMinute: 10 * 60, endMinute: 18 * 60 },
          { dayOfWeek: 0, startMinute: 21 * 60, endMinute: 23 * 60 },
        ],
        hours,
      ),
    ).toEqual([]);
  });

  it("leaves days without configured hours untouched", () => {
    const rule = { dayOfWeek: 3, startMinute: 60, endMinute: 120 };
    expect(clampAvailabilityToBusinessHours([rule], hours)).toEqual([rule]);
  });
});
