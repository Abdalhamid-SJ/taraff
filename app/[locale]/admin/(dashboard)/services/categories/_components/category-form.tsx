"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { saveCategoryAction } from "@/lib/actions/admin-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CategoryFormValues {
  id?: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export function CategoryForm({ initial }: { initial: CategoryFormValues }) {
  const t = useTranslations("AdminServices");
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"VALIDATION_ERROR" | "SLUG_TAKEN" | null>(null);

  function set<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await saveCategoryAction(values);
    setPending(false);
    if (result.ok) {
      router.push("/admin/services");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="nameEn">{t("fieldNameEn")}</Label>
        <Input
          id="nameEn"
          required
          className="mt-1.5 min-h-11"
          value={values.nameEn}
          onChange={(e) => set("nameEn", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="nameAr">{t("fieldNameAr")}</Label>
        <Input
          id="nameAr"
          required
          dir="rtl"
          className="mt-1.5 min-h-11"
          value={values.nameAr}
          onChange={(e) => set("nameAr", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="slug">{t("fieldSlug")}</Label>
        <Input
          id="slug"
          required
          dir="ltr"
          className="mt-1.5 min-h-11"
          value={values.slug}
          onChange={(e) => set("slug", e.target.value)}
        />
        <p className="mt-1 text-xs text-ink/50">{t("fieldSlugHint")}</p>
      </div>
      <div>
        <Label htmlFor="sortOrder">{t("fieldSortOrder")}</Label>
        <Input
          id="sortOrder"
          type="number"
          className="mt-1.5 min-h-11 w-32"
          value={values.sortOrder}
          onChange={(e) => set("sortOrder", Number(e.target.value))}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
        {t("fieldActive")}
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error === "SLUG_TAKEN" ? t("errorSlugTaken") : t("errorValidation")}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="min-h-11 bg-mulberry text-paper hover:opacity-90"
        >
          {pending ? t("saving") : t("save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/services")}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
