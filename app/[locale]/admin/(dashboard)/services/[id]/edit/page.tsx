import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAllCategoriesForSelect, getServiceById } from "@/lib/data/admin-catalog";
import { ServiceForm } from "../../_components/service-form";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("AdminServices");

  const [service, categories] = await Promise.all([
    getServiceById(id),
    getAllCategoriesForSelect(),
  ]);
  if (!service) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{t("editService")}</h1>
      <div className="mt-6">
        <ServiceForm
          categories={categories}
          initial={{
            id: service.id,
            categoryId: service.categoryId,
            nameEn: service.nameEn,
            nameAr: service.nameAr,
            descEn: service.descEn ?? "",
            descAr: service.descAr ?? "",
            slug: service.slug,
            imageUrl: service.imageUrl ?? "",
            sortOrder: service.sortOrder,
            isActive: service.isActive,
            variants: service.variants.map((v) => ({
              id: v.id,
              labelEn: v.labelEn,
              labelAr: v.labelAr,
              priceAed: Number(v.priceAed),
              durationMinutes: v.durationMinutes,
              sortOrder: v.sortOrder,
            })),
          }}
        />
      </div>
    </div>
  );
}
