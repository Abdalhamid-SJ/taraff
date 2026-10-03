import { z } from "zod";

export const businessHoursDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
});

export const settingsInputSchema = z.object({
  travelBufferMinutes: z.coerce.number().int().positive(),
  bookingLeadTimeHours: z.coerce.number().int().positive(),
  maxAdvanceDays: z.coerce.number().int().positive(),
  slotGranularityMinutes: z.coerce.number().int().positive(),
  businessHours: z.array(businessHoursDaySchema),
  whatsappAdminNumbers: z.array(z.string().trim().min(1)),
  // https URL of the uploaded logo, or "" for none.
  siteLogoUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https:\/\/\S+$/i.test(v), "Must be an https URL"),
  siteContact: z.object({
    phone: z.string().trim(),
    whatsapp: z.string().trim(),
    email: z.string().trim(),
  }),
});
export type SettingsInput = z.infer<typeof settingsInputSchema>;
