"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleCategoryActiveAction } from "@/lib/actions/admin-catalog";

export function CategoryToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const t = useTranslations("AdminServices");
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleCategoryActiveAction(id, !isActive))}
      className="min-h-11 rounded-md border border-border px-3 text-sm text-ink hover:bg-blush"
    >
      {isActive ? t("deactivate") : t("activate")}
    </button>
  );
}
