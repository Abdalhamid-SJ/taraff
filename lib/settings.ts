import { z } from "zod";
import { prisma } from "@/lib/db";
import type { BusinessHoursDay, SchedulingSettings } from "@/lib/scheduling";

const DEFAULTS: SchedulingSettings = {
  travelBufferMinutes: 45,
  bookingLeadTimeHours: 3,
  maxAdvanceDays: 30,
  slotGranularityMinutes: 30,
};

// Shown in the admin settings form when nothing has been saved yet, and used
// by the scheduler in the same case, so what the admin sees is what applies.
export const DEFAULT_BUSINESS_HOURS: BusinessHoursDay[] = [0, 1, 2, 3, 4, 5, 6].map(
  (dayOfWeek) => ({ dayOfWeek, startMinute: 9 * 60, endMinute: 21 * 60 }),
);

const businessHoursSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1440),
    endMinute: z.number().int().min(0).max(1440),
  }),
);

export async function getSchedulingSettings(): Promise<SchedulingSettings> {
  const keys = Object.keys(DEFAULTS);
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const values = new Map(rows.map((r) => [r.key, JSON.parse(r.value) as number]));

  return {
    travelBufferMinutes: values.get("travelBufferMinutes") ?? DEFAULTS.travelBufferMinutes,
    bookingLeadTimeHours: values.get("bookingLeadTimeHours") ?? DEFAULTS.bookingLeadTimeHours,
    maxAdvanceDays: values.get("maxAdvanceDays") ?? DEFAULTS.maxAdvanceDays,
    slotGranularityMinutes:
      values.get("slotGranularityMinutes") ?? DEFAULTS.slotGranularityMinutes,
  };
}

export async function getBusinessHours(): Promise<BusinessHoursDay[]> {
  const row = await prisma.setting.findUnique({ where: { key: "businessHours" } });
  if (!row) return DEFAULT_BUSINESS_HOURS;
  try {
    const parsed = businessHoursSchema.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : DEFAULT_BUSINESS_HOURS;
  } catch {
    return DEFAULT_BUSINESS_HOURS;
  }
}

export async function getWhatsappAdminNumbers(): Promise<string[]> {
  const row = await prisma.setting.findUnique({ where: { key: "whatsappAdminNumbers" } });
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.filter((n): n is string => typeof n === "string") : [];
  } catch {
    return [];
  }
}
