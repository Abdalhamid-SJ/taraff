import { z } from "zod";
import { normalizeSaudiPhone, SAUDI_PHONE_REGEX } from "../phone";

export { SAUDI_PHONE_REGEX };

const PHONE_MESSAGE = "Enter a valid Saudi phone number, e.g. 0501234567";

// Accepts the usual ways a Saudi number is typed and outputs +966XXXXXXXXX.
export const saudiPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeSaudiPhone)
  .pipe(z.string().regex(SAUDI_PHONE_REGEX, PHONE_MESSAGE));

export const MAX_QUANTITY = 5;
export const MAX_CART_LINES = 10;

export const bookingItemInputSchema = z.object({
  variantId: z.string().min(1),
  // Number of people receiving this option, done back to back.
  quantity: z.number().int().min(1).max(MAX_QUANTITY).default(1),
});

const bookingItemsSchema = z
  .array(bookingItemInputSchema)
  .min(1, "Select at least one service")
  .max(MAX_CART_LINES)
  .refine(
    (items) => new Set(items.map((i) => i.variantId)).size === items.length,
    "Each option can only be added once",
  );

// Shared between the Details step's client-side form and the server action
// (§13: "the same schema validates on the client").
export const bookingDetailsSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your name").max(100),
  customerPhone: saudiPhoneSchema,
  // Typed in by the customer (no pick-list): neighbourhood / district / city.
  areaText: z.string().trim().min(2, "Enter your area").max(100),
  addressText: z.string().trim().min(5, "Enter your address").max(500),
  addressNotes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type BookingDetailsInput = z.input<typeof bookingDetailsSchema>;

export const bookingSubmitSchema = bookingDetailsSchema.extend({
  items: bookingItemsSchema,
  slotStartIso: z.string().min(1, "Select a time slot"),
});

export type BookingSubmitInput = z.input<typeof bookingSubmitSchema>;

export const openSlotsQuerySchema = z.object({
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  items: bookingItemsSchema,
});

export const bookingLookupSchema = z.object({
  reference: z.string().trim().min(1, "Enter your booking reference"),
  phone: saudiPhoneSchema,
});

export type BookingLookupInput = z.input<typeof bookingLookupSchema>;

export const bookingCancelSchema = z.object({
  reference: z.string().trim().min(1),
  phone: saudiPhoneSchema,
  reason: z.string().trim().max(500).optional(),
});

export type BookingCancelInput = z.input<typeof bookingCancelSchema>;

export const orderRescheduleSchema = z.object({
  reference: z.string().trim().min(1),
  phone: saudiPhoneSchema,
  newStartIso: z.string().min(1),
});

export type OrderRescheduleInput = z.input<typeof orderRescheduleSchema>;

export const rescheduleSlotsQuerySchema = z.object({
  reference: z.string().trim().min(1),
  phone: saudiPhoneSchema,
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export const orderDetailsUpdateSchema = z.object({
  reference: z.string().trim().min(1),
  phone: saudiPhoneSchema,
  addressText: z.string().trim().min(5, "Enter your address").max(500),
  addressNotes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type OrderDetailsUpdateInput = z.input<typeof orderDetailsUpdateSchema>;
