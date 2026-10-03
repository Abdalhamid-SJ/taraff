"use client";

import { useTranslations } from "next-intl";

// 45 → "45 min", 60 → "1 h", 90 → "1 h 30 min" (localised).
export function useFormatDuration() {
  const t = useTranslations("Book");
  return (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return t("durationMinutes", { minutes });
    if (minutes === 0) return t("durationHours", { hours });
    return t("durationJoin", {
      hours: t("durationHours", { hours }),
      minutes: t("durationMinutes", { minutes }),
    });
  };
}
