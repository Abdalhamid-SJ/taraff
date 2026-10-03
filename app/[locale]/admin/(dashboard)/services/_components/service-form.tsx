"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { saveServiceAction } from "@/lib/actions/admin-catalog";
import { ImageUpload } from "@/app/[locale]/admin/_components/image-upload";
import { CurrencySymbol } from "@/components/currency-symbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface VariantFormValues {
  id?: string;
  labelEn: string;
  labelAr: string;
  priceAed: number;
  durationMinutes: number;
  sortOrder: number;
}

export interface ServiceFormValues {
  id?: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  variants: VariantFormValues[];
}

function emptyVariant(sortOrder: number): VariantFormValues {
  return { labelEn: "", labelAr: "", priceAed: 0, durationMinutes: 0, sortOrder };
}

export function ServiceForm({
  initial,
  categories,
}: {
  initial: ServiceFormValues;
  categories: { id: string; nameEn: string; nameAr: string }[];
}) {
  const t = useTranslations("AdminServices");
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"VALIDATION_ERROR" | "SLUG_TAKEN" | null>(null);

  function set<K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function setVariant<K extends keyof VariantFormValues>(
    index: number,
    key: K,
    value: VariantFormValues[K],
  ) {
    setValues((v) => ({
      ...v,
      variants: v.variants.map((variant, i) =>
        i === index ? { ...variant, [key]: value } : variant,
      ),
    }));
  }

  function addVariant() {
    setValues((v) => ({ ...v, variants: [...v.variants, emptyVariant(v.variants.length)] }));
  }

  function removeVariant(index: number) {
    setValues((v) => ({ ...v, variants: v.variants.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await saveServiceAction(values);
    setPending(false);
    if (result.ok) {
      router.push("/admin/services");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <Label htmlFor="categoryId">{t("fieldCategory")}</Label>
        <select
          id="categoryId"
          required
          value={values.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
          className="mt-1.5 min-h-11 w-full rounded-md border border-border bg-paper px-3 text-sm text-ink"
        >
          <option value="" disabled>
            {t("fieldCategory")}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameEn} / {c.nameAr}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Label htmlFor="descEn">{t("fieldDescEn")}</Label>
          <Textarea
            id="descEn"
            className="mt-1.5"
            value={values.descEn}
            onChange={(e) => set("descEn", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="descAr">{t("fieldDescAr")}</Label>
          <Textarea
            id="descAr"
            dir="rtl"
            className="mt-1.5"
            value={values.descAr}
            onChange={(e) => set("descAr", e.target.value)}
          />
        </div>
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
        <Label>{t("fieldImageUrl")}</Label>
        <div className="mt-1.5">
          <ImageUpload value={values.imageUrl} onChange={(url) => set("imageUrl", url)} />
        </div>
      </div>

      <div className="flex items-center gap-6">
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
      </div>

      <div>
        <h2 className="font-medium text-ink">{t("variantsHeading")}</h2>
        <div className="mt-2 space-y-3">
          {values.variants.map((variant, index) => (
            <div
              key={variant.id ?? `new-${index}`}
              className="grid grid-cols-2 gap-3 rounded-md border border-border p-3 sm:grid-cols-4"
            >
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor={`variant-labelEn-${index}`}>{t("fieldVariantLabelEn")}</Label>
                <Input
                  id={`variant-labelEn-${index}`}
                  required
                  className="mt-1.5 min-h-11"
                  value={variant.labelEn}
                  onChange={(e) => setVariant(index, "labelEn", e.target.value)}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor={`variant-labelAr-${index}`}>{t("fieldVariantLabelAr")}</Label>
                <Input
                  id={`variant-labelAr-${index}`}
                  required
                  dir="rtl"
                  className="mt-1.5 min-h-11"
                  value={variant.labelAr}
                  onChange={(e) => setVariant(index, "labelAr", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`variant-price-${index}`}>
                  {t("fieldPrice")} <CurrencySymbol />
                </Label>
                <Input
                  id={`variant-price-${index}`}
                  type="number"
                  min={1}
                  required
                  className="mt-1.5 min-h-11"
                  value={variant.priceAed}
                  onChange={(e) => setVariant(index, "priceAed", Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor={`variant-duration-${index}`}>{t("fieldDuration")}</Label>
                <Input
                  id={`variant-duration-${index}`}
                  type="number"
                  min={1}
                  required
                  className="mt-1.5 min-h-11"
                  value={variant.durationMinutes}
                  onChange={(e) => setVariant(index, "durationMinutes", Number(e.target.value))}
                />
              </div>
              <div className="col-span-2 sm:col-span-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={values.variants.length <= 1}
                  onClick={() => removeVariant(index)}
                >
                  {t("removeVariant")}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addVariant}>
          {t("addVariant")}
        </Button>
      </div>

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
