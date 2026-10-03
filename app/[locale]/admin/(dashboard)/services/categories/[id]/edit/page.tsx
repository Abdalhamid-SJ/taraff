import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCategoryById } from "@/lib/data/admin-catalog";
import { CategoryForm } from "../../_components/category-form";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("AdminServices");
  const category = await getCategoryById(id);
  if (!category) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{t("editCategory")}</h1>
      <div className="mt-6">
        <CategoryForm
          initial={{
            id: category.id,
            nameEn: category.nameEn,
            nameAr: category.nameAr,
            slug: category.slug,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
          }}
        />
      </div>
    </div>
  );
}
