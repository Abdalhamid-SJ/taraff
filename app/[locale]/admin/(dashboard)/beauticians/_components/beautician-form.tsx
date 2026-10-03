"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { saveBeauticianAction } from "@/lib/actions/admin-beauticians";
import { businessInputValueToIso, toBusinessInputValue } from "@/lib/business-datetime-input";
import { getLocalized } from "@/lib/localized";
import { ImageUpload } from "@/app/[locale]/admin/_components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DAY_KEYS = ["day0", "day1", "day2", "day3", "day4", "day5", "day6"] as const;

interface DaySlot {
  enabled: boolean;
  startMinute: number;
  endMinute: number;
}

interface TimeOffRow {
  id?: string;
  startsAt: string; // datetime-local value, business-local wall time
  endsAt: string;
  reason: string;
}

export interface BeauticianFormValues {
  id?: string;
  fullName: string;
  phone: string;
  photoUrl: string;
  isActive: boolean;
  serviceIds: string[];
  availability: DaySlot[]; // length 7
  timeOff: TimeOffRow[];
}

function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeInputToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function BeauticianForm({
  initial,
  services,
}: {
  initial: BeauticianFormValues;
  services: { id: string; nameEn: string; nameAr: string }[];
}) {
  const t = useTranslations("AdminBeauticians");
  const locale = useLocale();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  function set<K extends keyof BeauticianFormValues>(key: K, value: BeauticianFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleService(id: string) {
    setValues((v) => ({
      ...v,
      serviceIds: v.serviceIds.includes(id)
        ? v.serviceIds.filter((x) => x !== id)
        : [...v.serviceIds, id],
    }));
  }

  function setDay(index: number, patch: Partial<DaySlot>) {
    setValues((v) => ({
      ...v,
      availability: v.availability.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    }));
  }

  function addTimeOff() {
    const now = toBusinessInputValue(new Date());
    setValues((v) => ({
      ...v,
      timeOff: [...v.timeOff, { startsAt: now, endsAt: now, reason: "" }],
    }));
  }

  function setTimeOff(index: number, patch: Partial<TimeOffRow>) {
    setValues((v) => ({
      ...v,
      timeOff: v.timeOff.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function removeTimeOff(index: number) {
    setValues((v) => ({ ...v, timeOff: v.timeOff.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(false);

    const payload = {
      id: values.id,
      fullName: values.fullName,
      phone: values.phone,
      photoUrl: values.photoUrl,
      isActive: values.isActive,
      serviceIds: values.serviceIds,
      availability: values.availability
        .map((d, dayOfWeek) => ({ ...d, dayOfWeek }))
        .filter((d) => d.enabled)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startMinute: d.startMinute,
          endMinute: d.endMinute,
        })),
      timeOff: values.timeOff.map((row) => ({
        id: row.id,
        startsAt: businessInputValueToIso(row.startsAt),
        endsAt: businessInputValueToIso(row.endsAt),
        reason: row.reason,
      })),
    };

    const result = await saveBeauticianAction(payload);
    setPending(false);
    if (result.ok) {
      router.push("/admin/beauticians");
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">{t("fieldFullName")}</Label>
          <Input
            id="fullName"
            required
            className="mt-1.5 min-h-11"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">{t("fieldPhone")}</Label>
          <Input
            id="phone"
            required
            dir="ltr"
            className="mt-1.5 min-h-11"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>{t("fieldPhoto")}</Label>
        <div className="mt-1.5">
          <ImageUpload value={values.photoUrl} onChange={(url) => set("photoUrl", url)} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
        {t("fieldActive")}
      </label>

      <div>
        <h2 className="font-medium text-ink">{t("skillsHeading")}</h2>
        <p className="text-xs text-ink/50">{t("skillsHint")}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {services.map((s) => (
            <label key={s.id} className="flex items-center gap-1.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={values.serviceIds.includes(s.id)}
                onChange={() => toggleService(s.id)}
              />
              {getLocalized(s, "name", locale)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-medium text-ink">{t("availabilityHeading")}</h2>
        <div className="mt-2 space-y-2">
          {DAY_KEYS.map((key, index) => {
            const day = values.availability[index];
            return (
              <div key={key} className="flex flex-wrap items-center gap-3">
                <label className="flex w-32 items-center gap-1.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => setDay(index, { enabled: e.target.checked })}
                  />
                  {t(key)}
                </label>
                {day.enabled && (
                  <>
                    <label className="flex items-center gap-1.5 text-sm text-ink/70">
                      {t("startTime")}
                      <input
                        type="time"
                        value={minutesToTimeInput(day.startMinute)}
                        onChange={(e) =>
                          setDay(index, { startMinute: timeInputToMinutes(e.target.value) })
                        }
                        className="min-h-11 rounded-md border border-border bg-paper px-2 text-sm text-ink"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-ink/70">
                      {t("endTime")}
                      <input
                        type="time"
                        value={minutesToTimeInput(day.endMinute)}
                        onChange={(e) =>
                          setDay(index, { endMinute: timeInputToMinutes(e.target.value) })
                        }
                        className="min-h-11 rounded-md border border-border bg-paper px-2 text-sm text-ink"
                      />
                    </label>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="font-medium text-ink">{t("timeOffHeading")}</h2>
        <div className="mt-2 space-y-3">
          {values.timeOff.map((row, index) => (
            <div
              key={row.id ?? `new-${index}`}
              className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-2"
            >
              <label className="text-sm text-ink/70">
                {t("timeOffStart")}
                <input
                  type="datetime-local"
                  value={row.startsAt}
                  onChange={(e) => setTimeOff(index, { startsAt: e.target.value })}
                  className="mt-1 block min-h-11 w-full rounded-md border border-border bg-paper px-2 text-sm text-ink"
                />
              </label>
              <label className="text-sm text-ink/70">
                {t("timeOffEnd")}
                <input
                  type="datetime-local"
                  value={row.endsAt}
                  onChange={(e) => setTimeOff(index, { endsAt: e.target.value })}
                  className="mt-1 block min-h-11 w-full rounded-md border border-border bg-paper px-2 text-sm text-ink"
                />
              </label>
              <div className="sm:col-span-2">
                <Textarea
                  placeholder={t("timeOffReason")}
                  value={row.reason}
                  onChange={(e) => setTimeOff(index, { reason: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" variant="outline" size="sm" onClick={() => removeTimeOff(index)}>
                  {t("removeTimeOff")}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addTimeOff}>
          {t("addTimeOff")}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("errorValidation")}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="min-h-11 bg-mulberry text-paper hover:opacity-90"
        >
          {pending ? t("saving") : t("save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/beauticians")}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
