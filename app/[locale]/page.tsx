import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Quote } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getActiveAreasByEmirate, getActiveCategoriesWithServices } from "@/lib/data/catalog";
import { getLocalized } from "@/lib/localized";
import { ctaArrow, ctaOnAccent } from "@/lib/cta";
import { Reveal } from "@/components/motion/reveal";
import { ServiceCarousel } from "@/components/service-carousel";
import { Hero } from "./_components/home/hero";
import { HowItWorks } from "./_components/home/how-it-works";
import { Coverage } from "./_components/home/coverage";

// Catalog data will be admin-editable (Phase 4) — revalidate periodically
// rather than serving whatever was true at build time forever.
export const revalidate = 60;

function cheapestPrice(variants: { priceAed: unknown }[]): number | null {
  if (variants.length === 0) return null;
  return Math.min(...variants.map((v) => Number(v.priceAed)));
}

export default async function HomePage() {
  const t = await getTranslations("Home");
  const locale = await getLocale();

  const [categories, areasByEmirate] = await Promise.all([
    getActiveCategoriesWithServices(),
    getActiveAreasByEmirate(),
  ]);

  const services = categories.flatMap((category) =>
    category.services.map((service) => ({
      id: service.id,
      href: `/services/${service.slug}`,
      name: getLocalized(service, "name", locale),
      category: getLocalized(category, "name", locale),
      price: cheapestPrice(service.variants),
      imageUrl: service.imageUrl,
    })),
  );

  // Largest region first: it opens selected and is visible in the tab strip on phones.
  const regions = Array.from(areasByEmirate.entries())
    .map(([emirate, areas]) => ({
      name: emirate,
      areas: areas.map((area) => ({ id: area.id, name: getLocalized(area, "name", locale) })),
    }))
    .sort((a, b) => b.areas.length - a.areas.length);

  return (
    <main>
      <Hero
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        cta={t("heroCta")}
        secondaryCta={t("viewAllServices")}
        imageAlt={t("heroImageAlt")}
        detailAlt={t("heroDetailAlt1")}
      />

      {services.length > 0 && (
        <section className="py-20 lg:py-28">
          <ServiceCarousel
            services={services}
            label={t("servicesHeading")}
            fromLabel={t("from")}
            heading={
              <Reveal>
                <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                  {t("servicesHeading")}
                </h2>
                <p className="mt-3 max-w-md text-lg text-ink/70">{t("servicesSubheading")}</p>
              </Reveal>
            }
          />
        </section>
      )}

      <HowItWorks
        heading={t("howItWorksHeading")}
        imageAlt={t("heroDetailAlt2")}
        steps={[
          { title: t("howItWorksStep1Title"), desc: t("howItWorksStep1Desc") },
          { title: t("howItWorksStep2Title"), desc: t("howItWorksStep2Desc") },
          { title: t("howItWorksStep3Title"), desc: t("howItWorksStep3Desc") },
        ]}
      />

      {regions.length > 0 && (
        <Coverage
          heading={t("coverageHeading")}
          subheading={t("coverageSubheading")}
          regions={regions}
          countLabels={regions.map((r) => t("coverageAreasCount", { count: r.areas.length }))}
        />
      )}

      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:py-28">
        <Reveal>
          <Quote className="mx-auto size-10 text-mulberry/30" aria-hidden="true" />
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("testimonialsHeading")}
          </h2>
          <p className="mt-4 text-lg text-ink/60">{t("testimonialPlaceholder")}</p>
        </Reveal>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:pb-24">
        <Reveal y={40}>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-mulberry px-6 py-20 text-center sm:px-12 lg:py-24">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_0%,rgb(255_255_255/0.18),transparent_70%),radial-gradient(50%_70%_at_0%_100%,rgb(0_0_0/0.18),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="font-display text-4xl font-semibold tracking-tight text-paper sm:text-5xl">
                {t("finalCtaHeading")}
              </h2>
              <p className="mt-4 text-lg text-paper/80">{t("finalCtaSubheading")}</p>
              <Link href="/book" className={`mt-10 ${ctaOnAccent}`}>
                {t("finalCtaButton")}
                <ArrowRight className={ctaArrow} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
