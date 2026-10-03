"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { generateBookingReference } from "@/lib/booking-reference";
import { isCustomerRole } from "@/lib/auth-roles";
import { bookingPermissions, mapBookingToDto, type BookingDto } from "@/lib/booking-dto";
import { totalsForLines } from "@/lib/pricing";
import {
  autoAssignBeautician,
  businessDateString,
  computeOpenSlots,
  getEligibleBeauticians,
  isBeauticianFreeAt,
  startOfBusinessWeek,
  type BeauticianCandidate,
  type ExistingBooking,
  type SchedulingSettings,
} from "@/lib/scheduling";
import { getSchedulingSettings } from "@/lib/settings";
import { sendAdminAlert } from "@/lib/notify";
import {
  bookingCancelSchema,
  bookingLookupSchema,
  bookingSubmitSchema,
  openSlotsQuerySchema,
  orderDetailsUpdateSchema,
  orderRescheduleSchema,
  rescheduleSlotsQuerySchema,
} from "@/lib/validation/booking";
import {
  businessDayRangeUtc,
  loadActiveBeauticianCandidates,
  loadExistingBookings,
} from "./scheduling-data";

export type { BookingDto, BookingItemDto } from "@/lib/booking-dto";

const HOUR_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;
const CHANGEABLE_STATUSES = ["PENDING", "CONFIRMED"] as const;

class SlotTakenError extends Error {}
class NoLongerChangeableError extends Error {}

function leadTimeCutoff(settings: SchedulingSettings, now = new Date()): Date {
  return new Date(now.getTime() + settings.bookingLeadTimeHours * HOUR_MS);
}

// ── Cart → live catalog ─────────────────────────────────────────────────────

type CartItem = { variantId: string; quantity: number };

// Resolves cart lines against the live catalog. Prices and durations always
// come from here, never from the client. Returns null if any option is no
// longer bookable (option, service or category switched off).
async function loadCartLines(items: CartItem[]) {
  const variants = await prisma.serviceVariant.findMany({
    where: {
      id: { in: items.map((i) => i.variantId) },
      isActive: true,
      service: { isActive: true, category: { isActive: true } },
    },
    include: { service: true },
  });
  if (variants.length !== items.length) return null;
  const byId = new Map(variants.map((v) => [v.id, v]));
  return items.map((item) => ({ variant: byId.get(item.variantId)!, quantity: item.quantity }));
}

function serviceIdsOf(lines: { serviceId: string }[]): string[] {
  return Array.from(new Set(lines.map((l) => l.serviceId)));
}

// ── Slot search ─────────────────────────────────────────────────────────────

// Everything the scheduler needs to answer "which start times work?" for a
// set of services on a day. Used to list slots AND to re-validate the chosen
// one on submit/reschedule, so both always agree.
async function schedulingContext(input: {
  serviceIds: string[];
  range: { start: Date; end: Date };
  excludeBookingId?: string;
}): Promise<{
  eligible: BeauticianCandidate[];
  existingBookings: ExistingBooking[];
  settings: SchedulingSettings;
}> {
  const [beauticians, settings] = await Promise.all([
    loadActiveBeauticianCandidates(),
    getSchedulingSettings(),
  ]);
  const eligible = getEligibleBeauticians(beauticians, { serviceIds: input.serviceIds });
  const existingBookings = await loadExistingBookings(
    eligible.map((b) => b.id),
    input.range,
    input.excludeBookingId,
  );
  return { eligible, existingBookings, settings };
}

function isOpenSlot(
  start: Date,
  ctx: Awaited<ReturnType<typeof schedulingContext>>,
  serviceIds: string[],
  durations: number[],
): boolean {
  const slots = computeOpenSlots({
    dateStr: businessDateString(start),
    serviceIds,
    variantDurations: durations,
    beauticians: ctx.eligible,
    existingBookings: ctx.existingBookings,
    settings: ctx.settings,
    now: new Date(),
  });
  return slots.some((s) => s.start.getTime() === start.getTime());
}

export interface OpenSlotDto {
  startIso: string;
}

