"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { BookingDto } from "@/lib/booking-dto";
import { OrderCard } from "@/app/[locale]/orders/_components/order-card";

// Booking history for the signed-in customer. Reuses the same card as the
// guest "My bookings" page, so details, reschedule, address edit and cancel
// all work from here too.
export function ProfileBookings({
  upcoming: initialUpcoming,
  past: initialPast,
}: {
  upcoming: BookingDto[];
  past: BookingDto[];
}) {
  const t = useTranslations("Account");
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [past, setPast] = useState(initialPast);

  function handleUpdate(updated: BookingDto) {
    const swap = (list: BookingDto[]) =>
      list.map((b) => (b.reference === updated.reference ? updated : b));
    setUpcoming(swap);
    setPast(swap);
  }

  return (
    <>
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">{t("upcomingHeading")}</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">{t("noUpcoming")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {upcoming.map((order) => (
              <OrderCard
                key={order.reference}
                order={order}
                phone={order.customerPhone}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">{t("pastHeading")}</h2>
        {past.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">{t("noPast")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {past.map((order) => (
              <OrderCard
                key={order.reference}
                order={order}
                phone={order.customerPhone}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
