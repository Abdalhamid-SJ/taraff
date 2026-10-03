import {
  BUSINESS_TIME_ZONE,
  businessDateString,
  businessDayOfWeek,
  businessMinuteToUtc,
  startOfBusinessDay,
  startOfBusinessWeek,
} from "./timezone";
import type { AutoAssignInput, BeauticianCandidate, ExistingBooking, Interval } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

// Exported for reuse by admin reassignment/reschedule flows, which need the
// same conflict check for one specific candidate rather than a full
// auto-assign pass over a pool.
export function isBeauticianFreeAt(
  candidate: BeauticianCandidate,
  chosenSlot: Interval,
  existingBookings: ExistingBooking[],
  timeZone: string = BUSINESS_TIME_ZONE,
): boolean {
  const dateStr = businessDateString(chosenSlot.start, timeZone);
  const dayOfWeek = businessDayOfWeek(dateStr);

  const coveredByAvailability = candidate.availability
    .filter((r) => r.dayOfWeek === dayOfWeek)
    .some((r) => {
      const windowStart = businessMinuteToUtc(dateStr, r.startMinute, timeZone);
      const windowEnd = businessMinuteToUtc(dateStr, r.endMinute, timeZone);
      return chosenSlot.start >= windowStart && chosenSlot.end <= windowEnd;
    });
  if (!coveredByAvailability) return false;

  const hasTimeOffConflict = candidate.timeOff.some((t) =>
    intervalsOverlap(chosenSlot, { start: t.startsAt, end: t.endsAt }),
  );
  if (hasTimeOffConflict) return false;

  const hasBookingConflict = existingBookings
    .filter((b) => b.beauticianId === candidate.id)
    .some((b) =>
      intervalsOverlap(chosenSlot, { start: b.scheduledStart, end: b.scheduledEnd }),
    );
  if (hasBookingConflict) return false;

  return true;
}

function countBookingsOnDay(
  candidateId: string,
  dayStart: Date,
  dayEnd: Date,
  existingBookings: ExistingBooking[],
): number {
  return existingBookings.filter(
    (b) =>
      b.beauticianId === candidateId &&
      b.scheduledStart >= dayStart &&
      b.scheduledStart < dayEnd,
  ).length;
}

// Largest end time among jobs that day ending at/before the chosen slot — the
// smallest gap to the new slot, which is what actually minimises travel.
// No prior job that day sorts last (Number.NEGATIVE_INFINITY).
function previousJobEndScore(
  candidateId: string,
  chosenSlotStart: Date,
  dayStart: Date,
  dayEnd: Date,
  existingBookings: ExistingBooking[],
): number {
  const priorEnds = existingBookings
    .filter(
      (b) =>
        b.beauticianId === candidateId &&
        b.scheduledStart >= dayStart &&
        b.scheduledStart < dayEnd &&
        b.scheduledEnd <= chosenSlotStart,
    )
    .map((b) => b.scheduledEnd.getTime());
  return priorEnds.length === 0 ? Number.NEGATIVE_INFINITY : Math.max(...priorEnds);
}

function weeklyLoadMinutes(
  candidateId: string,
  weekStart: Date,
  weekEnd: Date,
  existingBookings: ExistingBooking[],
): number {
  return existingBookings
    .filter(
      (b) =>
        b.beauticianId === candidateId &&
        b.scheduledStart >= weekStart &&
        b.scheduledStart < weekEnd,
    )
    .reduce(
      (sum, b) => sum + (b.scheduledEnd.getTime() - b.scheduledStart.getTime()) / 60000,
      0,
    );
}

export function autoAssignBeautician(input: AutoAssignInput): BeauticianCandidate | null {
  const timeZone = input.timeZone ?? BUSINESS_TIME_ZONE;

  const free = input.candidates.filter((c) =>
    isBeauticianFreeAt(c, input.chosenSlot, input.existingBookings, timeZone),
  );
  if (free.length === 0) return null;

  const dayStart = startOfBusinessDay(input.chosenSlot.start, timeZone);
  const dayEnd = new Date(dayStart.getTime() + DAY_MS);
  const weekStart = startOfBusinessWeek(input.chosenSlot.start, timeZone);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);

  const scored = free.map((candidate) => ({
    candidate,
    bookingsToday: countBookingsOnDay(candidate.id, dayStart, dayEnd, input.existingBookings),
    previousJobEnd: previousJobEndScore(
      candidate.id,
      input.chosenSlot.start,
      dayStart,
      dayEnd,
      input.existingBookings,
    ),
    weeklyLoad: weeklyLoadMinutes(candidate.id, weekStart, weekEnd, input.existingBookings),
  }));

  scored.sort((a, b) => {
    if (a.bookingsToday !== b.bookingsToday) return a.bookingsToday - b.bookingsToday;
    if (a.previousJobEnd !== b.previousJobEnd) return b.previousJobEnd - a.previousJobEnd;
    if (a.weeklyLoad !== b.weeklyLoad) return a.weeklyLoad - b.weeklyLoad;
    if (a.candidate.id < b.candidate.id) return -1;
    if (a.candidate.id > b.candidate.id) return 1;
    return 0;
  });

  return scored[0].candidate;
}
