import { getTranslations } from "next-intl/server";
import { getTodayBookings } from "@/lib/data/admin-bookings";
import { BookingCard, type TodayBooking } from "./_components/booking-card";

export default async function AdminTodayPage() {
  const t = await getTranslations("AdminToday");
  const bookings = await getTodayBookings();

  const unassigned = bookings.filter((b) => !b.beauticianId);
  const byBeautician = new Map<string, { name: string; bookings: TodayBooking[] }>();
  for (const booking of bookings) {
    if (!booking.beauticianId || !booking.beautician) continue;
    const existing = byBeautician.get(booking.beauticianId);
    if (existing) {
      existing.bookings.push(booking);
    } else {
      byBeautician.set(booking.beauticianId, {
        name: booking.beautician.fullName,
        bookings: [booking],
      });
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{t("heading")}</h1>

      {bookings.length === 0 ? (
        <p className="mt-6 text-ink/60">{t("noBookings")}</p>
      ) : (
        <div className="mt-6 space-y-8">
          {unassigned.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">
                {t("unassignedHeading")}
              </h2>
              <div className="mt-3 space-y-3">
                {unassigned.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} highlight />
                ))}
              </div>
            </section>
          )}

          {Array.from(byBeautician.values()).map(({ name, bookings: group }) => (
            <section key={name}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
                {name}
              </h2>
              <div className="mt-3 space-y-3">
                {group.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
