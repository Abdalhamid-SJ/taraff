import type { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { businessDateString, businessMinuteToUtc } from "@/lib/scheduling";
import { businessDayRangeUtc } from "@/lib/actions/scheduling-data";

export function getTodayBookings() {
  const dateStr = businessDateString(new Date());
  const range = businessDayRangeUtc(dateStr);
  return prisma.booking.findMany({
    where: {
      scheduledStart: { gte: range.start, lt: range.end },
    },
    include: {
      beautician: { select: { id: true, fullName: true } },
      items: true,
    },
    orderBy: { scheduledStart: "asc" },
  });
}

export interface BookingListFilters {
  status?: string;
  area?: string; // free-text, matched as a case-insensitive "contains"
  beauticianId?: string;
  from?: string; // business date "YYYY-MM-DD"
  to?: string; // business date "YYYY-MM-DD"
}

const VALID_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ON_THE_WAY",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export function getFilteredBookings(filters: BookingListFilters) {
  const where: Prisma.BookingWhereInput = {};

  if (filters.status && VALID_STATUSES.includes(filters.status as BookingStatus)) {
    where.status = filters.status as BookingStatus;
  }
  if (filters.area?.trim()) {
    where.areaText = { contains: filters.area.trim(), mode: "insensitive" };
  }
  if (filters.beauticianId) where.beauticianId = filters.beauticianId;

  if (filters.from || filters.to) {
    where.scheduledStart = {
      ...(filters.from ? { gte: businessMinuteToUtc(filters.from, 0) } : {}),
      ...(filters.to ? { lt: businessDayRangeUtc(filters.to).end } : {}),
    };
  }

  return prisma.booking.findMany({
    where,
    include: {
      beautician: { select: { id: true, fullName: true } },
      items: true,
    },
    orderBy: { scheduledStart: "asc" },
    take: 300,
  });
}

export function getAllBeauticiansForFilter() {
  return prisma.beautician.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
  });
}

export function getActiveBeauticiansForReassign() {
  return prisma.beautician.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
  });
}

export function getBookingDetail(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      beautician: true,
      items: true,
    },
  });
}
