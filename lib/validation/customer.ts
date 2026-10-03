import { z } from "zod";
import { saudiPhoneSchema } from "./booking";

// bcrypt only hashes the first 72 bytes — cap the length so a longer password
// can't silently be truncated.
export const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);

export const customerRegisterSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: saudiPhoneSchema,
  password: passwordSchema,
});

export const customerLoginSchema = z.object({
  phone: saudiPhoneSchema,
  password: z.string().min(1).max(72),
});

// Attach an earlier guest booking to the signed-in account. Same proof of
// ownership as the guest lookup: you need both the reference and the phone.
export const linkBookingSchema = z.object({
  reference: z.string().trim().min(1),
  phone: saudiPhoneSchema,
});

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
