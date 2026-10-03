"use client";

import { useTranslations } from "next-intl";
import { logoutAction } from "@/lib/actions/auth";

export function SignOutButton({ redirectTo }: { redirectTo: string }) {
  const t = useTranslations("Account");

  return (
    <form action={logoutAction.bind(null, redirectTo)}>
      <button
        type="submit"
        className="min-h-11 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-blush hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {t("signOut")}
      </button>
    </form>
  );
}
