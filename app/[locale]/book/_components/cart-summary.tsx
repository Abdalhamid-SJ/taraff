"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getLocalized } from "@/lib/localized";
import { fromHalalas, toHalalas } from "@/lib/pricing";
import { Price } from "@/components/currency-symbol";
import { useFormatDuration } from "@/components/booking/use-format-duration";
import { cartTotals, findVariantWithService } from "../_lib/cart";
import type { CartLine, CategoryDto } from "../_lib/types";

export function CartSummary({
  lines,
  categories,
  onRemove,
}: {
  lines: CartLine[];
  categories: CategoryDto[];
  onRemove?: (variantId: string) => void;
}) {
  const t = useTranslations("Book");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const formatDuration = useFormatDuration();
  const { totalAed, totalMinutes } = cartTotals(lines, categories);

  return (
    <div className="rounded-[1.75rem] border border-ink/8 bg-white p-5 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-lg font-semibold text-ink">{t("cartHeading")}</h2>
      {lines.length === 0 ? (
        <p className="mt-2 text-sm text-ink/60">{t("cartEmpty")}</p>
      ) : (
        <ul className="mt-3">
          <AnimatePresence initial={false}>
            {lines.map((line) => {
              const found = findVariantWithService(categories, line.variantId);
              if (!found) return null;
              const { service, variant } = found;
              return (
                <motion.li
                  key={line.variantId}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{getLocalized(service, "name", locale)}</p>
                    <p className="text-ink/60">
                      {getLocalized(variant, "label", locale)}
                      {line.quantity > 1 && <span dir="ltr"> × {line.quantity}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Price
                      amount={fromHalalas(toHalalas(variant.priceAed) * line.quantity)}
                      className="font-semibold text-ink"
                    />
                    {onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(line.variantId)}
                        aria-label={`${t("cartRemove")}: ${getLocalized(service, "name", locale)}`}
                        className="-me-2 flex size-11 items-center justify-center rounded-full text-ink/45 transition-colors hover:bg-blush hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {lines.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-ink/8 pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-ink/60">{t("cartDuration")}</span>
            <span className="text-ink">{formatDuration(totalMinutes)}</span>
          </div>
          <div className="flex justify-between gap-3 text-base font-semibold">
            <span className="text-ink">{t("cartTotal")}</span>
            <Price amount={totalAed} className="text-mulberry" />
          </div>
        </div>
      )}
    </div>
  );
}
