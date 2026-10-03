import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

const SAUDI_REGIONS = [
  "Riyadh",
  "Makkah",
  "Madinah",
  "Eastern Province",
  "Asir",
  "Tabuk",
  "Qassim",
  "Hail",
  "Jazan",
  "Najran",
  "Al-Bahah",
  "Al-Jouf",
  "Northern Borders",
];

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

// Builds `alternates` for a given unlocalized path (no leading locale
// segment) and the current locale: canonical points at this locale's own
// URL, `languages` maps every locale (plus x-default) to its URL.
export function localeAlternates(path: string, currentLocale: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(`/${locale}${path}`);
  }
  languages["x-default"] = absoluteUrl(`/${routing.defaultLocale}${path}`);

  return {
    canonical: absoluteUrl(`/${currentLocale}${path}`),
    languages,
  };
}

export function buildLocalBusinessJsonLd(locale: string) {
  const name = locale === "ar" ? "ترف" : "Taraf";
  const description =
    locale === "ar"
      ? "حجز خبيرات تجميل يصلن إلى منزلك في جميع أنحاء المملكة العربية السعودية."
      : "Book a beautician to come to you, anywhere in Saudi Arabia.";

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url: absoluteUrl(`/${locale}`),
    areaServed: SAUDI_REGIONS.map((region) => ({ "@type": "AdministrativeArea", name: region })),
    telephone: process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP || undefined,
    priceRange: "SAR",
  };
}

export function buildServiceJsonLd(
  service: {
    nameEn: string;
    nameAr: string;
    descEn: string | null;
    descAr: string | null;
    slug: string;
    variants: { priceAed: number }[];
  },
  locale: string,
) {
  const prices = service.variants.map((v) => v.priceAed);
  const lowPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const highPrice = prices.length > 0 ? Math.max(...prices) : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: locale === "ar" ? service.nameAr : service.nameEn,
    name: locale === "ar" ? service.nameAr : service.nameEn,
    description: (locale === "ar" ? service.descAr : service.descEn) || undefined,
    url: absoluteUrl(`/${locale}/services/${service.slug}`),
    areaServed: SAUDI_REGIONS.map((region) => ({ "@type": "AdministrativeArea", name: region })),
    provider: {
      "@type": "LocalBusiness",
      name: locale === "ar" ? "ترف" : "Taraf",
    },
    ...(lowPrice !== undefined
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "SAR",
            lowPrice,
            highPrice,
          },
        }
      : {}),
  };
}
