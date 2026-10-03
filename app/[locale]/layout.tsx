import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Outfit, Almarai } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildLocalBusinessJsonLd, localeAlternates, siteUrl } from "@/lib/seo";
import { getSiteLogoUrl } from "@/lib/site-logo";
import { ConditionalSiteHeader } from "./_components/conditional-site-header";
import { SiteHeader } from "./_components/site-header";
import "../globals.css";

const plexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-sans-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const almarai = Almarai({
  variable: "--font-almarai",
  subsets: ["arabic"],
  weight: ["700", "800"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const logoUrl = await getSiteLogoUrl();

  return {
    metadataBase: new URL(siteUrl()),
    // The admin-uploaded logo doubles as the browser-tab icon. (No file-based
    // app/favicon.ico on purpose — it would take precedence over this.)
    icons: logoUrl
      ? {
          icon: logoUrl,
          // iOS ignores SVG touch icons, so only offer raster logos there.
          ...(/\.svg(\?|$)/i.test(logoUrl) ? {} : { apple: logoUrl }),
        }
      : { icon: "/default-icon.svg" },
    title: { default: t("titleDefault"), template: t("titleTemplate") },
    description: t("description"),
    alternates: localeAlternates("", locale),
    openGraph: {
      title: t("titleDefault"),
      description: t("description"),
      url: `/${locale}`,
      locale: locale === "ar" ? "ar_AE" : "en_AE",
      siteName: t("titleDefault"),
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    // Font variables live on <html> so the :root tokens in globals.css
    // (--font-display-family) can resolve them.
    <html
      lang={locale}
      dir={dir}
      className={`${plexSansArabic.variable} ${outfit.variable} ${almarai.variable}`}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLocalBusinessJsonLd(locale)) }}
        />
        <NextIntlClientProvider>
          <ConditionalSiteHeader>
            <SiteHeader />
          </ConditionalSiteHeader>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
