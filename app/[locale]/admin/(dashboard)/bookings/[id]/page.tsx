import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getActiveBeauticiansForReassign, getBookingDetail } from "@/lib/data/admin-bookings";
import { waLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { AddressVerifiedToggle } from "./_components/address-verified-toggle";
import { CancelForm } from "./_components/cancel-form";
import { NotesForm } from "./_components/notes-form";
import { ReassignForm } from "./_components/reassign-form";
import { RescheduleForm } from "./_components/reschedule-form";
import { StatusSelect } from "./_components/status-select";
import { Price } from "@/components/currency-symbol";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("AdminBookings");
  const locale = await getLocale();

  const [booking, beauticians] = await Promise.all([
    getBookingDetail(id),
    getActiveBeauticiansForReassign(),
  ]);
  if (!booking) notFound();

  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  const whatsapp = waLink(booking.customerPhone);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/bookings"
        className="text-sm font-medium text-mulberry hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {t("backToList")}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-wide text-ink" dir="ltr">
            {booking.reference}
          </h1>
          {booking.notifyFailedAt && (
            <Badge variant="secondary" className="bg-destructive/10 text-destructive">
              {t("notifyFailedBadge")}
            </Badge>
          )}
        </div>
        <StatusSelect bookingId={booking.id} status={booking.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-border p-4">
          <h2 className="font-medium text-ink">{t("customerHeading")}</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/60">{t("name")}</dt>
              <dd className="text-ink">{booking.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">{t("phone")}</dt>
              <dd className="text-ink" dir="ltr">
                {booking.customerPhone}
              </dd>
            </div>
          </dl>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-mulberry underline"
            >
              {t("whatsappCustomer")}
            </a>
          )}
        </section>

        <section className="rounded-lg border border-border p-4">
          <h2 className="font-medium text-ink">{t("addressHeading")}</h2>
          <p className="mt-2 text-sm text-ink">{booking.addressText}</p>
          {booking.addressNotes && (
            <p className="mt-1 text-sm text-ink/60">{booking.addressNotes}</p>
          )}
          <p className="mt-1 text-sm text-ink/60">{booking.areaText}</p>
          <div className="mt-3">
            <AddressVerifiedToggle bookingId={booking.id} verified={booking.addressVerified} />
          </div>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h2 className="font-medium text-ink">{t("scheduleHeading")}</h2>
          <p className="mt-2 text-sm text-ink">{timeFormatter.format(booking.scheduledStart)}</p>
          <RescheduleForm
            bookingId={booking.id}
            scheduledStart={booking.scheduledStart.toISOString()}
          />
        </section>

        <section className="rounded-lg border border-border p-4">
          <h2 className="font-medium text-ink">{t("assignmentHeading")}</h2>
          {booking.beautician ? (
            <p className="mt-2 text-sm text-ink">
              {booking.beautician.fullName}{" "}
              <span className="text-ink/50">
                ({t("assignedBy")}: {booking.assignedBy})
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-destructive">{t("unassigned")}</p>
          )}
          <ReassignForm
            bookingId={booking.id}
            currentBeauticianId={booking.beauticianId}
            beauticians={beauticians}
          />
        </section>

        <section className="rounded-lg border border-border p-4 sm:col-span-2">
          <h2 className="font-medium text-ink">{t("itemsHeading")}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {booking.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span className="text-ink">
                  {locale === "ar" ? item.serviceNameAr : item.serviceNameEn} —{" "}
                  {locale === "ar" ? item.variantLabelAr : item.variantLabelEn}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="text-brass">
                  <Price amount={Number(item.priceAed) * item.quantity} />
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold">
            <span className="text-ink">{t("total")}</span>
            <span className="text-brass">
              <Price amount={Number(booking.totalAed)} />
            </span>
          </div>
        </section>

        <section className="rounded-lg border border-border p-4 sm:col-span-2">
          <h2 className="font-medium text-ink">{t("notesHeading")}</h2>
          <div className="mt-2">
            <NotesForm bookingId={booking.id} notes={booking.adminNotes} />
          </div>
        </section>

        <section className="rounded-lg border border-border p-4 sm:col-span-2">
          <h2 className="font-medium text-ink">{t("cancelHeading")}</h2>
          <div className="mt-2">
            {booking.status === "CANCELLED" ? (
              <p className="text-sm text-ink/60">
                {t("alreadyCancelled")}
                {booking.cancelReason ? ` — ${booking.cancelReason}` : ""}
              </p>
            ) : (
              <CancelForm bookingId={booking.id} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
