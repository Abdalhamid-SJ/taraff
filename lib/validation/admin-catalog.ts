import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only");

export const categoryInputSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().trim().min(1, "Required"),
  nameAr: z.string().trim().min(1, "Required"),
  slug: slugSchema,
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const variantInputSchema = z.object({
  id: z.string().optional(),
  labelEn: z.string().trim().min(1, "Required"),
  labelAr: z.string().trim().min(1, "Required"),
  priceAed: z.coerce.number().positive("Must be greater than 0"),
  durationMinutes: z.coerce.number().int().positive("Must be greater than 0"),
  sortOrder: z.coerce.number().int().default(0),
});
export type VariantInput = z.infer<typeof variantInputSchema>;

export const serviceInputSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Required"),
  nameEn: z.string().trim().min(1, "Required"),
  nameAr: z.string().trim().min(1, "Required"),
  descEn: z.string().trim().optional().or(z.literal("")),
  descAr: z.string().trim().optional().or(z.literal("")),
  slug: slugSchema,
  imageUrl: z.string().trim().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  variants: z.array(variantInputSchema).min(1, "Add at least one pricing tier"),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;
