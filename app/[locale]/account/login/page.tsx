import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "./_components/login-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("loginMetaTitle"), robots: { index: false, follow: false } };
}

export default async function CustomerLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale } = await params;
  const { from } = await searchParams;
  const t = await getTranslations("Account");

  // Only ever send the customer back to a page in this locale — `from` is
  // user-controlled, so it must never be an open-redirect target. (The server
  // action re-checks this too.)
  const redirectTo =
    from && from.startsWith(`/${locale}/`) && !from.startsWith("//") ? from : `/${locale}/account`;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("loginHeading")}</h1>
      <p className="mt-1 text-ink/70">{t("loginSubheading")}</p>

      <div className="mt-6">
        <LoginForm locale={locale} redirectTo={redirectTo} />
      </div>

      <p className="mt-6 text-sm text-ink/70">
        {t("noAccount")}{" "}
        <Link href="/account/register" className="font-medium text-mulberry underline">
          {t("createAccount")}
        </Link>
      </p>
    </main>
  );
}
