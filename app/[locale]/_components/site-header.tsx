import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteLogoUrl } from "@/lib/site-logo";
import { HeaderShell } from "./header-shell";
import { LocaleSwitcher } from "./locale-switcher";
import { NavLinks } from "./nav-links";

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const logoUrl = await getSiteLogoUrl();

  return (
    <HeaderShell>
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-full font-display text-xl font-semibold tracking-tight text-mulberry focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          {/* Plain <img> on purpose: an admin-uploaded logo lives on a Blob store
              whose hostname varies per deployment, so next/image remote patterns
              can't be fixed in config. The logo already shows the brand name, so
              the text name is kept for screen readers only. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" className="h-12 w-auto max-w-[8rem] object-contain sm:h-14" />
          <span className="sr-only">{t("brand")}</span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-2" aria-label={t("mainNav")}>
          <NavLinks
            labels={{ services: t("services"), account: t("account"), book: t("book") }}
          />
          <LocaleSwitcher />
        </nav>
      </div>
    </HeaderShell>
  );
}
