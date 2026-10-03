"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  cancelBookingAction,
  getRescheduleSlotsAction,
  rescheduleOrderAction,
  updateOrderDetailsAction,
  type BookingDto,
} from "@/lib/actions/booking";
import { DayStrip } from "@/components/booking/day-strip";
import { SlotPicker } from "@/components/booking/slot-picker";
import { todayBusinessDateStr, upcomingDays } from "@/components/booking/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Price } from "@/components/currency-symbol";

const STATUS_KEYS: Record<string, string> = {
  PENDING: "statusPending",
  CONFIRMED: "statusConfirmed",
  ON_THE_WAY: "statusOnTheWay",
  COMPLETED: "statusCompleted",
  CANCELLED: "statusCancelled",
  NO_SHOW: "statusNoShow",
};

type ActiveAction = null | "reschedule" | "address" | "cancel";

export function OrderCard({
  order,
  phone,
  onUpdate,
}: {
  order: BookingDto;
  phone: string;
  onUpdate: (updated: BookingDto) => void;
}) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  function closeAction() {
    setActiveAction(null);
  }

  return (
    <div className="rounded-lg border border-border bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold tracking-wide text-mulberry" dir="ltr">
            {order.reference}
          </p>
          <p className="mt-1 text-sm text-ink/70">
            {timeFormatter.format(new Date(order.scheduledStartIso))}
          </p>
          <p className="text-sm text-ink/70">
            {order.areaText}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="secondary" className="bg-blush text-ink">
            {t(STATUS_KEYS[order.status] ?? "statusPending")}
          </Badge>
          <span className="text-sm font-medium text-brass">
            <Price amount={order.totalAed} />
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 min-h-11 text-sm font-medium text-mulberry underline"
      >
        {expanded ? t("hideDetails") : t("viewDetails")}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 border-t border-border pt-4">
          <ul className="space-y-1 text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-ink">
                <span>
                  {locale === "ar" ? item.serviceNameAr : item.serviceNameEn} —{" "}
                  {locale === "ar" ? item.variantLabelAr : item.variantLabelEn}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="text-brass">
                  <Price amount={item.priceAed * item.quantity} />
                </span>
              </li>
            ))}
          </ul>

          <div className="text-sm">
            <p className="text-ink">{order.addressText}</p>
            {order.addressNotes && <p className="mt-1 text-ink/60">{order.addressNotes}</p>}
          </div>

          {notice && <p className="rounded-md bg-sage/15 px-3 py-2 text-sm text-sage">{notice}</p>}

          {cancelled ? (
            <p className="rounded-md bg-sage/15 px-3 py-2 text-sm text-sage">
              {t("cancelSuccess")}
            </p>
          ) : (
            <>
              {activeAction === null && (
                <div className="flex flex-wrap gap-2">
                  {order.canRescheduleOnline && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotice(null);
                        setActiveAction("reschedule");
                      }}
                    >
                      {t("reschedule")}
                    </Button>
                  )}
                  {order.canEditAddressOnline && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotice(null);
                        setActiveAction("address");
                      }}
                    >
                      {t("editAddress")}
                    </Button>
                  )}
                  {order.canCancelOnline && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setNotice(null);
                        setActiveAction("cancel");
                      }}
                    >
                      {t("cancelButton")}
                    </Button>
                  )}
                  {!order.canRescheduleOnline &&
                    !order.canEditAddressOnline &&
                    !order.canCancelOnline && (
                      <p className="text-sm text-ink/50">{t("notEditable")}</p>
                    )}
                </div>
              )}

              {activeAction === "reschedule" && (
                <RescheduleForm
                  order={order}
                  phone={phone}
                  onDone={(updated, message) => {
                    onUpdate(updated);
                    setNotice(message);
                    closeAction();
                  }}
                  onCancel={closeAction}
                />
              )}

              {activeAction === "address" && (
                <AddressForm
                  order={order}
                  phone={phone}
                  onDone={(updated, message) => {
                    onUpdate(updated);
                    setNotice(message);
                    closeAction();
                  }}
                  onCancel={closeAction}
                />
              )}

              {activeAction === "cancel" && (
                <CancelForm
                  order={order}
                  phone={phone}
                  onDone={() => {
                    setCancelled(true);
                    closeAction();
                  }}
                  onCancel={closeAction}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Upper bound for the day strip; the server enforces the real booking window
// and simply returns no times beyond it.
const RESCHEDULE_DAYS = 31;

function RescheduleForm({
  order,
  phone,
  onDone,
  onCancel,
}: {
  order: BookingDto;
  phone: string;
  onDone: (updated: BookingDto, message: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Orders");
  const days = useMemo(() => upcomingDays(RESCHEDULE_DAYS), []);
  // Start on the booking's current day when it's still ahead, otherwise today.
  const [dateStr, setDateStr] = useState(() => {
    const current = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(
      new Date(order.scheduledStartIso),
    );
    return days.includes(current) ? current : todayBusinessDateStr();
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSlotIso(null);
    getRescheduleSlotsAction({ reference: order.reference, phone, dateStr })
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
  }, [order.reference, phone, dateStr]);

  async function handleSave() {
    if (!slotIso) return;
    setPending(true);
    setError(null);
    const result = await rescheduleOrderAction({
      reference: order.reference,
      phone,
      newStartIso: slotIso,
    });
    setPending(false);
    if (result.ok) {
      onDone(result.booking, t("rescheduleSuccess"));
      return;
    }
    setError(
      result.error === "LEAD_TIME_BLOCKED"
        ? t("rescheduleBlocked")
        : result.error === "CONFLICT"
          ? t("rescheduleConflict")
          : result.error === "NOT_EDITABLE"
            ? t("notEditable")
            : t("invalidInput"),
    );
    // The time just went; refresh what's on offer for that day.
    if (result.error === "CONFLICT") {
      const fresh = await getRescheduleSlotsAction({ reference: order.reference, phone, dateStr });
      setSlots(fresh.map((s) => s.startIso));
      setSlotIso(null);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-ink/10 bg-paper p-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ink">{t("rescheduleChooseDay")}</p>
        <DayStrip days={days} value={dateStr} onChange={setDateStr} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-ink">{t("rescheduleChooseTime")}</p>
        <SlotPicker
          slots={slots}
          value={slotIso}
          onChange={setSlotIso}
          loading={loading}
          emptyMessage={<p className="text-sm text-ink/60">{t("rescheduleNoSlots")}</p>}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !slotIso}
          onClick={handleSave}
          className="min-h-11 rounded-full bg-mulberry px-5 text-paper hover:opacity-90"
        >
          {pending ? t("rescheduleSaving") : t("rescheduleSave")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={pending}
          className="min-h-11 rounded-full px-5"
        >
          {t("rescheduleCancel")}
        </Button>
      </div>
    </div>
  );
}

function AddressForm({
  order,
  phone,
  onDone,
  onCancel,
}: {
  order: BookingDto;
  phone: string;
  onDone: (updated: BookingDto, message: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Orders");
  const [addressText, setAddressText] = useState(order.addressText);
  const [addressNotes, setAddressNotes] = useState(order.addressNotes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setPending(true);
    setError(null);
    const result = await updateOrderDetailsAction({
      reference: order.reference,
      phone,
      addressText,
      addressNotes,
    });
    setPending(false);
    if (result.ok) {
      onDone(result.booking, t("addressSaveSuccess"));
      return;
    }
    setError(t("invalidInput"));
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <label className="block text-sm font-medium text-ink">
        {t("addressLabel")}
        <Textarea
          className="mt-1.5"
          placeholder={t("addressPlaceholder")}
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        {t("notesLabel")}
        <Textarea
          className="mt-1.5"
          placeholder={t("notesPlaceholder")}
          value={addressNotes}
          onChange={(e) => setAddressNotes(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={handleSave}
          className="bg-mulberry text-paper hover:opacity-90"
        >
          {pending ? t("savingAddress") : t("saveAddress")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
          {t("rescheduleCancel")}
        </Button>
      </div>
    </div>
  );
}

function CancelForm({
  order,
  phone,
  onDone,
  onCancel,
}: {
  order: BookingDto;
  phone: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Orders");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const result = await cancelBookingAction({ reference: order.reference, phone });
    setPending(false);
    if (result.ok) {
      onDone();
      return;
    }
    setError(
      result.error === "LEAD_TIME_BLOCKED"
        ? t("cancelBlocked")
        : result.error === "NOT_EDITABLE"
          ? t("notEditable")
          : t("invalidInput"),
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-destructive/30 p-3">
      <p className="text-sm text-ink">{t("cancelConfirmPrompt")}</p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={handleConfirm}
        >
          {t("cancelConfirmYes")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
          {t("cancelConfirmNo")}
        </Button>
      </div>
    </div>
  );
}
