"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  cancelBookingAction,
  lookupBookingAction,
  type BookingDto,
} from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Price } from "@/components/currency-symbol";

const STATUS_KEYS: Record<string, string> = {
  PENDING: "statusPending",
  CONFIRMED: "statusConfirmed",
  ON_THE_WAY: "statusOnTheWay",
  COMPLETED: "statusCompleted",
  CANCELLED: "statusCancelled",
  NO_SHOW: "statusNoShow",
};

export function BookingLookup({ reference }: { reference: string }) {
  const t = useTranslations("BookingLookup");
  const locale = useLocale();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  function translateError(
    code: "INVALID_INPUT" | "NOT_FOUND" | "ALREADY_CANCELLED" | "NOT_EDITABLE" | "LEAD_TIME_BLOCKED",
  ): string {
    switch (code) {
      case "NOT_FOUND":
        return t("notFound");
      case "ALREADY_CANCELLED":
        return t("alreadyCancelledError");
      case "LEAD_TIME_BLOCKED":
        return t("cancelBlocked");
      case "NOT_EDITABLE":
        return t("notEditable");
      case "INVALID_INPUT":
      default:
        return t("invalidInput");
    }
  }

  async function handleLookup() {
    setLoading(true);
    setError(null);
    const result = await lookupBookingAction({ reference, phone });
    setLoading(false);
    if (!result.ok) {
      setError(translateError(result.error));
      return;
    }
    setBooking(result.booking);
  }

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelBookingAction({ reference, phone });
    setCancelling(false);
    setConfirmingCancel(false);
    if (result.ok) {
      setCancelled(true);
      setBooking((prev) => (prev ? { ...prev, status: "CANCELLED", canCancelOnline: false } : prev));
    } else {
      setError(translateError(result.error));
    }
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mt-1 text-ink/70">{t("subheading")}</p>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="reference">{t("referenceLabel")}</Label>
            <Input id="reference" className="mt-1.5 min-h-11" value={reference} disabled dir="ltr" />
          </div>
          <div>
            <Label htmlFor="phone">{t("phoneLabel")}</Label>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              className="mt-1.5 min-h-11"
              placeholder={t("phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="button"
            onClick={handleLookup}
            disabled={loading || !phone}
            className="min-h-11 w-full bg-mulberry text-paper hover:opacity-90"
          >
            {t("submit")}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-wide text-mulberry" dir="ltr">
        {booking.reference}
      </h1>

      <dl className="mt-6 space-y-3 rounded-lg border border-border p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink/60">{t("statusLabel")}</dt>
          <dd className="font-medium text-ink">{t(STATUS_KEYS[booking.status] ?? "statusPending")}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">{t("scheduledFor")}</dt>
          <dd className="text-ink">{formatter.format(new Date(booking.scheduledStartIso))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">{t("areaLabel")}</dt>
          <dd className="text-ink">{booking.areaText}</dd>
        </div>
        <div className="border-t border-border pt-3">
          <p className="text-ink">{booking.addressText}</p>
          {booking.addressNotes && <p className="mt-1 text-ink/60">{booking.addressNotes}</p>}
        </div>
        <ul className="space-y-1 border-t border-border pt-3">
          {booking.items.map((item, i) => (
            <li key={i} className="flex justify-between text-ink">
              <span>
                {locale === "ar" ? item.serviceNameAr : item.serviceNameEn} —{" "}
                {locale === "ar" ? item.variantLabelAr : item.variantLabelEn}
              </span>
              <span className="text-brass">
                <Price amount={item.priceAed * item.quantity} />
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-border pt-3 font-semibold">
          <dt className="text-ink">{t("totalLabel")}</dt>
          <dd className="text-brass">
            <Price amount={booking.totalAed} />
          </dd>
        </div>
      </dl>

      {cancelled ? (
        <p className="mt-6 rounded-md bg-sage/15 px-4 py-3 text-sm text-sage">
          {t("cancelSuccess")}
        </p>
      ) : booking.canCancelOnline ? (
        <div className="mt-6">
          {confirmingCancel ? (
            <div className="rounded-md border border-destructive/30 p-4">
              <p className="text-sm text-ink">{t("cancelConfirmPrompt")}</p>
              <div className="mt-3 flex gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="min-h-11"
                >
                  {t("cancelConfirmYes")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmingCancel(false)}
                  disabled={cancelling}
                  className="min-h-11"
                >
                  {t("cancelConfirmNo")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmingCancel(true)}
              className="min-h-11"
            >
              {t("cancelButton")}
            </Button>
          )}
        </div>
      ) : booking.status !== "CANCELLED" && booking.status !== "COMPLETED" ? (
        <p className="mt-6 text-sm text-ink/70">{t("cancelBlocked")}</p>
      ) : null}

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </main>
  );
}
