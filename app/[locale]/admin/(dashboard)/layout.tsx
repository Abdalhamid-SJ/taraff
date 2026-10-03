import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth-roles";
import { getSiteLogoUrl } from "@/lib/site-logo";
import { AdminNav } from "../_components/admin-nav";
import { SignOutButton } from "../_components/sign-out-button";

export default async function AdminDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  // Defense in depth — middleware already gates /admin, this guards direct
  // server-side rendering paths too (e.g. a stale session cookie edge case).
  if (!session || !isStaffRole(session.user?.role)) {
    redirect(`/${locale}/admin/login`);
  }
  const t = await getTranslations("AdminNav");
  const logoUrl = await getSiteLogoUrl();

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <span className="flex items-center gap-2.5 font-display text-lg font-semibold text-mulberry">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-10 max-w-[8rem] w-auto object-contain" />
          )}
          {t("brand")}
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink/70 sm:inline">{session.user?.email}</span>
          <SignOutButton redirectTo={`/${locale}/admin/login`} />
        </div>
      </header>
      <AdminNav />
      <main className="px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
