import { getTranslations } from "next-intl/server";
import { getAllCategoriesForSelect } from "@/lib/data/admin-catalog";
import { ServiceForm } from "../_components/service-form";

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const t = await getTranslations("AdminServices");
  const categories = await getAllCategoriesForSelect();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{t("addService")}</h1>
      <div className="mt-6">
        <ServiceForm
          categories={categories}
          initial={{
            categoryId: category ?? categories[0]?.id ?? "",
            nameEn: "",
            nameAr: "",
            descEn: "",
            descAr: "",
            slug: "",
            imageUrl: "",
            sortOrder: 0,
            isActive: true,
            variants: [{ labelEn: "", labelAr: "", priceAed: 0, durationMinutes: 0, sortOrder: 0 }],
          }}
        />
      </div>
    </div>
  );
}
