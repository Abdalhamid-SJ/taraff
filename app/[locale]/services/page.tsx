import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { getActiveCategoriesWithServices } from "@/lib/data/catalog";
import { getLocalized } from "@/lib/localized";
import { localeAlternates } from "@/lib/seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ServiceCard } from "@/components/service-card";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Services" });
  return {
    title: t("heading"),
    description: t("subheading"),
    alternates: localeAlternates("/services", locale),
  };
}

function cheapestPrice(variants: { priceAed: unknown }[]): number | null {
  if (variants.length === 0) return null;
  return Math.min(...variants.map((v) => Number(v.priceAed)));
}

async function ServicesList() {
  const t = await getTranslations("Services");
  const locale = await getLocale();
  const categories = (await getActiveCategoriesWithServices()).filter(
    (c) => c.services.length > 0,
  );

  if (categories.length === 0) {
    return (
      <div className="mt-12 rounded-[2rem] bg-blush/50 px-6 py-16 text-center">
        <p className="text-lg text-ink/70">{t("empty")}</p>
      </div>
    );
  }

  return (
    <>
      {categories.length > 1 && (
        <nav
          aria-label={t("jumpTo")}
          className="no-scrollbar sticky top-[4.5rem] z-30 -mx-4 mt-10 flex gap-2 overflow-x-auto bg-paper/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6"
        >
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.slug}`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-ink/10 bg-white px-5 text-sm font-medium text-ink/80 transition-colors duration-200 hover:border-mulberry/30 hover:text-mulberry focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {getLocalized(category, "name", locale)}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-12 space-y-20">
        {categories.map((category) => (
          <section key={category.id} id={category.slug} className="scroll-mt-40">
            <Reveal>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
                {getLocalized(category, "name", locale)}
              </h2>
            </Reveal>
            <RevealGroup
              as="ul"
              className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
            >
              {category.services.map((service) => (
                <RevealItem as="li" key={service.id}>
                  <ServiceCard
                    fromLabel={t("from")}
                    service={{
                      id: service.id,
                      href: `/services/${service.slug}`,
                      name: getLocalized(service, "name", locale),
                      price: cheapestPrice(service.variants),
                      imageUrl: service.imageUrl,
                    }}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          </section>
        ))}
      </div>
    </>
  );
}

function ServicesListSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/5] rounded-[1.75rem] bg-blush" />
          <Skeleton className="mt-4 h-5 w-2/3 rounded-full bg-blush" />
          <Skeleton className="mt-2 h-4 w-1/3 rounded-full bg-blush" />
        </div>
      ))}
    </div>
  );
}

export default async function ServicesPage() {
  const t = await getTranslations("Services");

  return (
    <main className="mx-auto max-w-6xl px-4 pt-12 pb-24 sm:px-6 lg:pt-16">
      <Reveal className="max-w-2xl">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          {t("heading")}
        </h1>
        <p className="mt-4 text-lg text-ink/70">{t("subheading")}</p>
      </Reveal>

      {/* Scoped to this page only — a file-based loading.tsx here would wrap
          the sibling [slug] route's Suspense boundary too, which commits the
          HTTP 200 status before that route's notFound() can run. */}
      <Suspense fallback={<ServicesListSkeleton />}>
        <ServicesList />
      </Suspense>
    </main>
  );
}
