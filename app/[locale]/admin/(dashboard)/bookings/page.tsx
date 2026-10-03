import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllBeauticiansForFilter, getFilteredBookings } from "@/lib/data/admin-bookings";
import { Badge } from "@/components/ui/badge";

const STATUSES = ["PENDING", "CONFIRMED", "ON_THE_WAY", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("AdminBookings");
  const tStatus = await getTranslations("BookingStatus");
  const locale = await getLocale();

  const [bookings, beauticians] = await Promise.all([
    getFilteredBookings({
      status: sp.status,
      area: sp.area,
      beauticianId: sp.beautician,
      from: sp.from,
      to: sp.to,
    }),
    getAllBeauticiansForFilter(),
  ]);

  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    timeZone: "Asia/Riyadh",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{t("heading")}</h1>

      <form className="mt-4 flex flex-wrap gap-2" method="GET">
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="min-h-11 rounded-md border border-border bg-paper px-3 text-sm text-ink"
        >
          <option value="">{t("allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </select>
        <input
          type="search"
          name="area"
          defaultValue={sp.area ?? ""}
          placeholder={t("areaFilterPlaceholder")}
          aria-label={t("colArea")}
          className="min-h-11 w-40 rounded-md border border-border bg-paper px-3 text-sm text-ink"
        />
        <select
          name="beautician"
          defaultValue={sp.beautician ?? ""}
          className="min-h-11 rounded-md border border-border bg-paper px-3 text-sm text-ink"
        >
          <option value="">{t("allBeauticians")}</option>
          {beauticians.map((b) => (
            <option key={b.id} value={b.id}>
              {b.fullName}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={sp.from ?? ""}
          className="min-h-11 rounded-md border border-border bg-paper px-3 text-sm text-ink"
        />
        <input
          type="date"
          name="to"
          defaultValue={sp.to ?? ""}
          className="min-h-11 rounded-md border border-border bg-paper px-3 text-sm text-ink"
        />
        <button
          type="submit"
          className="min-h-11 rounded-md bg-mulberry px-4 text-sm font-medium text-paper hover:opacity-90"
        >
          {t("filter")}
        </button>
        <Link
          href="/admin/bookings"
          className="inline-flex min-h-11 items-center px-3 text-sm text-ink/60 underline"
        >
          {t("clearFilters")}
        </Link>
      </form>

      {bookings.length === 0 ? (
        <p className="mt-6 text-ink/60">{t("empty")}</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-blush/40 text-ink/70">
                <th className="px-3 py-2 text-start font-medium">{t("colTime")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("colCustomer")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("colArea")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("colBeautician")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-blush/20">
                  <td className="px-3 py-2">
                    <Link href={`/admin/bookings/${b.id}`} className="block text-ink">
                      {timeFormatter.format(b.scheduledStart)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/bookings/${b.id}`} className="block text-ink">
                      {b.customerName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink/70">{b.areaText}</td>
                  <td className="px-3 py-2 text-ink/70">
                    {b.beautician?.fullName ?? (
                      <span className="text-destructive">{t("unassignedLabel")}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="bg-blush text-ink">
                        {tStatus(b.status)}
                      </Badge>
                      {b.notifyFailedAt && (
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                          {t("notifyFailedBadge")}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