export async function getOpenSlotsAction(raw: unknown): Promise<OpenSlotDto[]> {
  const parsed = openSlotsQuerySchema.safeParse(raw);
  if (!parsed.success) return [];
  const lines = await loadCartLines(parsed.data.items);
  if (!lines) return [];

  const serviceIds = serviceIdsOf(lines.map((l) => l.variant));
  // Each person is a back-to-back appointment, so quantity multiplies time.
  const durations = lines.map((l) => l.variant.durationMinutes * l.quantity);
  const ctx = await schedulingContext({
    serviceIds,
    range: businessDayRangeUtc(parsed.data.dateStr),
  });

  return computeOpenSlots({
    dateStr: parsed.data.dateStr,
    serviceIds,
    variantDurations: durations,
    beauticians: ctx.eligible,
    existingBookings: ctx.existingBookings,
    settings: ctx.settings,
    now: new Date(),
  }).map((s) => ({ startIso: s.start.toISOString() }));
}

// ── Create ──────────────────────────────────────────────────────────────────

export type SubmitBookingResult =
  | { ok: true; reference: string }
  | {
      ok: false;
      error: "INVALID_INPUT" | "AUTH_REQUIRED" | "NO_BEAUTICIAN_AVAILABLE" | "SLOT_TAKEN";
      message: string;
    };

export async function submitBookingAction(raw: unknown): Promise<SubmitBookingResult> {
  const parsed = bookingSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const input = parsed.data;

  // Every booking belongs to a customer account, so it shows up under
  // "My account" and can be managed there later.
  const session = await auth();
  const customer =
    session?.user && isCustomerRole(session.user.role)
      ? await prisma.customer.findUnique({ where: { id: session.user.id }, select: { id: true } })
      : null;
  if (!customer) {
    return { ok: false, error: "AUTH_REQUIRED", message: "Sign in to book" };
  }

  const slotStart = new Date(input.slotStartIso);
  if (Number.isNaN(slotStart.getTime())) {
    return { ok: false, error: "INVALID_INPUT", message: "Invalid slot time" };
  }

  const lines = await loadCartLines(input.items);
  if (!lines) {
    return {
      ok: false,
      error: "INVALID_INPUT",
      message: "One or more selected services is no longer available",
    };
  }

  const { totalHalalas, totalMinutes } = totalsForLines(
    lines.map((l) => ({
      price: l.variant.priceAed,
      durationMinutes: l.variant.durationMinutes,
      quantity: l.quantity,
    })),
  );
  const serviceIds = serviceIdsOf(lines.map((l) => l.variant));

  // A week of bookings: enough for the slot check and for auto-assign's
  // weekly-load tie-break.
  const weekStart = startOfBusinessWeek(slotStart);
  const ctx = await schedulingContext({
    serviceIds,
    range: { start: weekStart, end: new Date(weekStart.getTime() + WEEK_MS) },
  });
  if (ctx.eligible.length === 0) {
    return {
      ok: false,
      error: "NO_BEAUTICIAN_AVAILABLE",
      message: "No beautician is available for this service combination anymore",
    };
  }

  // The chosen time must still be one we would offer right now: inside
  // opening hours, on the time grid, past the lead time and within the
  // booking window. Anything else is treated as "pick another time".
  const durations = lines.map((l) => l.variant.durationMinutes * l.quantity);
  if (!isOpenSlot(slotStart, ctx, serviceIds, durations)) {
    return {
      ok: false,
      error: "SLOT_TAKEN",
      message: "That time is no longer available. Please pick another time.",
    };
  }

  const slotEnd = new Date(
    slotStart.getTime() + (totalMinutes + ctx.settings.travelBufferMinutes) * 60000,
  );
  const assigned = autoAssignBeautician({
    candidates: ctx.eligible,
    chosenSlot: { start: slotStart, end: slotEnd },
    existingBookings: ctx.existingBookings,
  });
  if (!assigned) {
    return {
      ok: false,
      error: "SLOT_TAKEN",
      message: "That slot was just taken. Please pick another time.",
    };
  }

  const total = new Prisma.Decimal(totalHalalas).div(100);

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Race-condition re-check (§5): the data above was read moments ago —
      // re-verify the assigned beautician is still clear before inserting.
      const conflict = await tx.booking.findFirst({
        where: {
          beauticianId: assigned.id,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          scheduledStart: { lt: slotEnd },
          scheduledEnd: { gt: slotStart },
        },
        select: { id: true },
      });
      if (conflict) throw new SlotTakenError();

      let reference = generateBookingReference();
      for (let attempt = 0; attempt < 5; attempt++) {
        const clash = await tx.booking.findUnique({
          where: { reference },
          select: { id: true },
        });
        if (!clash) break;
        reference = generateBookingReference();
      }

      return tx.booking.create({
        data: {
          reference,
          status: "PENDING",
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerId: customer.id,
          areaText: input.areaText,
          addressText: input.addressText,
          addressNotes: input.addressNotes || null,
          scheduledStart: slotStart,
          scheduledEnd: slotEnd,
          beauticianId: assigned.id,
          assignedBy: "AUTO",
          subtotalAed: total,
          totalAed: total, // no fees or discounts in v1
          items: {
            create: lines.map(({ variant, quantity }) => ({
              variantId: variant.id,
              serviceNameEn: variant.service.nameEn,
              serviceNameAr: variant.service.nameAr,
              variantLabelEn: variant.labelEn,
              variantLabelAr: variant.labelAr,
              priceAed: variant.priceAed,
              durationMinutes: variant.durationMinutes,
              quantity,
            })),
          },
        },
      });
    });

    // §7: fire after the transaction commits, never let a notification
    // failure fail the booking — catch, log, and flag it for the dashboard.
    try {
      await sendAdminAlert({
        event: "BOOKING_CREATED",
        bookingReference: created.reference,
        customerName: created.customerName,
        customerPhone: created.customerPhone,
        areaText: created.areaText,
        scheduledStartIso: created.scheduledStart.toISOString(),
        totalAed: Number(created.totalAed),
      });
    } catch (err) {
      console.error("[notify] failed to send booking-created alert", err);
      await prisma.booking
        .update({ where: { id: created.id }, data: { notifyFailedAt: new Date() } })
        .catch((e) => console.error("[notify] failed to record notify failure", e));
    }

    return { ok: true, reference: created.reference };
  } catch (err) {
    if (err instanceof SlotTakenError) {
      return {
        ok: false,
        error: "SLOT_TAKEN",
        message: "That slot was just taken. Please pick another time.",
      };
    }
    throw err;
  }
}

