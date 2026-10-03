"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { businessWhatsAppLink } from "@/lib/whatsapp";
import { ctaPrimary, ctaSecondary } from "@/lib/cta";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function SuccessStep({ reference }: { reference: string }) {
  const t = useTranslations("BookingSuccess");
  const whatsappLink = businessWhatsAppLink(reference);
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-lg text-center">
      <motion.div
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-sage/15 text-sage"
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <Check className="size-8" strokeWidth={2.5} aria-hidden="true" />
      </motion.div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>

      <div className="mt-6 rounded-[1.75rem] bg-blush/70 p-6">
        <p className="text-sm text-ink/60">{t("referenceLabel")}</p>
        <p className="mt-1 font-display text-2xl font-semibold tracking-wide text-mulberry" dir="ltr">
          {reference}
        </p>
        <p className="mt-2 text-xs text-ink/60">{t("referenceHint")}</p>
      </div>

      <p className="mt-6 text-ink/70">{t("confirmCallNote")}</p>

      <p className="mt-3 text-sm text-ink/60">{t("accountNote")}</p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/account" className={ctaPrimary}>
          {t("viewInAccount")}
        </Link>
        <Link href="/" className={ctaSecondary}>
          {t("backHome")}
        </Link>
      </div>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-medium text-mulberry underline"
        >
          {t("whatsappCta")}
        </a>
      )}
    </div>
  );
}
