import { describe, expect, it } from "vitest";
import { computeOpenSlots } from "./slots";
import type {
  BeauticianCandidate,
  ComputeOpenSlotsInput,
  ExistingBooking,
  SchedulingSettings,
} from "./types";

// 2026-08-20 and 2026-01-15 are both confirmed Thursdays (dayOfWeek 4);
// picked deliberately so the same beautician fixture (Thursday 10:00–20:00)
// works for both the summer and winter timezone-math cases.
const SETTINGS: SchedulingSettings = {
  travelBufferMinutes: 45,
  bookingLeadTimeHours: 3,
  maxAdvanceDays: 30,
  slotGranularityMinutes: 30,
};

function makeBeautician(
  overrides: Partial<BeauticianCandidate> = {},
): BeauticianCandidate {
  return {
    id: "beautician-1",
    isActive: true,
    serviceIds: ["svc-haircut"],
    areaIds: ["area-deira"],
    availability: [{ dayOfWeek: 4, startMinute: 10 * 60, endMinute: 20 * 60 }],
    timeOff: [],
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<ComputeOpenSlotsInput> = {},
): ComputeOpenSlotsInput {
  return {
    dateStr: "2026-08-20",
    areaId: "area-deira",
    serviceIds: ["svc-haircut"],
    variantDurations: [60], // 60-minute job; + 45min travel buffer = 105min needed
    beauticians: [makeBeautician()],
    existingBookings: [],
    settings: SETTINGS,
    now: new Date("2026-08-15T00:00:00.000Z"), // well clear of lead-time/advance cutoffs by default
    ...overrides,
  };
}

function starts(result: { start: Date }[]): string[] {
  return result.map((s) => s.start.toISOString());
}

describe("computeOpenSlots — open window, no conflicts", () => {
  it("walks the full 10:00–20:00 window on a 30-minute grid, honoring the 60+45min job length", () => {
    const result = computeOpenSlots(baseInput());
    const iso = starts(result);
    expect(iso).toHaveLength(17);
    expect(iso[0]).toBe("2026-08-20T07:00:00.000Z"); // 10:00 Riyadh
    expect(iso[iso.length - 1]).toBe("2026-08-20T15:00:00.000Z"); // 18:00 Riyadh
  });
});

describe("computeOpenSlots — travel buffer at window edges", () => {
  it("keeps the last slot that exactly fits duration+buffer before closing, drops the next one", () => {
    const result = computeOpenSlots(baseInput());
    const iso = starts(result);
    // 18:00 Riyadh + 105min = 19:45, fits before 20:00 close
    expect(iso).toContain("2026-08-20T15:00:00.000Z");
    // 18:30 Riyadh + 105min = 20:15, past the 20:00 close
    expect(iso).not.toContain("2026-08-20T15:30:00.000Z");
  });
});

describe("computeOpenSlots — overlapping bookings", () => {
  it("blocks slots that would overlap an existing booking, but allows back-to-back slots", () => {
    const existingBookings: ExistingBooking[] = [
      {
        beauticianId: "beautician-1",
        scheduledStart: new Date("2026-08-20T10:00:00.000Z"), // 13:00 Riyadh
        scheduledEnd: new Date("2026-08-20T11:00:00.000Z"), // 14:00 Riyadh — already includes travel buffer
      },
    ];
    const result = computeOpenSlots(baseInput({ existingBookings }));
    const iso = starts(result);

    expect(iso).toContain("2026-08-20T08:00:00.000Z"); // 11:00 Riyadh — ends 12:45, clear of the booking
    expect(iso).not.toContain("2026-08-20T08:30:00.000Z"); // 11:30 Riyadh — would run into the booking
    expect(iso).toContain("2026-08-20T11:00:00.000Z"); // 14:00 Riyadh — starts exactly as the booking ends
  });
});

describe("computeOpenSlots — time off mid-window", () => {
  it("blocks slots that would run into a time-off block placed mid-day, allows back-to-back after it", () => {
    const beautician = makeBeautician({
      timeOff: [
        {
          startsAt: new Date("2026-08-20T11:00:00.000Z"), // 14:00 Riyadh
          endsAt: new Date("2026-08-20T13:00:00.000Z"), // 16:00 Riyadh
        },
      ],
    });
    const result = computeOpenSlots(
      baseInput({ beauticians: [beautician] }),
    );
    const iso = starts(result);

    expect(iso).not.toContain("2026-08-20T10:00:00.000Z"); // 13:00 Riyadh — would run into the time off
    expect(iso).toContain("2026-08-20T13:00:00.000Z"); // 16:00 Riyadh — starts exactly as time off ends
  });
});

describe("computeOpenSlots — no eligible beautician", () => {
  it("returns an empty array when no beautician covers the requested area", () => {
    const beautician = makeBeautician({ areaIds: ["area-marina"] });
    const result = computeOpenSlots(
      baseInput({ beauticians: [beautician] }),
    );
    expect(result).toEqual([]);
  });

  it("returns an empty array when there are no beauticians at all", () => {
    const result = computeOpenSlots(baseInput({ beauticians: [] }));
    expect(result).toEqual([]);
  });
});

describe("computeOpenSlots — DST-free but timezone-correct math", () => {
  it("applies the same fixed +03:00 offset for a January date as for an August date", () => {
    const result = computeOpenSlots(
      baseInput({
        dateStr: "2026-01-15", // also a Thursday
        now: new Date("2026-01-10T00:00:00.000Z"),
      }),
    );
    const iso = starts(result);
    expect(iso[0]).toBe("2026-01-15T07:00:00.000Z"); // 10:00 Riyadh, identical offset to the August case
  });
});

describe("computeOpenSlots — lead-time cutoff", () => {
  it("drops slots inside bookingLeadTimeHours from now, keeps the one exactly at the cutoff", () => {
    const result = computeOpenSlots(
      baseInput({
        now: new Date("2026-08-20T05:00:00.000Z"), // 08:00 Riyadh; +3h lead time = 11:00 Riyadh cutoff
      }),
    );
    const iso = starts(result);

    expect(iso).not.toContain("2026-08-20T07:00:00.000Z"); // 10:00 Riyadh — inside the lead time
    expect(iso).not.toContain("2026-08-20T07:30:00.000Z"); // 10:30 Riyadh — inside the lead time
    expect(iso).toContain("2026-08-20T08:00:00.000Z"); // 11:00 Riyadh — exactly at the cutoff
  });

  it("drops every slot on a date that falls entirely beyond maxAdvanceDays from now", () => {
    const result = computeOpenSlots(
      baseInput({
        dateStr: "2026-08-27", // also a Thursday, 7 days after `now`
        now: new Date("2026-08-20T00:00:00.000Z"),
        settings: { ...SETTINGS, maxAdvanceDays: 5 },
      }),
    );
    expect(result).toEqual([]);
  });
});