// ── Look up ─────────────────────────────────────────────────────────────────

export type LookupBookingResult =
  | { ok: true; booking: BookingDto }
  | { ok: false; error: "INVALID_INPUT" | "NOT_FOUND" };

export async function lookupBookingAction(raw: unknown): Promise<LookupBookingResult> {
  const parsed = bookingLookupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const reference = parsed.data.reference.toUpperCase();
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { items: true, area: true },
  });

  if (!booking || booking.customerPhone !== parsed.data.phone) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const settings = await getSchedulingSettings();
  return { ok: true, booking: mapBookingToDto(booking, leadTimeCutoff(settings)) };
}

// ── Cancel ──────────────────────────────────────────────────────────────────

export type CancelBookingResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "INVALID_INPUT"
        | "NOT_FOUND"
        | "ALREADY_CANCELLED"
        | "NOT_EDITABLE"
        | "LEAD_TIME_BLOCKED";
    };

export async function cancelBookingAction(raw: unknown): Promise<CancelBookingResult> {
  const parsed = bookingCancelSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const reference = parsed.data.reference.toUpperCase();
  const booking = await prisma.booking.findUnique({ where: { reference } });
  if (!booking || booking.customerPhone !== parsed.data.phone) {
    return { ok: false, error: "NOT_FOUND" };
  }
  if (booking.status === "CANCELLED") {
    return { ok: false, error: "ALREADY_CANCELLED" };
  }

  const settings = await getSchedulingSettings();
  if (!bookingPermissions(booking, leadTimeCutoff(settings)).canCancel) {
    return {
      ok: false,
      error: (CHANGEABLE_STATUSES as readonly string[]).includes(booking.status)
        ? "LEAD_TIME_BLOCKED"
        : "NOT_EDITABLE",
    };
  }

  const cancelReason = parsed.data.reason || "Cancelled by customer";
  // Conditional update: if staff changed the status in the meantime (e.g. the
  // beautician set off), the cancellation doesn't go through.
  const { count } = await prisma.booking.updateMany({
    where: { id: booking.id, status: { in: [...CHANGEABLE_STATUSES] } },
    data: { status: "CANCELLED", cancelReason },
  });
  if (count === 0) return { ok: false, error: "NOT_EDITABLE" };

  // §7: fire on customer cancellation too — after commit, never blocking.
  try {
    await sendAdminAlert({
      event: "BOOKING_CANCELLED",
      bookingReference: booking.reference,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      areaText: booking.areaText,
      scheduledStartIso: booking.scheduledStart.toISOString(),
      totalAed: Number(booking.totalAed),
      cancelReason,
    });
  } catch (err) {
    console.error("[notify] failed to send booking-cancelled alert", err);
    await prisma.booking
      .update({ where: { id: booking.id }, data: { notifyFailedAt: new Date() } })
      .catch((e) => console.error("[notify] failed to record notify failure", e));
  }

  return { ok: true };
}

