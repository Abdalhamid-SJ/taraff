import { z } from "zod";

export const dayAvailabilityInputSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
});

export const timeOffInputSchema = z.object({
  id: z.string().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  reason: z.string().trim().optional().or(z.literal("")),
});

export const beauticianInputSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().trim().min(1, "Required"),
  phone: z.string().trim().min(1, "Required"),
  photoUrl: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.string()).default([]),
  availability: z.array(dayAvailabilityInputSchema).default([]),
  timeOff: z.array(timeOffInputSchema).default([]),
});
export type BeauticianInput = z.infer<typeof beauticianInputSchema>;
