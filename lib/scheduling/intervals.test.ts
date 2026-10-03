import { describe, expect, it } from "vitest";
import { subtractIntervals } from "./intervals";
import type { Interval } from "./types";

// A 09:00–19:00 Asia/Riyadh availability window, expressed in UTC (06:00–16:00Z).
const BASE: Interval = {
  start: new Date("2026-08-20T06:00:00.000Z"),
  end: new Date("2026-08-20T16:00:00.000Z"),
};

function iv(startIso: string, endIso: string): Interval {
  return { start: new Date(startIso), end: new Date(endIso) };
}

describe("subtractIntervals", () => {
  it("returns the base interval unchanged when nothing is occupied", () => {
    expect(subtractIntervals(BASE, [])).toEqual([BASE]);
  });

  it("splits the base interval around a single mid-window occupied block (time off mid-window)", () => {
    // 13:00–15:00 Asia/Riyadh (10:00–12:00 UTC) is carved out of the middle
    const occupied = [iv("2026-08-20T10:00:00.000Z", "2026-08-20T12:00:00.000Z")];
    expect(subtractIntervals(BASE, occupied)).toEqual([
      iv("2026-08-20T06:00:00.000Z", "2026-08-20T10:00:00.000Z"),
      iv("2026-08-20T12:00:00.000Z", "2026-08-20T16:00:00.000Z"),
    ]);
  });

  it("merges two overlapping occupied blocks into a single gap (overlapping bookings)", () => {
    const occupied = [
      iv("2026-08-20T09:00:00.000Z", "2026-08-20T11:00:00.000Z"),
      iv("2026-08-20T10:00:00.000Z", "2026-08-20T13:00:00.000Z"),
    ];
    expect(subtractIntervals(BASE, occupied)).toEqual([
      iv("2026-08-20T06:00:00.000Z", "2026-08-20T09:00:00.000Z"),
      iv("2026-08-20T13:00:00.000Z", "2026-08-20T16:00:00.000Z"),
    ]);
  });

  it("removes from the start when the occupied block touches the window's opening edge", () => {
    const occupied = [iv("2026-08-20T06:00:00.000Z", "2026-08-20T08:00:00.000Z")];
    expect(subtractIntervals(BASE, occupied)).toEqual([
      iv("2026-08-20T08:00:00.000Z", "2026-08-20T16:00:00.000Z"),
    ]);
  });

  it("removes from the end when the occupied block touches the window's closing edge", () => {
    const occupied = [iv("2026-08-20T14:00:00.000Z", "2026-08-20T16:00:00.000Z")];
    expect(subtractIntervals(BASE, occupied)).toEqual([
      iv("2026-08-20T06:00:00.000Z", "2026-08-20T14:00:00.000Z"),
    ]);
  });

  it("returns an empty array when an occupied block fully covers the window", () => {
    const occupied = [iv("2026-08-20T05:00:00.000Z", "2026-08-20T17:00:00.000Z")];
    expect(subtractIntervals(BASE, occupied)).toEqual([]);
  });

  it("ignores occupied blocks entirely outside the base window", () => {
    const occupied = [
      iv("2026-08-20T02:00:00.000Z", "2026-08-20T04:00:00.000Z"),
      iv("2026-08-20T18:00:00.000Z", "2026-08-20T20:00:00.000Z"),
    ];
    expect(subtractIntervals(BASE, occupied)).toEqual([BASE]);
  });

  it("treats a booking that merely touches the window edge as non-overlapping (back-to-back is allowed)", () => {
    // An existing booking ending exactly at the window's start should not truncate anything —
    // scheduledEnd already includes the travel buffer, so back-to-back is a valid boundary.
    const occupied = [iv("2026-08-20T04:00:00.000Z", "2026-08-20T06:00:00.000Z")];
    expect(subtractIntervals(BASE, occupied)).toEqual([BASE]);
  });
});
