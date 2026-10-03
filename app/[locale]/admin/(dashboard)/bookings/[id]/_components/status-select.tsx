"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { BookingStatus } from "@prisma/client";
import { updateBookingStatusAction } from "@/lib/actions/admin-bookings";

const STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ON_THE_WAY",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export function StatusSelect({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  const t = useTranslations("BookingStatus");
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => updateBookingStatusAction(bookingId, e.target.value as BookingStatus))
      }
      className="min-h-11 rounded-md border border-border bg-paper px-3 text-sm text-ink"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(s)}
        </option>
      ))}
    </select>
  );
}
