"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleBeauticianActiveAction } from "@/lib/actions/admin-beauticians";

export function BeauticianToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const t = useTranslations("AdminBeauticians");
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleBeauticianActiveAction(id, !isActive))}
      className="min-h-11 rounded-md border border-border px-3 text-sm text-ink hover:bg-blush"
    >
      {isActive ? t("deactivate") : t("activate")}
    </button>
  );
}
