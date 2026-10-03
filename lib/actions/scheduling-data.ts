import { prisma } from "@/lib/db";
import {
  businessMinuteToUtc,
  clampAvailabilityToBusinessHours,
  type BeauticianCandidate,
  type BusinessHoursDay,
  type ExistingBooking,
} from "@/lib/scheduling";
import { getBusinessHours } from "@/lib/settings";
import type { Prisma } from "@prisma/client";

const ACTIVE_BOOKING_STATUSES: Prisma.BookingWhereInput["status"] = {
  notIn: ["CANCELLED", "NO_SHOW"],
};

type BeauticianWithRelations = Prisma.BeauticianGetPayload<{
  include: { skills: true; areas: true; availability: true; timeOff: true };
}>;

// `businessHours` trims availability to opening hours (customer-facing flows).
// Admin tools omit it and check against the beautician's own hours only.
export function toBeauticianCandidate(
  b: BeauticianWithRelations,
  businessHours: BusinessHoursDay[] = [],
): BeauticianCandidate {
  const availability = b.availability.map((a) => ({
    dayOfWeek: a.dayOfWeek,
    startMinute: a.startMinute,
    endMinute: a.endMinute,
  }));
  return {
    id: b.id,
    isActive: b.isActive,
    serviceIds: b.skills.map((s) => s.serviceId),
    areaIds: b.areas.map((a) => a.areaId),
    availability: clampAvailabilityToBusinessHours(availability, businessHours),
    timeOff: b.timeOff.map((t) => ({ startsAt: t.startsAt, endsAt: t.endsAt })),
  };
}

// Active beauticians as the customer-facing scheduler sees them: availability
// already limited to the business's opening hours.
export async function loadActiveBeauticianCandidates(): Promise<BeauticianCandidate[]> {
  const [beauticians, businessHours] = await Promise.all([
    prisma.beautician.findMany({
      where: { isActive: true },
      include: { skills: true, areas: true, availability: true, timeOff: true },
    }),
    getBusinessHours(),
  ]);
  return beauticians.map((b) => toBeauticianCandidate(b, businessHours));
}

export function businessDayRangeUtc(dateStr: string): { start: Date; end: Date } {
  const start = businessMinuteToUtc(dateStr, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function loadExistingBookings(
  beauticianIds: string[],
  range: { start: Date; end: Date },
  // A booking being rescheduled must not block its own new time.
  excludeBookingId?: string,
): Promise<ExistingBooking[]> {
  if (beauticianIds.length === 0) return [];
  const rows = await prisma.booking.findMany({
    where: {
      beauticianId: { in: beauticianIds },
      status: ACTIVE_BOOKING_STATUSES,
      scheduledStart: { lt: range.end },
      scheduledEnd: { gt: range.start },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { beauticianId: true, scheduledStart: true, scheduledEnd: true },
  });
  return rows.map((r) => ({
    beauticianId: r.beauticianId as string,
    scheduledStart: r.scheduledStart,
    scheduledEnd: r.scheduledEnd,
  }));
}
