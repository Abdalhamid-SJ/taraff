"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { HorizontalScroller } from "./horizontal-scroller";
import { addDays, formatDay, todayBusinessDateStr } from "./dates";

// A sideways row of upcoming days. Easier on a phone than a native date
// input, and it can't offer a day outside the booking window.
export function DayStrip({
  days,
  value,
  onChange,
}: {
  days: string[];
  value: string;
  onChange: (dateStr: string) => void;
}) {
  const t = useTranslations("Book");
  const locale = useLocale();
  const selectedRef = useRef<HTMLButtonElement>(null);
  const today = todayBusinessDateStr();
  const tomorrow = addDays(today, 1);

  // Bring the chosen day into view (e.g. after "find next available").
  useEffect(() => {
    const el = selectedRef.current;
    const track = el?.parentElement;
    if (!el || !track) return;
    const elBox = el.getBoundingClientRect();
    const trackBox = track.getBoundingClientRect();
    if (elBox.left < trackBox.left || elBox.right > trackBox.right) {
      track.scrollBy({
        left: elBox.left - trackBox.left - trackBox.width / 2 + elBox.width / 2,
        behavior: "smooth",
      });
    }
  }, [value]);

  return (
    <HorizontalScroller label={t("daysNav")} trackClassName="gap-2 px-0.5 py-1">
      {days.map((day) => {
        const selected = day === value;
        const relative = day === today ? t("today") : day === tomorrow ? t("tomorrow") : null;
        return (
          <button
            key={day}
            ref={selected ? selectedRef : undefined}
            type="button"
            onClick={() => onChange(day)}
            aria-pressed={selected}
            className={`flex min-h-[4.5rem] w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-2xl border text-center transition-[background-color,border-color,color,transform] duration-200 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
              selected
                ? "border-mulberry bg-mulberry text-paper shadow-[var(--shadow-lift)]"
                : "border-ink/10 bg-white text-ink hover:border-mulberry/40"
            }`}
          >
            <span className={`text-xs ${selected ? "text-paper/80" : "text-ink/55"}`}>
              {relative ?? formatDay(day, locale, { weekday: "short" })}
            </span>
            <span className="font-display text-xl leading-tight font-semibold">
              {formatDay(day, locale, { day: "numeric" })}
            </span>
            <span className={`text-[11px] ${selected ? "text-paper/80" : "text-ink/55"}`}>
              {formatDay(day, locale, { month: "short" })}
            </span>
          </button>
        );
      })}
    </HorizontalScroller>
  );
}
