"use client";

import { useTransition } from "react";
import type { BookingStatus } from "@prisma/client";
import { updateBookingStatusAction } from "@/lib/actions/admin-bookings";
import { Button } from "@/components/ui/button";

export function QuickStatusButton({
  bookingId,
  nextStatus,
  label,
}: {
  bookingId: string;
  nextStatus: BookingStatus;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => updateBookingStatusAction(bookingId, nextStatus))}
      className="min-h-11 bg-mulberry text-paper hover:opacity-90"
    >
      {label}
    </Button>
  );
}
