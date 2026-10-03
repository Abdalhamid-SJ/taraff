import { sumDurationMinutes } from "./duration";
import { getEligibleBeauticians } from "./eligibility";
import { subtractIntervals } from "./intervals";
import { BUSINESS_TIME_ZONE, businessDayOfWeek, businessMinuteToUtc } from "./timezone";
import type { ComputeOpenSlotsInput, Interval, OpenSlot } from "./types";

const MINUTES_PER_DAY = 24 * 60;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function gridStartsWithinFreeWindow(
  free: Interval,
  dateStr: string,
  neededMinutes: number,
  granularityMinutes: number,
  timeZone: string,
): Date[] {
  const neededMs = neededMinutes * 60 * 1000;
  const starts: Date[] = [];
  for (let minute = 0; minute < MINUTES_PER_DAY; minute += granularityMinutes) {
    const slotStart = businessMinuteToUtc(dateStr, minute, timeZone);
    const slotStartMs = slotStart.getTime();
    if (slotStartMs < free.start.getTime()) continue;
    if (slotStartMs + neededMs > free.end.getTime()) continue;
    starts.push(slotStart);
  }
  return starts;
}

export function computeOpenSlots(input: ComputeOpenSlotsInput): OpenSlot[] {
  const timeZone = input.timeZone ?? BUSINESS_TIME_ZONE;
  const totalDuration = sumDurationMinutes(input.variantDurations);
  const neededMinutes = totalDuration + input.settings.travelBufferMinutes;

  const eligible = getEligibleBeauticians(input.beauticians, {
    areaId: input.areaId,
    serviceIds: input.serviceIds,
  });
  if (eligible.length === 0) return [];

  const earliestAllowed = new Date(
    input.now.getTime() + input.settings.bookingLeadTimeHours * HOUR_MS,
  );
  const latestAllowed = new Date(
    input.now.getTime() + input.settings.maxAdvanceDays * DAY_MS,
  );

  const dayOfWeek = businessDayOfWeek(input.dateStr);
  const slotsByEpoch = new Map<number, Date>();

  for (const beautician of eligible) {
    const rules = beautician.availability.filter((r) => r.dayOfWeek === dayOfWeek);
    if (rules.length === 0) continue;

    const occupied: Interval[] = [
      ...beautician.timeOff.map((t) => ({ start: t.startsAt, end: t.endsAt })),
      ...input.existingBookings
        .filter((b) => b.beauticianId === beautician.id)
        .map((b) => ({ start: b.scheduledStart, end: b.scheduledEnd })),
    ];

    for (const rule of rules) {
      const window: Interval = {
        start: businessMinuteToUtc(input.dateStr, rule.startMinute, timeZone),
        end: businessMinuteToUtc(input.dateStr, rule.endMinute, timeZone),
      };
      const freeWindows = subtractIntervals(window, occupied);

      for (const free of freeWindows) {
        const starts = gridStartsWithinFreeWindow(
          free,
          input.dateStr,
          neededMinutes,
          input.settings.slotGranularityMinutes,
          timeZone,
        );
        for (const start of starts) {
          if (start < earliestAllowed) continue;
          if (start > latestAllowed) continue;
          slotsByEpoch.set(start.getTime(), start);
        }
      }
    }
  }

  return Array.from(slotsByEpoch.values())
    .sort((a, b) => a.getTime() - b.getTime())
    .map((start) => ({ start }));
}
