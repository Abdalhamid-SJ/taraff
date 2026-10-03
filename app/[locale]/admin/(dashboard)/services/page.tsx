import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllCategoriesWithServices } from "@/lib/data/admin-catalog";
import { getLocalized } from "@/lib/localized";
import { Badge } from "@/components/ui/badge";
import { CategoryToggle } from "./_components/category-toggle";
import { ServiceToggle } from "./_components/service-toggle";

export default async function AdminServicesPage() {
  const t = await getTranslations("AdminServices");
  const locale = await getLocale();
  const categories = await getAllCategoriesWithServices();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">{t("heading")}</h1>
        <Link
          href="/admin/services/categories/new"
          className="inline-flex min-h-11 items-center rounded-md border border-mulberry px-4 text-sm font-medium text-mulberry hover:bg-blush"
        >
          {t("addCategory")}
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="mt-6 text-ink/60">{t("noCategories")}</p>
      ) : (
        <div className="mt-6 space-y-8">
          {categories.map((category) => (
            <section key={category.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-mulberry">
                    {getLocalized(category, "name", locale)}
                  </h2>
                  {!category.isActive && (
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                      {t("inactiveBadge")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/services/categories/${category.id}/edit`}
                    className="min-h-11 inline-flex items-center rounded-md border border-border px-3 text-sm text-ink hover:bg-blush"
                  >
                    {t("editCategory")}
                  </Link>
                  <CategoryToggle id={category.id} isActive={category.isActive} />
                  <Link
                    href={`/admin/services/new?category=${category.id}`}
                    className="min-h-11 inline-flex items-center rounded-md bg-mulberry px-3 text-sm font-medium text-paper hover:opacity-90"
                  >
                    {t("addService")}
                  </Link>
                </div>
              </div>

              {category.services.length === 0 ? (
                <p className="mt-3 text-sm text-ink/60">{t("noServicesInCategory")}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {category.services.map((service) => (
                    <li
                      key={service.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">
                          {getLocalized(service, "name", locale)}
                        </span>
                        <span className="text-xs text-ink/50">
                          {service.variants.length} {t("variantsHeading").toLowerCase()}
                        </span>
                        {!service.isActive && (
                          <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                            {t("inactiveBadge")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/services/${service.id}/edit`}
                          className="min-h-11 inline-flex items-center rounded-md border border-border px-3 text-sm text-ink hover:bg-blush"
                        >
                          {t("editService")}
                        </Link>
                        <ServiceToggle id={service.id} isActive={service.isActive} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
