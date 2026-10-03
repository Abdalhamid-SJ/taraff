"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { BUSINESS_TIME_ZONE, businessHour } from "./dates";

const GROUPS = [
  { key: "slotsMorning", test: (h: number) => h < 12 },
  { key: "slotsAfternoon", test: (h: number) => h >= 12 && h < 17 },
  { key: "slotsEvening", test: (h: number) => h >= 17 },
] as const;

// Start times grouped into morning / afternoon / evening so a long day of
// slots is quick to scan.
export function SlotPicker({
  slots,
  value,
  onChange,
  loading,
  emptyMessage,
}: {
  slots: string[];
  value: string | null;
  onChange: (iso: string) => void;
  loading: boolean;
  emptyMessage: React.ReactNode;
}) {
  const t = useTranslations("Book");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="status" aria-label={t("loadingSlots")}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-full bg-blush" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) return <>{emptyMessage}</>;

  return (
    <div className="space-y-6">
      {GROUPS.map((group) => {
        const groupSlots = slots.filter((iso) => group.test(businessHour(iso)));
        if (groupSlots.length === 0) return null;
        return (
          <div key={group.key}>
            <h4 className="text-sm font-medium text-ink/60">{t(group.key)}</h4>
            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {groupSlots.map((iso, i) => {
                const selected = iso === value;
                return (
                  <motion.button
                    key={iso}
                    type="button"
                    onClick={() => onChange(iso)}
                    aria-pressed={selected}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.02 }}
                    className={`min-h-12 rounded-full border px-2 text-sm font-medium transition-[background-color,border-color,color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                      selected
                        ? "border-mulberry bg-mulberry text-paper shadow-[var(--shadow-soft)]"
                        : "border-ink/10 bg-white text-ink hover:border-mulberry/40 hover:text-mulberry"
                    }`}
                  >
                    {formatter.format(new Date(iso))}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
