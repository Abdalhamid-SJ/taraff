"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { settingsInputSchema } from "@/lib/validation/admin-settings";
import { requireAdminSession } from "./require-admin";

export type SaveSettingsResult = { ok: true } | { ok: false; error: "VALIDATION_ERROR" };

export async function saveSettingsAction(input: unknown): Promise<SaveSettingsResult> {
  await requireAdminSession();

  const parsed = settingsInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "VALIDATION_ERROR" };
  const data = parsed.data;

  await prisma.$transaction(
    Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(value) },
        update: { value: JSON.stringify(value) },
      }),
    ),
  );

  revalidatePath("/[locale]/admin", "layout");
  // The logo appears in the public header and the tab icon on every page.
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
