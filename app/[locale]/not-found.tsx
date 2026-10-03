import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("Common");

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-semibold text-brass">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-ink/70">{t("notFoundBody")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-full bg-mulberry px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {t("notFoundCta")}
      </Link>
    </main>
  );
}
