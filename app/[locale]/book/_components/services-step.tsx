"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Clock, Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getLocalized } from "@/lib/localized";
import { MAX_QUANTITY } from "@/lib/validation/booking";
import { Price } from "@/components/currency-symbol";
import { HorizontalScroller } from "@/components/booking/horizontal-scroller";
import { useFormatDuration } from "@/components/booking/use-format-duration";
import { cartTotals } from "../_lib/cart";
import type { CartLine, CategoryDto, ServiceDto } from "../_lib/types";
import { CartSummary } from "./cart-summary";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ServicesStep({
  categories,
  lines,
  onSelect,
  onRemove,
  onQuantity,
  onNext,
}: {
  categories: CategoryDto[];
  lines: CartLine[];
  onSelect: (service: ServiceDto, variantId: string) => void;
  onRemove: (variantId: string) => void;
  // +1 / -1: applied to the latest cart, so rapid taps all count.
  onQuantity: (variantId: string, delta: 1 | -1) => void;
  onNext: () => void;
}) {
  const t = useTranslations("Book");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const formatDuration = useFormatDuration();
  const pillId = useId();
  const selectedIds = new Set(lines.map((l) => l.variantId));

  // Open on the category of the first thing already in the cart (e.g. when
  // arriving from a service page), otherwise the first category.
  const [activeId, setActiveId] = useState(
    () =>
      categories.find((c) => c.services.some((s) => s.variants.some((v) => selectedIds.has(v.id))))
        ?.id ?? categories[0]?.id,
  );
  const active = categories.find((c) => c.id === activeId) ?? categories[0];
  const { totalAed, totalMinutes } = cartTotals(lines, categories);

  const selectedInCategory = (category: CategoryDto) =>
    category.services.filter((s) => s.variants.some((v) => selectedIds.has(v.id))).length;

  return (
    <div className="grid grid-cols-1 gap-10 pb-28 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-0">
      <div className="min-w-0">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          {t("servicesHeading")}
        </h2>
        <p className="mt-2 max-w-xl text-ink/70">{t("servicesSubheading")}</p>

        {categories.length > 1 && (
          <div className="sticky top-[4.5rem] z-20 -mx-4 mt-6 bg-paper/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
            <HorizontalScroller label={t("categoriesNav")} trackClassName="gap-2 py-0.5">
              {categories.map((category) => {
                const isActive = category.id === active?.id;
                const count = selectedInCategory(category);
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveId(category.id)}
                    className={`relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                      isActive
                        ? "border-transparent text-paper"
                        : "border-ink/10 bg-white text-ink/75 hover:border-mulberry/30 hover:text-ink"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId={pillId}
                        className="absolute inset-0 rounded-full bg-mulberry"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{getLocalized(category, "name", locale)}</span>
                    {count > 0 && (
                      <span
                        className={`relative flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isActive ? "bg-paper text-mulberry" : "bg-mulberry text-paper"
                        }`}
                        aria-label={t("selectedCount", { count })}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </HorizontalScroller>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active?.id}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-6 space-y-4"
          >
            {active?.services.map((service) => (
              <ServiceOptionCard
                key={service.id}
                service={service}
                lines={lines}
                onSelect={onSelect}
                onRemove={onRemove}
                onQuantity={onQuantity}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop: summary rides alongside the list. */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 space-y-4">
          <CartSummary lines={lines} categories={categories} onRemove={onRemove} />
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={onNext}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-mulberry text-base font-medium text-paper shadow-[var(--shadow-lift)] transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            {t("next")}
          </button>
        </div>
      </aside>

      {/* Phones: a bottom bar keeps the total and Continue in reach. */}
      <AnimatePresence>
        {lines.length > 0 && (
          <motion.div
            initial={reduce ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-ink">
                  <Price amount={totalAed} />
                </p>
                <p className="truncate text-ink/60">
                  {t("cartItemsCount", { count: lines.length })} · {formatDuration(totalMinutes)}
                </p>
              </div>
              <button
                type="button"
                onClick={onNext}
                className="min-h-12 shrink-0 rounded-full bg-mulberry px-7 text-base font-medium text-paper shadow-[var(--shadow-lift)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              >
                {t("next")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceOptionCard({
  service,
  lines,
  onSelect,
  onRemove,
  onQuantity,
}: {
  service: ServiceDto;
  lines: CartLine[];
  onSelect: (service: ServiceDto, variantId: string) => void;
  onRemove: (variantId: string) => void;
  onQuantity: (variantId: string, delta: 1 | -1) => void;
}) {
  const t = useTranslations("Book");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const formatDuration = useFormatDuration();
  const [expanded, setExpanded] = useState(false);

  const name = getLocalized(service, "name", locale);
  const description = (locale === "ar" ? service.descAr : service.descEn)?.trim() || "";
  const longDescription = description.length > 160;
  const selectedLine = lines.find((l) => service.variants.some((v) => v.id === l.variantId));
  const cheapest = Math.min(...service.variants.map((v) => v.priceAed));

  return (
    <article
      className={`rounded-[1.75rem] border bg-white p-4 transition-[border-color,box-shadow] duration-300 sm:p-5 ${
        selectedLine
          ? "border-mulberry/40 shadow-[var(--shadow-lift)]"
          : "border-ink/8 shadow-[var(--shadow-soft)]"
      }`}
    >
      <div className="flex gap-4 sm:gap-5">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-blush sm:size-28">
          {service.imageUrl ? (
            // Admin-uploaded image (see site-header.tsx for why this is a plain <img>).
            // eslint-disable-next-line @next/next/no-img-element
            <img src={service.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-full items-center justify-center bg-[radial-gradient(120%_90%_at_20%_10%,white_0%,var(--blush)_50%,color-mix(in_oklab,var(--blush)_70%,var(--mulberry))_100%)]"
            >
              <span className="font-display text-4xl font-semibold text-mulberry/25">
                {name.trim().charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg leading-snug font-semibold text-ink sm:text-xl">{name}</h3>
          <p className="mt-0.5 text-sm text-ink/60">
            {t("fromPrice")} <Price amount={cheapest} className="font-semibold text-ink" />
          </p>
          {description && (
            <div className="mt-2 text-sm leading-relaxed text-ink/75">
              <p className={!expanded && longDescription ? "line-clamp-3" : undefined}>{description}</p>
              {longDescription && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="mt-1 font-medium text-mulberry underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
                >
                  {expanded ? t("readLess") : t("readMore")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="sr-only">{t("optionsLabel")}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {service.variants.map((variant) => {
            const selected = selectedLine?.variantId === variant.id;
            return (
              <button
                key={variant.id}
                type="button"
                aria-pressed={selected}
                onClick={() => (selected ? onRemove(variant.id) : onSelect(service, variant.id))}
                className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-start transition-[background-color,border-color,transform] duration-200 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                  selected
                    ? "border-mulberry bg-blush/70"
                    : "border-ink/10 bg-paper hover:border-mulberry/40"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">
                    {getLocalized(variant, "label", locale)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/60">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {formatDuration(variant.durationMinutes)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <Price amount={variant.priceAed} className="text-sm font-semibold text-ink" />
                  <span
                    aria-hidden="true"
                    className={`flex size-6 items-center justify-center rounded-full border transition-colors duration-200 ${
                      selected ? "border-mulberry bg-mulberry text-paper" : "border-ink/20 text-transparent"
                    }`}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {selectedLine && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-blush/50 px-4 py-2">
              <span className="text-sm font-medium text-ink">{t("peopleLabel")}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onQuantity(selectedLine.variantId, -1)}
                  disabled={selectedLine.quantity <= 1}
                  aria-label={t("decrease")}
                  className="flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-white disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span className="w-6 text-center font-semibold text-ink tabular-nums" aria-live="polite">
                  {selectedLine.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantity(selectedLine.variantId, 1)}
                  disabled={selectedLine.quantity >= MAX_QUANTITY}
                  aria-label={t("increase")}
                  className="flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-white disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
