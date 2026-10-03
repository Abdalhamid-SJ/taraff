import { getTranslations } from "next-intl/server";
import { CategoryForm } from "../_components/category-form";

export default async function NewCategoryPage() {
  const t = await getTranslations("AdminServices");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{t("addCategory")}</h1>
      <div className="mt-6">
        <CategoryForm
          initial={{ nameEn: "", nameAr: "", slug: "", sortOrder: 0, isActive: true }}
        />
      </div>
    </div>
  );
}
