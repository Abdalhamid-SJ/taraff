import { getTranslations } from "next-intl/server";
import { LoginForm } from "./_components/login-form";

export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale } = await params;
  const { from } = await searchParams;
  const t = await getTranslations("AdminLogin");

  // Only ever redirect back into /admin for this locale — never trust `from`
  // as an open redirect target.
  const redirectTo = from && from.startsWith(`/${locale}/admin`) ? from : `/${locale}/admin`;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <h1 className="font-display text-2xl font-semibold text-ink">{t("heading")}</h1>
      <p className="mt-1 text-sm text-ink/70">{t("subheading")}</p>
      <div className="mt-6">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
