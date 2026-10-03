import { describe, expect, it } from "vitest";
import {
  businessDateString,
  businessDayOfWeek,
  businessMinuteToUtc,
  startOfBusinessDay,
  startOfBusinessWeek,
} from "./timezone";

// Asia/Riyadh has been a fixed UTC+03:00 offset since 1968, with no DST —
// these tests deliberately compare a summer date and a winter date to prove
// the conversion math doesn't (incorrectly) shift with the season.

describe("businessMinuteToUtc", () => {
  it("converts a business-local morning time to UTC (August)", () => {
    // 10:00 Asia/Riyadh = 07:00 UTC
    expect(businessMinuteToUtc("2026-08-20", 10 * 60).toISOString()).toBe(
      "2026-08-20T07:00:00.000Z",
    );
  });

  it("applies the identical +03:00 offset in January", () => {
    // 10:00 Asia/Riyadh = 07:00 UTC, same offset as the August case
    expect(businessMinuteToUtc("2026-01-15", 10 * 60).toISOString()).toBe(
      "2026-01-15T07:00:00.000Z",
    );
  });

  it("rolls midnight back to the previous UTC calendar day", () => {
    // 00:00 Asia/Riyadh on Aug 20 = 21:00 UTC on Aug 19
    expect(businessMinuteToUtc("2026-08-20", 0).toISOString()).toBe(
      "2026-08-19T21:00:00.000Z",
    );
  });

  it("converts a late-evening minute correctly", () => {
    // 23:30 Asia/Riyadh = 20:30 UTC, same day
    expect(
      businessMinuteToUtc("2026-08-20", 23 * 60 + 30).toISOString(),
    ).toBe("2026-08-20T20:30:00.000Z");
  });
});

describe("businessDayOfWeek", () => {
  it("returns 4 (Thursday) for 2026-08-20", () => {
    expect(businessDayOfWeek("2026-08-20")).toBe(4);
  });

  it("returns 0 (Sunday) for 2026-08-16", () => {
    expect(businessDayOfWeek("2026-08-16")).toBe(0);
  });
});

describe("businessDateString", () => {
  it("formats a UTC instant back to its Asia/Riyadh calendar date", () => {
    // 07:00 UTC = 10:00 Asia/Riyadh, same calendar day
    expect(
      businessDateString(new Date("2026-08-20T07:00:00.000Z")),
    ).toBe("2026-08-20");
  });

  it("rolls over to the next Riyadh calendar day for late UTC times", () => {
    // 21:30 UTC on Aug 19 = 00:30 Asia/Riyadh on Aug 20
    expect(
      businessDateString(new Date("2026-08-19T21:30:00.000Z")),
    ).toBe("2026-08-20");
  });
});

describe("startOfBusinessDay", () => {
  it("returns midnight Asia/Riyadh (as a UTC instant) for the given day", () => {
    const result = startOfBusinessDay(new Date("2026-08-20T12:00:00.000Z"));
    expect(result.toISOString()).toBe("2026-08-19T21:00:00.000Z");
  });
});

describe("startOfBusinessWeek", () => {
  it("returns the Sunday that starts the business week (Thursday reference)", () => {
    // 2026-08-20 is a Thursday; its week starts Sunday 2026-08-16
    const result = startOfBusinessWeek(new Date("2026-08-20T06:00:00.000Z"));
    expect(result.toISOString()).toBe("2026-08-15T21:00:00.000Z");
  });

  it("returns the same instant when the reference is already that Sunday", () => {
    const result = startOfBusinessWeek(new Date("2026-08-16T08:00:00.000Z"));
    expect(result.toISOString()).toBe("2026-08-15T21:00:00.000Z");
  });

  it("does not collapse into the previous week for the following Sunday", () => {
    const result = startOfBusinessWeek(new Date("2026-08-23T08:00:00.000Z"));
    expect(result.toISOString()).toBe("2026-08-22T21:00:00.000Z");
  });
});
