import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link, redirect } from "@/i18n/navigation";
import { isCustomerRole } from "@/lib/auth-roles";
import { mapBookingToDto } from "@/lib/booking-dto";
import { prisma } from "@/lib/db";
import { getSchedulingSettings } from "@/lib/settings";
import { LinkBookingForm } from "./_components/link-booking-form";
import { ProfileBookings } from "./_components/profile-bookings";
import { SignOutButton } from "./_components/sign-out-button";

const OPEN_STATUSES = ["PENDING", "CONFIRMED", "ON_THE_WAY"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return {
    title: t("metaTitle"),
    // Private, signed-in content — not for search results.
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Account");

  // middleware.ts already redirects signed-out visitors; this is the
  // server-side re-check (and covers a session whose customer was deleted).
  const session = await auth();
  if (!session?.user || !isCustomerRole(session.user.role)) {
    redirect({ href: "/account/login", locale });
  }
  const customer = await prisma.customer.findUnique({ where: { id: session!.user.id } });
  if (!customer) redirect({ href: "/account/login", locale });

  const [bookings, settings] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId: customer!.id },
      include: { items: true, area: true },
      orderBy: { scheduledStart: "desc" },
      take: 200,
    }),
    getSchedulingSettings(),
  ]);

  const now = new Date();
  const leadTimeCutoff = new Date(now.getTime() + settings.bookingLeadTimeHours * 60 * 60 * 1000);
  const dtos = bookings.map((b) => mapBookingToDto(b, leadTimeCutoff));

  const isUpcoming = (b: (typeof dtos)[number]) =>
    OPEN_STATUSES.includes(b.status) && new Date(b.scheduledEndIso) >= now;
  // Soonest first for what's coming; most recent first for history.
  const upcoming = dtos.filter(isUpcoming).reverse();
  const past = dtos.filter((b) => !isUpcoming(b));

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
          <p className="mt-1 text-lg text-ink">{t("welcome", { name: customer!.name })}</p>
          <p className="mt-0.5 text-sm text-ink/60">
            {t("phoneLabel")}: <span dir="ltr">{customer!.phone}</span>
          </p>
        </div>
        <SignOutButton redirectTo={`/${locale}`} />
      </div>

      <Link
        href="/book"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-mulberry px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {t("bookNew")}
      </Link>

      <ProfileBookings upcoming={upcoming} past={past} />

      <LinkBookingForm defaultPhone={customer!.phone} />
    </main>
  );
}
