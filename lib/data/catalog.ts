import { prisma } from "@/lib/db";

export function getActiveCategoriesWithServices() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
}

export function getServiceBySlug(slug: string) {
  return prisma.service.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getActiveAreasByEmirate() {
  const areas = await prisma.area.findMany({
    where: { isActive: true },
    orderBy: [{ emirate: "asc" }, { nameEn: "asc" }],
  });

  const grouped = new Map<string, typeof areas>();
  for (const area of areas) {
    const list = grouped.get(area.emirate) ?? [];
    list.push(area);
    grouped.set(area.emirate, list);
  }
  return grouped;
}

export function getActiveAreas() {
  return prisma.area.findMany({
    where: { isActive: true },
    orderBy: [{ emirate: "asc" }, { nameEn: "asc" }],
  });
}
