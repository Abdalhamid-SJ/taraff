"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveSettingsAction } from "@/lib/actions/admin-settings";
import type { SettingsInput } from "@/lib/validation/admin-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/app/[locale]/admin/_components/image-upload";

const DAY_KEYS = ["day0", "day1", "day2", "day3", "day4", "day5", "day6"] as const;

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

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const t = useTranslations("AdminSettings");
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  function setBusinessHourDay(dayOfWeek: number, patch: { startMinute?: number; endMinute?: number }) {
    set(
      "businessHours",
      values.businessHours.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)),
    );
  }

  function addWhatsappNumber() {
    set("whatsappAdminNumbers", [...values.whatsappAdminNumbers, ""]);
  }

  function setWhatsappNumber(index: number, value: string) {
    set(
      "whatsappAdminNumbers",
      values.whatsappAdminNumbers.map((n, i) => (i === index ? value : n)),
    );
  }

  function removeWhatsappNumber(index: number) {
    set(
      "whatsappAdminNumbers",
      values.whatsappAdminNumbers.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(false);
    const result = await saveSettingsAction(values);
    setPending(false);
    if (result.ok) {
      setSaved(true);
    } else {
      setError(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <section>
        <h2 className="font-medium text-ink">{t("brandingHeading")}</h2>
        <p className="text-xs text-ink/50">{t("logoHint")}</p>
        <div className="mt-3">
          <Label>{t("logoLabel")}</Label>
          <div className="mt-1.5">
            <ImageUpload
              value={values.siteLogoUrl}
              onChange={(url) => set("siteLogoUrl", url)}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              previewClassName="h-20 max-w-full rounded-md border border-border bg-blush/30 object-contain p-2"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-medium text-ink">{t("schedulingHeading")}</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="travelBufferMinutes">{t("travelBufferMinutes")}</Label>
            <Input
              id="travelBufferMinutes"
              type="number"
              min={1}
              required
              className="mt-1.5 min-h-11"
              value={values.travelBufferMinutes}
              onChange={(e) => set("travelBufferMinutes", Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="bookingLeadTimeHours">{t("bookingLeadTimeHours")}</Label>
            <Input
              id="bookingLeadTimeHours"
              type="number"
              min={1}
              required
              className="mt-1.5 min-h-11"
              value={values.bookingLeadTimeHours}
              onChange={(e) => set("bookingLeadTimeHours", Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="maxAdvanceDays">{t("maxAdvanceDays")}</Label>
            <Input
              id="maxAdvanceDays"
              type="number"
              min={1}
              required
              className="mt-1.5 min-h-11"
              value={values.maxAdvanceDays}
              onChange={(e) => set("maxAdvanceDays", Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="slotGranularityMinutes">{t("slotGranularityMinutes")}</Label>
            <Input
              id="slotGranularityMinutes"
              type="number"
              min={1}
              required
              className="mt-1.5 min-h-11"
              value={values.slotGranularityMinutes}
              onChange={(e) => set("slotGranularityMinutes", Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-medium text-ink">{t("businessHoursHeading")}</h2>
        <div className="mt-3 space-y-2">
          {DAY_KEYS.map((key, dayOfWeek) => {
            const day = values.businessHours.find((d) => d.dayOfWeek === dayOfWeek);
            if (!day) return null;
            return (
              <div key={key} className="flex flex-wrap items-center gap-3">
                <span className="w-28 text-sm text-ink">{t(key)}</span>
                <label className="flex items-center gap-1.5 text-sm text-ink/70">
                  {t("startTime")}
                  <input
                    type="time"
                    value={minutesToTimeInput(day.startMinute)}
                    onChange={(e) =>
                      setBusinessHourDay(dayOfWeek, { startMinute: timeInputToMinutes(e.target.value) })
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
                      setBusinessHourDay(dayOfWeek, { endMinute: timeInputToMinutes(e.target.value) })
                    }
                    className="min-h-11 rounded-md border border-border bg-paper px-2 text-sm text-ink"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-ink">{t("whatsappNumbersHeading")}</h2>
        <p className="text-xs text-ink/50">{t("whatsappNumbersHint")}</p>
        <div className="mt-2 space-y-2">
          {values.whatsappAdminNumbers.map((number, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                dir="ltr"
                className="min-h-11 max-w-xs"
                value={number}
                onChange={(e) => setWhatsappNumber(index, e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeWhatsappNumber(index)}
              >
                {t("removeNumber")}
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addWhatsappNumber}>
          {t("addNumber")}
        </Button>
      </section>

      <section>
        <h2 className="font-medium text-ink">{t("siteContactHeading")}</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
            <Input
              id="contactPhone"
              dir="ltr"
              className="mt-1.5 min-h-11"
              value={values.siteContact.phone}
              onChange={(e) => set("siteContact", { ...values.siteContact, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contactWhatsapp">{t("contactWhatsapp")}</Label>
            <Input
              id="contactWhatsapp"
              dir="ltr"
              className="mt-1.5 min-h-11"
              value={values.siteContact.whatsapp}
              onChange={(e) =>
                set("siteContact", { ...values.siteContact, whatsapp: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
            <Input
              id="contactEmail"
              type="email"
              dir="ltr"
              className="mt-1.5 min-h-11"
              value={values.siteContact.email}
              onChange={(e) => set("siteContact", { ...values.siteContact, email: e.target.value })}
            />
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("errorValidation")}
        </p>
      )}
      {saved && !error && <p className="text-sm text-sage">{t("saved")}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-mulberry text-paper hover:opacity-90"
      >
        {pending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
