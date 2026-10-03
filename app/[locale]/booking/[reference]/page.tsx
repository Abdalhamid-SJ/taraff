import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BookingLookup } from "./_components/booking-lookup";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BookingLookup" });
  return {
    title: t("heading"),
    // Private, phone-gated per-booking content — not meant for search results.
    robots: { index: false, follow: false },
  };
}

export default async function BookingLookupPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return <BookingLookup reference={reference} />;
}
