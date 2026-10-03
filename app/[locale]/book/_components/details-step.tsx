"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { bookingDetailsSchema, type BookingDetailsInput } from "@/lib/validation/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DetailsStep({
  values,
  onChange,
  onBack,
  onNext,
}: {
  values: BookingDetailsInput;
  onChange: (values: BookingDetailsInput) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("Book");
  const [errors, setErrors] = useState<Partial<Record<keyof BookingDetailsInput, boolean>>>({});

  function set<K extends keyof BookingDetailsInput>(key: K, value: BookingDetailsInput[K]) {
    onChange({ ...values, [key]: value });
  }

  function handleNext() {
    const result = bookingDetailsSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof BookingDetailsInput;
        fieldErrors[key] = true;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onNext();
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{t("detailsHeading")}</h2>
      <p className="mt-2 text-ink/70">{t("detailsSubheading")}</p>

      <div className="mt-6 space-y-5">
        <div>
          <Label htmlFor="customerName">{t("nameLabel")}</Label>
          <Input
            id="customerName"
            className="mt-1.5 min-h-12 rounded-xl"
            placeholder={t("namePlaceholder")}
            value={values.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            aria-invalid={!!errors.customerName}
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-destructive">{t("nameError")}</p>
          )}
        </div>

        <div>
          <Label htmlFor="customerPhone">{t("phoneLabel")}</Label>
          <Input
            id="customerPhone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            className="mt-1.5 min-h-12 rounded-xl text-start"
            placeholder={t("phonePlaceholder")}
            value={values.customerPhone}
            onChange={(e) => set("customerPhone", e.target.value)}
            aria-invalid={!!errors.customerPhone}
          />
          <p className="mt-1.5 text-sm text-ink/60">{t("phoneHint")}</p>
          {errors.customerPhone && (
            <p className="mt-1 text-sm text-destructive">{t("phoneError")}</p>
          )}
        </div>

        <div>
          <Label htmlFor="areaText">{t("areaLabel")}</Label>
          <Input
            id="areaText"
            className="mt-1.5 min-h-12 rounded-xl"
            placeholder={t("areaPlaceholder")}
            autoComplete="address-level2"
            value={values.areaText}
            onChange={(e) => set("areaText", e.target.value)}
            aria-invalid={!!errors.areaText}
          />
          <p className="mt-1.5 text-sm text-ink/60">{t("areaHint")}</p>
          {errors.areaText && <p className="mt-1 text-sm text-destructive">{t("areaError")}</p>}
        </div>

        <div>
          <Label htmlFor="addressText">{t("addressLabel")}</Label>
          <Textarea
            id="addressText"
            className="mt-1.5 rounded-xl"
            placeholder={t("addressPlaceholder")}
            value={values.addressText}
            onChange={(e) => set("addressText", e.target.value)}
            aria-invalid={!!errors.addressText}
          />
          {errors.addressText && (
            <p className="mt-1 text-sm text-destructive">{t("addressError")}</p>
          )}
        </div>

        <div>
          <Label htmlFor="addressNotes">{t("notesLabel")}</Label>
          <Textarea
            id="addressNotes"
            className="mt-1.5 rounded-xl"
            placeholder={t("notesPlaceholder")}
            value={values.addressNotes ?? ""}
            onChange={(e) => set("addressNotes", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="min-h-12 rounded-full px-6">
          {t("back")}
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="min-h-12 rounded-full bg-mulberry px-8 text-paper shadow-[var(--shadow-lift)] hover:opacity-90"
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
