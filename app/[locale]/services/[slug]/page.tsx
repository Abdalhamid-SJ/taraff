import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServiceBySlug } from "@/lib/data/catalog";
import { getLocalized } from "@/lib/localized";
import { buildServiceJsonLd, localeAlternates } from "@/lib/seo";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { Price } from "@/components/currency-symbol";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ctaArrow, ctaPrimary } from "@/lib/cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const name = getLocalized(service, "name", locale);
  const description = (locale === "ar" ? service.descAr : service.descEn) || undefined;

  return {
    title: name,
    description,
    alternates: localeAlternates(`/services/${slug}`, locale),
    openGraph: { title: name, description },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("ServiceDetail");
  const locale = await getLocale();

  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const jsonLd = buildServiceJsonLd(
    {
      ...service,
      variants: service.variants.map((v) => ({ priceAed: Number(v.priceAed) })),
    },
    locale,
  );

  const name = getLocalized(service, "name", locale);
  const description = locale === "ar" ? service.descAr : service.descEn;

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6 lg:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/services"
        className="group inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-medium text-ink/70 transition-colors hover:text-mulberry focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <ArrowLeft
          className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:translate-x-0.5"
          aria-hidden="true"
        />
        {t("back")}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        <Reveal className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush shadow-[var(--shadow-soft)]">
            {service.imageUrl ? (
              // Admin-uploaded image (see site-header.tsx for why this is a plain <img>).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div
                aria-hidden="true"
                className="flex size-full items-center justify-center bg-[radial-gradient(120%_90%_at_20%_10%,white_0%,var(--blush)_45%,color-mix(in_oklab,var(--blush)_70%,var(--mulberry))_100%)]"
              >
                <span className="font-display text-[10rem] leading-none font-semibold text-mulberry/15">
                  {name.trim().charAt(0)}
                </span>
              </div>
            )}
          </div>
        </Reveal>

        <div className="lg:col-span-7 lg:pt-4">
          <Reveal>
            <p className="text-sm font-medium text-mulberry">
              {getLocalized(service.category, "name", locale)}
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {name}
            </h1>
            {description && (
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/70">{description}</p>
            )}
          </Reveal>

          <h2 className="mt-12 font-display text-xl font-semibold text-ink">
            {t("chooseOption")}
          </h2>
          <RevealGroup as="ul" className="mt-5 space-y-3">
            {service.variants.map((variant) => (
              <RevealItem
                as="li"
                key={variant.id}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-ink/8 bg-white p-5 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-300 hover:border-mulberry/25 hover:shadow-[var(--shadow-lift)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-ink">
                    {getLocalized(variant, "label", locale)}
                  </p>
                  <p className="mt-1 flex items-center gap-4 text-sm text-ink/60">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4" aria-hidden="true" />
                      <span className="sr-only">{t("duration")}: </span>
                      {t("minutes", { count: variant.durationMinutes })}
                    </span>
                    <span className="text-base font-semibold text-ink">
                      <span className="sr-only">{t("price")}: </span>
                      <Price amount={Number(variant.priceAed)} />
                    </span>
                  </p>
                </div>
                <Link href={`/book?v=${variant.id}:1`} className={`${ctaPrimary} shrink-0`}>
                  {t("bookThisService")}
                  <ArrowRight className={ctaArrow} aria-hidden="true" />
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </main>
  );
}
