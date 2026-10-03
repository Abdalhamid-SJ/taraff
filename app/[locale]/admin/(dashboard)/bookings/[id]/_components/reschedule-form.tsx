"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { businessInputValueToIso, toBusinessInputValue } from "@/lib/business-datetime-input";
import { rescheduleBookingAction, type ReassignClash } from "@/lib/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { ClashList } from "./clash-list";

export function RescheduleForm({
  bookingId,
  scheduledStart,
}: {
  bookingId: string;
  scheduledStart: string;
}) {
  const t = useTranslations("AdminBookings");
  const [value, setValue] = useState(() => toBusinessInputValue(new Date(scheduledStart)));
  const [clashes, setClashes] = useState<ReassignClash[] | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(force: boolean) {
    startTransition(async () => {
      const result = await rescheduleBookingAction(bookingId, businessInputValueToIso(value), force);
      setClashes(result.ok ? null : result.clashes);
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setClashes(null);
        }}
        className="min-h-11 rounded-md border border-border bg-paper px-3 text-sm text-ink"
      />

      {clashes && clashes.length > 0 && (
        <>
          <ClashList clashes={clashes} />
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => submit(true)}
          >
            {t("forceConfirm")}
          </Button>
        </>
      )}

      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => submit(false)}
        className="bg-mulberry text-paper hover:opacity-90"
      >
        {pending ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
