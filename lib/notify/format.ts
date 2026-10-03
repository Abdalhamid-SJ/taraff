import type { AdminAlertPayload } from "./types";

// Internal ops notification copy — sent to staff via WhatsApp/email, not part
// of the customer-facing bilingual UI, so plain English is fine here (no
// AdminUser.locale concept exists to pick a language for it).
export function formatAlertSubject(payload: AdminAlertPayload): string {
  switch (payload.event) {
    case "BOOKING_CREATED":
      return `New booking ${payload.bookingReference}`;
    case "BOOKING_CANCELLED":
      return `Booking cancelled: ${payload.bookingReference}`;
    case "BOOKING_RESCHEDULED":
      return `Booking rescheduled: ${payload.bookingReference}`;
  }
}

export function formatAlertMessage(payload: AdminAlertPayload): string {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(payload.scheduledStartIso));

  const lines = [
    formatAlertSubject(payload),
    `Customer: ${payload.customerName} (${payload.customerPhone})`,
    `Area: ${payload.areaText}`,
    `Scheduled: ${time}`,
    // Plain-text WhatsApp/email body — an inline SVG symbol can't go here, so the
    // ISO code stays for staff notifications.
    `Total: ${payload.totalAed} SAR`,
  ];
  if (payload.event === "BOOKING_CANCELLED" && payload.cancelReason) {
    lines.push(`Reason: ${payload.cancelReason}`);
  }
  if (payload.event === "BOOKING_RESCHEDULED" && payload.previousScheduledStartIso) {
    const previousTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Riyadh",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(payload.previousScheduledStartIso));
    lines.push(`Previously: ${previousTime}`);
  }
  return lines.join("\n");
}
