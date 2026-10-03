import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllBeauticians } from "@/lib/data/admin-beauticians";
import { Badge } from "@/components/ui/badge";
import { BeauticianToggle } from "./_components/beautician-toggle";

export default async function AdminBeauticiansPage() {
  const t = await getTranslations("AdminBeauticians");
  const beauticians = await getAllBeauticians();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">{t("heading")}</h1>
        <Link
          href="/admin/beauticians/new"
          className="inline-flex min-h-11 items-center rounded-md bg-mulberry px-4 text-sm font-medium text-paper hover:opacity-90"
        >
          {t("addBeautician")}
        </Link>
      </div>

      {beauticians.length === 0 ? (
        <p className="mt-6 text-ink/60">{t("noBeauticians")}</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-blush/40 text-ink/70">
                <th className="px-3 py-2 text-start font-medium">{t("colName")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("colPhone")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("colStatus")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {beauticians.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-ink">{b.fullName}</td>
                  <td className="px-3 py-2 text-ink/70" dir="ltr">
                    {b.phone}
                  </td>
                  <td className="px-3 py-2">
                    {!b.isActive && (
                      <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                        {t("inactiveBadge")}
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/beauticians/${b.id}/edit`}
                        className="min-h-11 inline-flex items-center rounded-md border border-border px-3 text-sm text-ink hover:bg-blush"
                      >
                        {t("edit")}
                      </Link>
                      <BeauticianToggle id={b.id} isActive={b.isActive} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
