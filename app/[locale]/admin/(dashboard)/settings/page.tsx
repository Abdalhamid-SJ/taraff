import { getTranslations } from "next-intl/server";
import { getAllSettings } from "@/lib/data/admin-settings";
import { SettingsForm } from "./_components/settings-form";

export default async function AdminSettingsPage() {
  const t = await getTranslations("AdminSettings");
  const settings = await getAllSettings();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{t("heading")}</h1>
      <div className="mt-6">
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
