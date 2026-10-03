"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cancelBookingAdminAction } from "@/lib/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CancelForm({ bookingId }: { bookingId: string }) {
  const t = useTranslations("AdminBookings");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
        className="min-h-11"
      >
        {t("cancelBooking")}
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-destructive/30 p-3">
      <p className="text-sm text-ink">{t("confirmCancelPrompt")}</p>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("cancelReasonPlaceholder")}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => cancelBookingAdminAction(bookingId, reason))}
        >
          {t("confirmCancelYes")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          {t("confirmCancelNo")}
        </Button>
      </div>
    </div>
  );
}
