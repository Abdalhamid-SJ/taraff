"use server";

import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isBeauticianFreeAt } from "@/lib/scheduling";
import { getSchedulingSettings } from "@/lib/settings";
import { requireAdminSession } from "./require-admin";
import { toBeauticianCandidate } from "./scheduling-data";

function revalidateAdmin() {
  revalidatePath("/[locale]/admin", "layout");
}

export async function updateBookingStatusAction(bookingId: string, status: BookingStatus) {
  await requireAdminSession();
  await prisma.booking.update({ where: { id: bookingId }, data: { status } });
  revalidateAdmin();
}

export async function toggleAddressVerifiedAction(bookingId: string, verified: boolean) {
  await requireAdminSession();
  await prisma.booking.update({ where: { id: bookingId }, data: { addressVerified: verified } });
  revalidateAdmin();
}

export async function updateAdminNotesAction(bookingId: string, notes: string) {
  await requireAdminSession();
  await prisma.booking.update({ where: { id: bookingId }, data: { adminNotes: notes || null } });
  revalidateAdmin();
}

export async function cancelBookingAdminAction(bookingId: string, reason: string) {
  await requireAdminSession();
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", cancelReason: reason || null },
  });
  revalidateAdmin();
}

export interface ReassignClash {
  type: "TIME_CONFLICT" | "SKILL_MISMATCH" | "AVAILABILITY";
  reference?: string;
}

export type ReassignResult = { ok: true } | { ok: false; clashes: ReassignClash[] };

export async function reassignBookingAction(
  bookingId: string,
  beauticianId: string,
  force: boolean,
): Promise<ReassignResult> {
  await requireAdminSession();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { items: { include: { variant: true } } },
  });
  if (!booking) throw new Error("Booking not found");

  const beautician = await prisma.beautician.findUnique({
    where: { id: beauticianId },
    include: { skills: true, areas: true, availability: true, timeOff: true },
  });
  if (!beautician) throw new Error("Beautician not found");

  const clashes: ReassignClash[] = [];

  const serviceIds = Array.from(new Set(booking.items.map((i) => i.variant.serviceId)));
  const beauticianServiceIds = new Set(beautician.skills.map((s) => s.serviceId));
  if (serviceIds.some((id) => !beauticianServiceIds.has(id))) {
    clashes.push({ type: "SKILL_MISMATCH" });
  }

  const candidate = toBeauticianCandidate(beautician);
  const chosenSlot = { start: booking.scheduledStart, end: booking.scheduledEnd };

  if (!isBeauticianFreeAt(candidate, chosenSlot, [])) {
    clashes.push({ type: "AVAILABILITY" });
  }

  const overlapping = await prisma.booking.findFirst({
    where: {
      beauticianId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      id: { not: bookingId },
      scheduledStart: { lt: chosenSlot.end },
      scheduledEnd: { gt: chosenSlot.start },
    },
    select: { reference: true },
  });
  if (overlapping) {
    clashes.push({ type: "TIME_CONFLICT", reference: overlapping.reference });
  }

  if (clashes.length > 0 && !force) {
    return { ok: false, clashes };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { beauticianId, assignedBy: "ADMIN" },
  });
  revalidateAdmin();
  return { ok: true };
}

export async function rescheduleBookingAction(
  bookingId: string,
  newStartIso: string,
  force: boolean,
): Promise<ReassignResult> {
  await requireAdminSession();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      items: true,
      beautician: { include: { skills: true, areas: true, availability: true, timeOff: true } },
    },
  });
  if (!booking) throw new Error("Booking not found");

  const newStart = new Date(newStartIso);
  const totalMinutes = booking.items.reduce((sum, i) => sum + i.durationMinutes * i.quantity, 0);
  const settings = await getSchedulingSettings();
  const newEnd = new Date(newStart.getTime() + (totalMinutes + settings.travelBufferMinutes) * 60000);

  const clashes: ReassignClash[] = [];

  if (booking.beautician) {
    const candidate = toBeauticianCandidate(booking.beautician);
    const chosenSlot = { start: newStart, end: newEnd };

    if (!isBeauticianFreeAt(candidate, chosenSlot, [])) {
      clashes.push({ type: "AVAILABILITY" });
    }

    const overlapping = await prisma.booking.findFirst({
      where: {
        beauticianId: booking.beauticianId as string,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        id: { not: bookingId },
        scheduledStart: { lt: newEnd },
        scheduledEnd: { gt: newStart },
      },
      select: { reference: true },
    });
    if (overlapping) {
      clashes.push({ type: "TIME_CONFLICT", reference: overlapping.reference });
    }
  }

  if (clashes.length > 0 && !force) {
    return { ok: false, clashes };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { scheduledStart: newStart, scheduledEnd: newEnd },
  });
  revalidateAdmin();
  return { ok: true };
}
