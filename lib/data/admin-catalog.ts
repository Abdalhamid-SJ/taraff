import { prisma } from "@/lib/db";

export function getAllCategoriesWithServices() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      services: {
        orderBy: { sortOrder: "asc" },
        include: { variants: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
}

export function getAllCategoriesForSelect() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameEn: true, nameAr: true },
  });
}

export function getCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export function getServiceById(id: string) {
  return prisma.service.findUnique({
    where: { id },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
}
