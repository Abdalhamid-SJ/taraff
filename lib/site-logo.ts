import { prisma } from "@/lib/db";

// The brand logo shipped with the site, used until an admin uploads one.
export const DEFAULT_SITE_LOGO = "/brand/taraf-logo.png";

// The admin-uploaded logo lives in the Setting table under `siteLogoUrl`
// (a JSON-encoded URL, empty/absent = use the default). It is shown in the
// header and used as the browser-tab icon.
export async function getSiteLogoUrl(): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "siteLogoUrl" } });
    if (!row) return DEFAULT_SITE_LOGO;
    const value: unknown = JSON.parse(row.value);
    return typeof value === "string" && /^https:\/\//i.test(value) ? value : DEFAULT_SITE_LOGO;
  } catch {
    // A logo is decoration — never let a settings hiccup take a page down.
    return DEFAULT_SITE_LOGO;
  }
}
