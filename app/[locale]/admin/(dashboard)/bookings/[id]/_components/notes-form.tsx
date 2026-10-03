"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateAdminNotesAction } from "@/lib/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NotesForm({ bookingId, notes }: { bookingId: string; notes: string | null }) {
  const t = useTranslations("AdminBookings");
  const [value, setValue] = useState(notes ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("notesPlaceholder")}
      />
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => updateAdminNotesAction(bookingId, value))}
        className="bg-mulberry text-paper hover:opacity-90"
      >
        {pending ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
