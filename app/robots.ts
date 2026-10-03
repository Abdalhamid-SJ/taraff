import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const disallow = routing.locales.flatMap((locale) => [
    `/${locale}/admin`,
    `/${locale}/booking/`,
  ]);

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
