import type { Prisma } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { QuickStatusButton } from "./quick-status-button";

export type TodayBooking = Prisma.BookingGetPayload<{
  include: {
    beautician: { select: { id: true; fullName: true } };
    items: true;
  };
}>;

const NEXT_STATUS: Partial<Record<TodayBooking["status"], TodayBooking["status"]>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "ON_THE_WAY",
  ON_THE_WAY: "COMPLETED",
};

const NEXT_STATUS_LABEL_KEY: Record<string, string> = {
  CONFIRMED: "markConfirmed",
  ON_THE_WAY: "markOnTheWay",
  COMPLETED: "markCompleted",
};

export function BookingCard({ booking, highlight }: { booking: TodayBooking; highlight?: boolean }) {
  const t = useTranslations("AdminToday");
  const tStatus = useTranslations("BookingStatus");
  const locale = useLocale();

  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    timeZone: "Asia/Riyadh",
    hour: "numeric",
    minute: "2-digit",
  });

  const next = NEXT_STATUS[booking.status];

  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? "border-destructive/40 bg-destructive/5" : "border-border bg-paper"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">
            {timeFormatter.format(booking.scheduledStart)} — {booking.customerName}
          </p>
          <p className="text-sm text-ink/60">
            {booking.areaText} · {booking.reference}
          </p>
          <ul className="mt-1 text-sm text-ink/70">
            {booking.items.map((item, i) => (
              <li key={i}>
                {locale === "ar" ? item.serviceNameAr : item.serviceNameEn} —{" "}
                {locale === "ar" ? item.variantLabelAr : item.variantLabelEn}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant="secondary" className="bg-blush text-ink">
            {tStatus(booking.status)}
          </Badge>
          {next && (
            <QuickStatusButton
              bookingId={booking.id}
              nextStatus={next}
              label={t(NEXT_STATUS_LABEL_KEY[next])}
            />
          )}
        </div>
      </div>
    </div>
  );
}
