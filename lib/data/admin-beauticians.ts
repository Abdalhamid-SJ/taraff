import { prisma } from "@/lib/db";

export function getAllBeauticians() {
  return prisma.beautician.findMany({
    orderBy: { fullName: "asc" },
    include: { skills: true },
  });
}

export function getBeauticianById(id: string) {
  return prisma.beautician.findUnique({
    where: { id },
    include: { skills: true, availability: true, timeOff: true },
  });
}

export function getAllServicesForSelect() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameEn: true, nameAr: true },
  });
}
