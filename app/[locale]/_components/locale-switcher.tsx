"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const current = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <nav className="flex gap-1" aria-label={t("languageNav")}>
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={query ? `${pathname}?${query}` : pathname}
          locale={locale}
          aria-current={locale === current ? "true" : undefined}
          className={`${locale === current ? "hidden sm:inline-flex" : "inline-flex"} min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium text-ink/75 transition-colors duration-200 hover:bg-blush hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass aria-[current=true]:text-mulberry`}
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
