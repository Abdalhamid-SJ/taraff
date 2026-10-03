"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { beauticianInputSchema } from "@/lib/validation/admin-beautician";
import { requireAdminSession } from "./require-admin";

function revalidateAdmin() {
  revalidatePath("/[locale]/admin", "layout");
}

export type SaveBeauticianResult =
  | { ok: true; id: string }
  | { ok: false; error: "VALIDATION_ERROR" };

export async function saveBeauticianAction(input: unknown): Promise<SaveBeauticianResult> {
  await requireAdminSession();

  const parsed = beauticianInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "VALIDATION_ERROR" };
  const data = parsed.data;

  const beauticianId = await prisma.$transaction(async (tx) => {
    const core = {
      fullName: data.fullName,
      phone: data.phone,
      photoUrl: data.photoUrl || null,
      isActive: data.isActive,
    };
    const beautician = data.id
      ? await tx.beautician.update({ where: { id: data.id }, data: core })
      : await tx.beautician.create({ data: core });

    await tx.beauticianService.deleteMany({ where: { beauticianId: beautician.id } });
    if (data.serviceIds.length > 0) {
      await tx.beauticianService.createMany({
        data: data.serviceIds.map((serviceId) => ({ beauticianId: beautician.id, serviceId })),
      });
    }

    await tx.availability.deleteMany({ where: { beauticianId: beautician.id } });
    if (data.availability.length > 0) {
      await tx.availability.createMany({
        data: data.availability.map((a) => ({
          beauticianId: beautician.id,
          dayOfWeek: a.dayOfWeek,
          startMinute: a.startMinute,
          endMinute: a.endMinute,
        })),
      });
    }

    await tx.timeOff.deleteMany({ where: { beauticianId: beautician.id } });
    if (data.timeOff.length > 0) {
      await tx.timeOff.createMany({
        data: data.timeOff.map((t) => ({
          beauticianId: beautician.id,
          startsAt: new Date(t.startsAt),
          endsAt: new Date(t.endsAt),
          reason: t.reason || null,
        })),
      });
    }

    return beautician.id;
  });

  revalidateAdmin();
  return { ok: true, id: beauticianId };
}

export async function toggleBeauticianActiveAction(id: string, isActive: boolean) {
  await requireAdminSession();
  await prisma.beautician.update({ where: { id }, data: { isActive } });
  revalidateAdmin();
}