// ── Reschedule ──────────────────────────────────────────────────────────────

async function loadOwnedBooking(reference: string, phone: string) {
  const booking = await prisma.booking.findUnique({
    where: { reference: reference.toUpperCase() },
    include: { items: { include: { variant: { select: { serviceId: true } } } }, area: true },
  });
  if (!booking || booking.customerPhone !== phone) return null;
  return booking;
}

function bookedDurations(items: { durationMinutes: number; quantity: number }[]): number[] {
  return items.map((i) => i.durationMinutes * i.quantity);
}

// Open start times for moving an existing booking to another day. The booking
// itself is left out of the calendar so it never blocks its own new time.
export async function getRescheduleSlotsAction(raw: unknown): Promise<OpenSlotDto[]> {
  const parsed = rescheduleSlotsQuerySchema.safeParse(raw);
  if (!parsed.success) return [];
  const booking = await loadOwnedBooking(parsed.data.reference, parsed.data.phone);
  if (!booking) return [];

  const settings = await getSchedulingSettings();
  if (!bookingPermissions(booking, leadTimeCutoff(settings)).canReschedule) return [];

  const serviceIds = serviceIdsOf(booking.items.map((i) => i.variant));
  const ctx = await schedulingContext({
    serviceIds,
    range: businessDayRangeUtc(parsed.data.dateStr),
    excludeBookingId: booking.id,
  });

  return computeOpenSlots({
    dateStr: parsed.data.dateStr,
    serviceIds,
    variantDurations: bookedDurations(booking.items),
    beauticians: ctx.eligible,
    existingBookings: ctx.existingBookings,
    settings: ctx.settings,
    now: new Date(),
  })
    .filter((s) => s.start.getTime() !== booking.scheduledStart.getTime())
    .map((s) => ({ startIso: s.start.toISOString() }));
}

export interface RescheduleOrderClash {
  type: "TIME_CONFLICT" | "AVAILABILITY";
}

export type RescheduleOrderResult =
  | { ok: true; booking: BookingDto }
  | {
      ok: false;
      error: "INVALID_INPUT" | "NOT_FOUND" | "NOT_EDITABLE" | "LEAD_TIME_BLOCKED" | "CONFLICT";
      clashes?: RescheduleOrderClash[];
    };

