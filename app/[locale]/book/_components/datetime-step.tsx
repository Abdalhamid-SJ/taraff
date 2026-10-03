"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarSearch, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { getOpenSlotsAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { addDays, upcomingDays } from "@/components/booking/dates";
import { DayStrip } from "@/components/booking/day-strip";
import { SlotPicker } from "@/components/booking/slot-picker";
import { useFormatDuration } from "@/components/booking/use-format-duration";
import type { CartLine } from "../_lib/types";

// How far "find the next available day" looks ahead before giving up.
const SEARCH_AHEAD_DAYS = 14;

export function DateTimeStep({
  lines,
  totalMinutes,
  dateStr,
  slotIso,
  maxAdvanceDays,
  onChangeDate,
  onChangeSlot,
  onBack,
  onNext,
}: {
  lines: CartLine[];
  totalMinutes: number;
  dateStr: string;
  slotIso: string | null;
  maxAdvanceDays: number;
  onChangeDate: (dateStr: string) => void;
  onChangeSlot: (slotIso: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("Book");
  const formatDuration = useFormatDuration();
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [nothingSoon, setNothingSoon] = useState(false);

  const days = useMemo(() => upcomingDays(maxAdvanceDays + 1), [maxAdvanceDays]);
  // Quantity changes the appointment length, so it is part of the query.
  const itemsKey = lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");

  // A date from an old link (in the past or beyond the window) snaps back.
  useEffect(() => {
    if (!days.includes(dateStr)) onChangeDate(days[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, days]);

  useEffect(() => {
    if (lines.length === 0 || !days.includes(dateStr)) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNothingSoon(false);
    getOpenSlotsAction({ dateStr, items: lines })
      .then((result) => {
        if (!cancelled) setSlots(result.map((s) => s.startIso));
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, dateStr, days]);

  async function findNextAvailable() {
    setSearching(true);
    setNothingSoon(false);
    const lastDay = days[days.length - 1];
    let day = dateStr;
    for (let i = 0; i < SEARCH_AHEAD_DAYS; i++) {
      day = addDays(day, 1);
      if (day > lastDay) break;
      const result = await getOpenSlotsAction({ dateStr: day, items: lines }).catch(() => []);
      if (result.length > 0) {
        setSearching(false);
        onChangeDate(day);
        return;
      }
    }
    setSearching(false);
    setNothingSoon(true);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {t("dateTimeHeading")}
      </h2>
      <p className="mt-2 text-ink/70">{t("dateTimeSubheading")}</p>
      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-blush/70 px-4 py-1.5 text-sm font-medium text-ink">
        <Clock className="size-4 text-mulberry" aria-hidden="true" />
        {t("appointmentLength", { duration: formatDuration(totalMinutes) })}
      </p>

      <div className="mt-8">
        <DayStrip days={days} value={dateStr} onChange={onChangeDate} />
      </div>

      <div className="mt-8">
        <h3 className="sr-only">{t("slotsHeading")}</h3>
        <SlotPicker
          slots={slots}
          value={slotIso}
          onChange={onChangeSlot}
          loading={loading}
          emptyMessage={
            <div className="rounded-[1.5rem] border border-dashed border-ink/15 px-6 py-8 text-center">
              <p className="text-ink/70">{nothingSoon ? t("noSlotsSoon") : t("noSlots")}</p>
              {!nothingSoon && dateStr !== days[days.length - 1] && (
                <button
                  type="button"
                  onClick={findNextAvailable}
                  disabled={searching}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-mulberry/30 bg-white px-5 text-sm font-medium text-mulberry transition-colors hover:bg-blush disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  <CalendarSearch className="size-4" aria-hidden="true" />
                  {searching ? t("searchingNext") : t("findNextAvailable")}
                </button>
              )}
            </div>
          }
        />
        {!loading && slots.length > 0 && !slotIso && (
          <p className="mt-4 text-sm text-ink/55">{t("selectSlotPrompt")}</p>
        )}
      </div>

      <div className="mt-10 flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="min-h-12 rounded-full px-6">
          {t("back")}
        </Button>
        <Button
          type="button"
          disabled={!slotIso || !slots.includes(slotIso)}
          onClick={onNext}
          className="min-h-12 rounded-full bg-mulberry px-8 text-paper shadow-[var(--shadow-lift)] hover:opacity-90"
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}

