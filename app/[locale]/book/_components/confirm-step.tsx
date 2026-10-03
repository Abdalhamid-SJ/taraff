"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitBookingAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { CartSummary } from "./cart-summary";
import type { BookingDetailsInput } from "@/lib/validation/booking";
import type { CartLine, CategoryDto } from "../_lib/types";

export function ConfirmStep({
  categories,
  lines,
  slotIso,
  details,
  onBack,
  onSlotTaken,
  onAuthRequired,
  onSuccess,
}: {
  categories: CategoryDto[];
  lines: CartLine[];
  slotIso: string;
  details: BookingDetailsInput;
  onBack: () => void;
  onSlotTaken: () => void;
  onAuthRequired: () => void;
  onSuccess: (reference: string) => void;
}) {
  const t = useTranslations("Book");
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    timeZone: "Asia/Riyadh",
    hour: "numeric",
    minute: "2-digit",
  });
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitBookingAction({
        items: lines,
        slotStartIso: slotIso,
        ...details,
      });
      if (result.ok) {
        onSuccess(result.reference);
        return;
      }
      if (result.error === "AUTH_REQUIRED") {
        onAuthRequired();
        return;
      }
      const messageKey =
        result.error === "SLOT_TAKEN"
          ? "errorSlotTaken"
          : result.error === "NO_BEAUTICIAN_AVAILABLE"
            ? "errorNoBeautician"
            : result.error === "INVALID_INPUT"
              ? "errorInvalidInput"
              : "errorGeneric";
      setError(t(messageKey));
      if (result.error === "SLOT_TAKEN") {
        onSlotTaken();
      }
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{t("confirmHeading")}</h2>
      <p className="mt-2 text-ink/70">{t("confirmSubheading")}</p>

      <div className="mt-6 space-y-4">
        <CartSummary lines={lines} categories={categories} />

        <dl className="grid grid-cols-1 gap-4 rounded-[1.75rem] border border-ink/8 bg-white p-5 text-sm shadow-[var(--shadow-soft)] sm:grid-cols-2">
          <div>
            <dt className="text-ink/60">{t("confirmDate")}</dt>
            <dd className="text-ink">{dateFormatter.format(new Date(slotIso))}</dd>
          </div>
          <div>
            <dt className="text-ink/60">{t("confirmTime")}</dt>
            <dd className="text-ink">{formatter.format(new Date(slotIso))}</dd>
          </div>
          <div>
            <dt className="text-ink/60">{t("confirmArea")}</dt>
            <dd className="text-ink">{details.areaText}</dd>
          </div>
          <div>
            <dt className="text-ink/60">{t("confirmName")}</dt>
            <dd className="text-ink">{details.customerName}</dd>
          </div>
          <div>
            <dt className="text-ink/60">{t("confirmPhone")}</dt>
            <dd className="text-ink" dir="ltr">
              {details.customerPhone}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink/60">{t("confirmAddress")}</dt>
            <dd className="text-ink">{details.addressText}</dd>
          </div>
        </dl>

        <p className="rounded-2xl bg-blush/70 px-5 py-3.5 text-sm font-medium text-ink">
          {t("confirmPaymentNote")}
        </p>

        {error && (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-5 py-3.5 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="mt-8 flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting} className="min-h-12 rounded-full px-6">
          {t("back")}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="min-h-12 rounded-full bg-mulberry px-8 text-paper shadow-[var(--shadow-lift)] hover:opacity-90"
        >
          {submitting ? t("confirmSubmitting") : t("confirmSubmit")}
        </Button>
      </div>
    </div>
  );
}
