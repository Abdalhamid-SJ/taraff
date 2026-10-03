import type { Prisma } from "@prisma/client";

// Plain, serialisable shape of a booking for customer-facing screens (guest
// lookup and the account page). Not a Server Action module, so it can export
// values as well as types.

export interface BookingItemDto {
  serviceNameEn: string;
  serviceNameAr: string;
  variantLabelEn: string;
  variantLabelAr: string;
  priceAed: number;
  durationMinutes: number;
  quantity: number;
}

export interface BookingDto {
  reference: string;
  status: string;
  customerName: string;
  customerPhone: string;
  addressText: string;
  addressNotes: string | null;
  // Free text the customer typed. Old bookings (made from the pick-list) were
  // backfilled with the area's English name.
  areaText: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  subtotalAed: number;
  totalAed: number;
  items: BookingItemDto[];
  canCancelOnline: boolean;
  // Reschedule shares the same lead-time gate as cancel; editing the
  // address/notes deliberately does not — a customer fixing a typo in their
  // address minutes before the appointment is a good thing, not a risk.
  canRescheduleOnline: boolean;
  canEditAddressOnline: boolean;
}

export type BookingWithItemsAndArea = Prisma.BookingGetPayload<{
  include: { items: true; area: true };
}>;

// Only bookings nobody has acted on yet can be moved or called off online.
// Once the beautician is on the way (or the visit is over) it's a phone call.
const CHANGEABLE_STATUSES = new Set(["PENDING", "CONFIRMED"]);
const ADDRESS_EDITABLE_STATUSES = new Set(["PENDING", "CONFIRMED", "ON_THE_WAY"]);

export interface BookingPermissions {
  canCancel: boolean;
  canReschedule: boolean;
  canEditAddress: boolean;
}

// Single source of truth for what a customer may do with a booking: the UI
// shows buttons from it and the Server Actions enforce it.
export function bookingPermissions(
  booking: { status: string; scheduledStart: Date },
  leadTimeCutoff: Date,
): BookingPermissions {
  const changeable = CHANGEABLE_STATUSES.has(booking.status);
  const beforeCutoff = booking.scheduledStart >= leadTimeCutoff;
  return {
    canCancel: changeable && beforeCutoff,
    canReschedule: changeable && beforeCutoff,
    canEditAddress: ADDRESS_EDITABLE_STATUSES.has(booking.status),
  };
}

export function mapBookingToDto(
  booking: BookingWithItemsAndArea,
  leadTimeCutoff: Date,
): BookingDto {
  const permissions = bookingPermissions(booking, leadTimeCutoff);
  return {
    reference: booking.reference,
    status: booking.status,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    addressText: booking.addressText,
    addressNotes: booking.addressNotes,
    areaText: booking.areaText || booking.area?.nameEn || "",
    scheduledStartIso: booking.scheduledStart.toISOString(),
    scheduledEndIso: booking.scheduledEnd.toISOString(),
    subtotalAed: Number(booking.subtotalAed),
    totalAed: Number(booking.totalAed),
    items: booking.items.map((i) => ({
      serviceNameEn: i.serviceNameEn,
      serviceNameAr: i.serviceNameAr,
      variantLabelEn: i.variantLabelEn,
      variantLabelAr: i.variantLabelAr,
      priceAed: Number(i.priceAed),
      durationMinutes: i.durationMinutes,
      quantity: i.quantity,
    })),
    canCancelOnline: permissions.canCancel,
    canRescheduleOnline: permissions.canReschedule,
    canEditAddressOnline: permissions.canEditAddress,
  };
}
