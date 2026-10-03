import { describe, expect, it } from "vitest";
import { autoAssignBeautician } from "./assign";
import type { AutoAssignInput, BeauticianCandidate, ExistingBooking } from "./types";

// Chosen slot: 2026-08-20 (Thursday) 10:00–11:45 UTC = 13:00–14:45 Asia/Riyadh.
// The business week containing it runs Sun 2026-08-16 – Sat 2026-08-22.
const CHOSEN_SLOT = {
  start: new Date("2026-08-20T10:00:00.000Z"),
  end: new Date("2026-08-20T11:45:00.000Z"),
};

function makeCandidate(overrides: Partial<BeauticianCandidate> = {}): BeauticianCandidate {
  return {
    id: "beautician-a",
    isActive: true,
    serviceIds: ["svc-haircut"],
    areaIds: ["area-deira"],
    availability: [{ dayOfWeek: 4, startMinute: 10 * 60, endMinute: 20 * 60 }],
    timeOff: [],
    ...overrides,
  };
}

function input(overrides: Partial<AutoAssignInput> = {}): AutoAssignInput {
  return {
    candidates: [],
    chosenSlot: CHOSEN_SLOT,
    existingBookings: [],
    ...overrides,
  };
}

describe("autoAssignBeautician — fewest bookings that day", () => {
  it("prefers the candidate with fewer bookings on the chosen day", () => {
    const busy = makeCandidate({ id: "beautician-busy" });
    const free = makeCandidate({ id: "beautician-free" });
    const existingBookings: ExistingBooking[] = [
      {
        beauticianId: "beautician-busy",
        scheduledStart: new Date("2026-08-20T05:00:00.000Z"), // 08:00 Riyadh, doesn't overlap chosen slot
        scheduledEnd: new Date("2026-08-20T06:00:00.000Z"),
      },
    ];
    const result = autoAssignBeautician(
      input({ candidates: [busy, free], existingBookings }),
    );
    expect(result?.id).toBe("beautician-free");
  });
});

describe("autoAssignBeautician — earliest-ending previous job (smallest gap minimises travel)", () => {
  it("prefers whoever's previous job ends closest to the new slot's start, when booking counts tie", () => {
    const nearby = makeCandidate({ id: "beautician-nearby" });
    const distant = makeCandidate({ id: "beautician-distant" });
    const existingBookings: ExistingBooking[] = [
      {
        beauticianId: "beautician-nearby",
        scheduledStart: new Date("2026-08-20T08:00:00.000Z"),
        scheduledEnd: new Date("2026-08-20T09:00:00.000Z"), // ends 12:00 Riyadh — 1h gap to the 13:00 slot
      },
      {
        beauticianId: "beautician-distant",
        scheduledStart: new Date("2026-08-20T07:00:00.000Z"),
        scheduledEnd: new Date("2026-08-20T08:00:00.000Z"), // ends 11:00 Riyadh — 2h gap to the 13:00 slot
      },
    ];
    const result = autoAssignBeautician(
      input({ candidates: [distant, nearby], existingBookings }),
    );
    expect(result?.id).toBe("beautician-nearby");
  });
});

describe("autoAssignBeautician — lowest total load that week", () => {
  it("prefers the candidate with fewer booked minutes this business week, when the above tie", () => {
    const lightWeek = makeCandidate({ id: "beautician-light" });
    const heavyWeek = makeCandidate({ id: "beautician-heavy" });
    const existingBookings: ExistingBooking[] = [
      {
        // heavyWeek: 180 minutes on the Sunday that starts this business week
        beauticianId: "beautician-heavy",
        scheduledStart: new Date("2026-08-16T06:00:00.000Z"),
        scheduledEnd: new Date("2026-08-16T09:00:00.000Z"),
      },
      {
        // lightWeek: 60 minutes on the Monday of this business week
        beauticianId: "beautician-light",
        scheduledStart: new Date("2026-08-17T06:00:00.000Z"),
        scheduledEnd: new Date("2026-08-17T07:00:00.000Z"),
      },
    ];
    const result = autoAssignBeautician(
      input({ candidates: [heavyWeek, lightWeek], existingBookings }),
    );
    expect(result?.id).toBe("beautician-light");
  });
});

