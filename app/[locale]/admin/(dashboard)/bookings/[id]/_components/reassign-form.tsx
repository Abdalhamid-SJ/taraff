"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { reassignBookingAction, type ReassignClash } from "@/lib/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { ClashList } from "./clash-list";

export function ReassignForm({
  bookingId,
  currentBeauticianId,
  beauticians,
}: {
  bookingId: string;
  currentBeauticianId: string | null;
  beauticians: { id: string; fullName: string }[];
}) {
  const t = useTranslations("AdminBookings");
  const [selected, setSelected] = useState(currentBeauticianId ?? "");
  const [clashes, setClashes] = useState<ReassignClash[] | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(force: boolean) {
    if (!selected) return;
    startTransition(async () => {
      const result = await reassignBookingAction(bookingId, selected, force);
      setClashes(result.ok ? null : result.clashes);
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          setClashes(null);
        }}
        className="min-h-11 w-full rounded-md border border-border bg-paper px-3 text-sm text-ink"
      >
        <option value="">{t("unassigned")}</option>
        {beauticians.map((b) => (
          <option key={b.id} value={b.id}>
            {b.fullName}
          </option>
        ))}
      </select>

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
        disabled={pending || !selected || selected === currentBeauticianId}
        onClick={() => submit(false)}
        className="bg-mulberry text-paper hover:opacity-90"
      >
        {currentBeauticianId ? t("reassign") : t("assign")}
      </Button>
    </div>
  );
}
