"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { categoryInputSchema, serviceInputSchema } from "@/lib/validation/admin-catalog";
import { requireAdminSession } from "./require-admin";

function revalidateCatalog() {
  revalidatePath("/[locale]/admin", "layout");
  revalidatePath("/[locale]", "layout");
}

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: "VALIDATION_ERROR" | "SLUG_TAKEN" };

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function saveCategoryAction(input: unknown): Promise<SaveResult> {
  await requireAdminSession();

  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "VALIDATION_ERROR" };
  const data = parsed.data;

  try {
    const saved = data.id
      ? await prisma.category.update({ where: { id: data.id }, data })
      : await prisma.category.create({ data });
    revalidateCatalog();
    return { ok: true, id: saved.id };
  } catch (err) {
    if (isUniqueConstraintError(err)) return { ok: false, error: "SLUG_TAKEN" };
    throw err;
  }
}

export async function toggleCategoryActiveAction(id: string, isActive: boolean) {
  await requireAdminSession();
  await prisma.category.update({ where: { id }, data: { isActive } });
  revalidateCatalog();
}

export async function saveServiceAction(input: unknown): Promise<SaveResult> {
  await requireAdminSession();

  const parsed = serviceInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "VALIDATION_ERROR" };
  const data = parsed.data;

  try {
    const serviceId = await prisma.$transaction(async (tx) => {
      const service = data.id
        ? await tx.service.update({
            where: { id: data.id },
            data: {
              categoryId: data.categoryId,
              nameEn: data.nameEn,
              nameAr: data.nameAr,
              descEn: data.descEn || null,
              descAr: data.descAr || null,
              slug: data.slug,
              imageUrl: data.imageUrl || null,
              sortOrder: data.sortOrder,
              isActive: data.isActive,
            },
          })
        : await tx.service.create({
            data: {
              categoryId: data.categoryId,
              nameEn: data.nameEn,
              nameAr: data.nameAr,
              descEn: data.descEn || null,
              descAr: data.descAr || null,
              slug: data.slug,
              imageUrl: data.imageUrl || null,
              sortOrder: data.sortOrder,
              isActive: data.isActive,
            },
          });

      const submittedIds = data.variants.filter((v) => v.id).map((v) => v.id as string);
      // Remove variants dropped from the form. Restricted by FK if a variant
      // was already used in a historical booking — that throw propagates and
      // aborts the whole save, which is the correct outcome (never silently
      // orphan booking history).
      await tx.serviceVariant.deleteMany({
        where: { serviceId: service.id, id: { notIn: submittedIds } },
      });

      for (const variant of data.variants) {
        if (variant.id) {
          await tx.serviceVariant.update({
            where: { id: variant.id },
            data: {
              labelEn: variant.labelEn,
              labelAr: variant.labelAr,
              priceAed: variant.priceAed,
              durationMinutes: variant.durationMinutes,
              sortOrder: variant.sortOrder,
            },
          });
        } else {
          await tx.serviceVariant.create({
            data: {
              serviceId: service.id,
              labelEn: variant.labelEn,
              labelAr: variant.labelAr,
              priceAed: variant.priceAed,
              durationMinutes: variant.durationMinutes,
              sortOrder: variant.sortOrder,
            },
          });
        }
      }

      return service.id;
    });

    revalidateCatalog();
    return { ok: true, id: serviceId };
  } catch (err) {
    if (isUniqueConstraintError(err)) return { ok: false, error: "SLUG_TAKEN" };
    throw err;
  }
}

export async function toggleServiceActiveAction(id: string, isActive: boolean) {
  await requireAdminSession();
  await prisma.service.update({ where: { id }, data: { isActive } });
  revalidateCatalog();
}