// Customer-facing reschedule. The new time must be one we'd offer for a new
// booking of the same services. If the assigned beautician can't make it but
// a colleague can, the booking moves to that colleague (the admin is alerted
// either way). Unlike the admin equivalent there is no force-override.
export async function rescheduleOrderAction(raw: unknown): Promise<RescheduleOrderResult> {
  const parsed = orderRescheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const booking = await loadOwnedBooking(parsed.data.reference, parsed.data.phone);
  if (!booking) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const settings = await getSchedulingSettings();
  if (!bookingPermissions(booking, leadTimeCutoff(settings)).canReschedule) {
    return {
      ok: false,
      error: (CHANGEABLE_STATUSES as readonly string[]).includes(booking.status)
        ? "LEAD_TIME_BLOCKED"
        : "NOT_EDITABLE",
    };
  }

  const newStart = new Date(parsed.data.newStartIso);
  if (Number.isNaN(newStart.getTime())) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const serviceIds = serviceIdsOf(booking.items.map((i) => i.variant));
  const durations = bookedDurations(booking.items);
  const weekStart = startOfBusinessWeek(newStart);
  const ctx = await schedulingContext({
    serviceIds,
    range: { start: weekStart, end: new Date(weekStart.getTime() + WEEK_MS) },
    excludeBookingId: booking.id,
  });

  if (!isOpenSlot(newStart, ctx, serviceIds, durations)) {
    return { ok: false, error: "CONFLICT", clashes: [{ type: "AVAILABILITY" }] };
  }

  const totalMinutes = durations.reduce((sum, m) => sum + m, 0);
  const newEnd = new Date(newStart.getTime() + (totalMinutes + ctx.settings.travelBufferMinutes) * 60000);
  const chosenSlot = { start: newStart, end: newEnd };

  // Keep the same beautician whenever she's free; otherwise hand it over.
  const current = ctx.eligible.find((b) => b.id === booking.beauticianId);
  const beautician =
    current && isBeauticianFreeAt(current, chosenSlot, ctx.existingBookings)
      ? current
      : autoAssignBeautician({
          candidates: ctx.eligible,
          chosenSlot,
          existingBookings: ctx.existingBookings,
        });
  if (!beautician) {
    return { ok: false, error: "CONFLICT", clashes: [{ type: "TIME_CONFLICT" }] };
  }
  const reassigned = beautician.id !== booking.beauticianId;

  const previousScheduledStartIso = booking.scheduledStart.toISOString();
  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          beauticianId: beautician.id,
          id: { not: booking.id },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          scheduledStart: { lt: newEnd },
          scheduledEnd: { gt: newStart },
        },
        select: { id: true },
      });
      if (conflict) throw new SlotTakenError();

      const { count } = await tx.booking.updateMany({
        where: { id: booking.id, status: { in: [...CHANGEABLE_STATUSES] } },
        data: {
          scheduledStart: newStart,
          scheduledEnd: newEnd,
          ...(reassigned ? { beauticianId: beautician.id, assignedBy: "AUTO" as const } : {}),
        },
      });
      if (count === 0) throw new NoLongerChangeableError();

      return tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: { items: true, area: true },
      });
    });
  } catch (err) {
    if (err instanceof SlotTakenError) {
      return { ok: false, error: "CONFLICT", clashes: [{ type: "TIME_CONFLICT" }] };
    }
    if (err instanceof NoLongerChangeableError) {
      return { ok: false, error: "NOT_EDITABLE" };
    }
    throw err;
  }

  // Operationally equivalent to a cancellation from the beautician's
  // perspective — her schedule just changed. Not in §7's literal trigger
  // list (which predates this feature), but the same "admin needs to know"
  // rationale applies, so it's wired the same way: after commit, never
  // blocking the reschedule itself.
  try {
    await sendAdminAlert({
      event: "BOOKING_RESCHEDULED",
      bookingReference: updated.reference,
      customerName: updated.customerName,
      customerPhone: updated.customerPhone,
      areaText: updated.areaText,
      scheduledStartIso: updated.scheduledStart.toISOString(),
      totalAed: Number(updated.totalAed),
      previousScheduledStartIso,
    });
  } catch (err) {
    console.error("[notify] failed to send booking-rescheduled alert", err);
    await prisma.booking
      .update({ where: { id: updated.id }, data: { notifyFailedAt: new Date() } })
      .catch((e) => console.error("[notify] failed to record notify failure", e));
  }

  return { ok: true, booking: mapBookingToDto(updated, leadTimeCutoff(settings)) };
}

// ── Edit address ────────────────────────────────────────────────────────────

export type UpdateOrderDetailsResult =
  | { ok: true; booking: BookingDto }
  | { ok: false; error: "INVALID_INPUT" | "NOT_FOUND" | "NOT_EDITABLE" };

// Address/notes only — no lead-time gate (see bookingPermissions).
export async function updateOrderDetailsAction(raw: unknown): Promise<UpdateOrderDetailsResult> {
  const parsed = orderDetailsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const reference = parsed.data.reference.toUpperCase();
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { items: true, area: true },
  });
  if (!booking || booking.customerPhone !== parsed.data.phone) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const settings = await getSchedulingSettings();
  const cutoff = leadTimeCutoff(settings);
  if (!bookingPermissions(booking, cutoff).canEditAddress) {
    return { ok: false, error: "NOT_EDITABLE" };
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      addressText: parsed.data.addressText,
      addressNotes: parsed.data.addressNotes || null,
    },
    include: { items: true, area: true },
  });

  return { ok: true, booking: mapBookingToDto(updated, cutoff) };
}
