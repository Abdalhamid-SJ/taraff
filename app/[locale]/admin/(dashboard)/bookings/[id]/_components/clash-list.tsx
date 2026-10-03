"use client";

import { useTranslations } from "next-intl";
import type { ReassignClash } from "@/lib/actions/admin-bookings";

const CLASH_KEY: Record<ReassignClash["type"], string> = {
  TIME_CONFLICT: "clashTimeConflict",
  SKILL_MISMATCH: "clashSkillMismatch",
  AVAILABILITY: "clashAvailability",
};

export function ClashList({ clashes }: { clashes: ReassignClash[] }) {
  const t = useTranslations("AdminBookings");

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <p className="font-medium text-destructive">{t("clashWarning")}</p>
      <ul className="mt-1 list-disc ps-5 text-ink">
        {clashes.map((c, i) => (
          <li key={i}>
            {c.type === "TIME_CONFLICT"
              ? t(CLASH_KEY[c.type], { reference: c.reference ?? "" })
              : t(CLASH_KEY[c.type])}
          </li>
        ))}
      </ul>
    </div>
  );
}
