import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/seo";

// Rendered per-request, not at build time — a DB hiccup during a deploy
// build must never be able to fail the whole build over a sitemap.
export const dynamic = "force-dynamic";

const STATIC_PATHS: { path: string; changeFrequency: "weekly" | "monthly"; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/services", changeFrequency: "monthly", priority: 0.8 },
  { path: "/book", changeFrequency: "monthly", priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { slug: true },
  });

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const { path, changeFrequency, priority } of STATIC_PATHS) {
      entries.push({ url: `${base}/${locale}${path}`, changeFrequency, priority });
    }
    for (const service of services) {
      entries.push({
        url: `${base}/${locale}/services/${service.slug}`,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }
  return entries;
}