describe("autoAssignBeautician — deterministic tie-break by id", () => {
  it("picks the lexicographically smaller id when every other criterion ties", () => {
    const z = makeCandidate({ id: "z-candidate" });
    const a = makeCandidate({ id: "a-candidate" });
    const result = autoAssignBeautician(input({ candidates: [z, a] }));
    expect(result?.id).toBe("a-candidate");
  });
});

describe("autoAssignBeautician — only considers candidates actually free at the chosen slot", () => {
  it("excludes a candidate whose existing booking overlaps the chosen slot", () => {
    const conflicted = makeCandidate({ id: "beautician-conflicted" });
    const free = makeCandidate({ id: "beautician-free" });
    const existingBookings: ExistingBooking[] = [
      {
        beauticianId: "beautician-conflicted",
        scheduledStart: new Date("2026-08-20T10:30:00.000Z"),
        scheduledEnd: new Date("2026-08-20T11:30:00.000Z"), // overlaps the 10:00–11:45 chosen slot
      },
      {
        // give `free` a booking too, so a win isn't just from having the lowest count by accident
        beauticianId: "beautician-free",
        scheduledStart: new Date("2026-08-20T05:00:00.000Z"),
        scheduledEnd: new Date("2026-08-20T06:00:00.000Z"),
      },
    ];
    const result = autoAssignBeautician(
      input({ candidates: [conflicted, free], existingBookings }),
    );
    expect(result?.id).toBe("beautician-free");
  });

  it("excludes a candidate with time off overlapping the chosen slot", () => {
    const onLeave = makeCandidate({
      id: "beautician-on-leave",
      timeOff: [
        {
          startsAt: new Date("2026-08-20T09:00:00.000Z"),
          endsAt: new Date("2026-08-20T12:00:00.000Z"),
        },
      ],
    });
    const free = makeCandidate({ id: "beautician-free" });
    const result = autoAssignBeautician(
      input({ candidates: [onLeave, free] }),
    );
    expect(result?.id).toBe("beautician-free");
  });

  it("excludes a candidate whose weekly availability doesn't cover the chosen slot at all", () => {
    const wrongHours = makeCandidate({
      id: "beautician-wrong-hours",
      availability: [{ dayOfWeek: 4, startMinute: 6 * 60, endMinute: 9 * 60 }], // 06:00–09:00 Riyadh only
    });
    const free = makeCandidate({ id: "beautician-free" });
    const result = autoAssignBeautician(
      input({ candidates: [wrongHours, free] }),
    );
    expect(result?.id).toBe("beautician-free");
  });

  it("returns null when no candidate is free at the chosen slot", () => {
    const conflicted = makeCandidate({ id: "beautician-conflicted" });
    const onLeave = makeCandidate({
      id: "beautician-on-leave",
      timeOff: [
        {
          startsAt: new Date("2026-08-20T09:00:00.000Z"),
          endsAt: new Date("2026-08-20T12:00:00.000Z"),
        },
      ],
    });
    const existingBookings: ExistingBooking[] = [
      {
        beauticianId: "beautician-conflicted",
        scheduledStart: new Date("2026-08-20T10:30:00.000Z"),
        scheduledEnd: new Date("2026-08-20T11:30:00.000Z"),
      },
    ];
    const result = autoAssignBeautician(
      input({ candidates: [conflicted, onLeave], existingBookings }),
    );
    expect(result).toBeNull();
  });

  it("returns null when given no candidates at all", () => {
    expect(autoAssignBeautician(input({ candidates: [] }))).toBeNull();
  });
});
