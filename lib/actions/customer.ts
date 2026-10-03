"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import {
  customerLoginSchema,
  customerRegisterSchema,
  linkBookingSchema,
} from "@/lib/validation/customer";
import { requireCustomerSession } from "./require-admin";

export type CustomerFormState = {
  errorCode?: "invalid_input" | "invalid_credentials" | "phone_taken";
};

// Only ever send customers back to a page on this site for their own locale.
function safeRedirect(redirectTo: string, locale: string): string {
  return redirectTo.startsWith(`/${locale}/`) && !redirectTo.startsWith("//")
    ? redirectTo
    : `/${locale}/account`;
}

export async function registerCustomerAction(
  locale: string,
  redirectTo: string,
  _prev: CustomerFormState | undefined,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = customerRegisterSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { errorCode: "invalid_input" };
  const { name, phone, password } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { phone }, select: { id: true } });
  if (existing) return { errorCode: "phone_taken" };

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.customer.create({ data: { name, phone, passwordHash } });
  } catch {
    // Lost a race with a concurrent sign-up for the same number.
    return { errorCode: "phone_taken" };
  }

  try {
    await signIn("customer", { phone, password, redirectTo: safeRedirect(redirectTo, locale) });
  } catch (error) {
    if (error instanceof AuthError) return { errorCode: "invalid_credentials" };
    throw error; // the redirect itself is thrown as an error — let it through
  }
  return {};
}

export async function customerLoginAction(
  locale: string,
  redirectTo: string,
  _prev: CustomerFormState | undefined,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = customerLoginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { errorCode: "invalid_credentials" };

  try {
    await signIn("customer", {
      phone: parsed.data.phone,
      password: parsed.data.password,
      redirectTo: safeRedirect(redirectTo, locale),
    });
  } catch (error) {
    if (error instanceof AuthError) return { errorCode: "invalid_credentials" };
    throw error;
  }
  return {};
}

export type LinkBookingResult = { ok: true } | { ok: false; error: "INVALID_INPUT" | "NOT_FOUND" };

// Lets a customer pull an earlier guest booking into their account history.
export async function linkBookingToAccountAction(raw: unknown): Promise<LinkBookingResult> {
  const session = await requireCustomerSession();
  const parsed = linkBookingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const reference = parsed.data.reference.toUpperCase();
  const booking = await prisma.booking.findUnique({ where: { reference } });
  if (
    !booking ||
    booking.customerPhone !== parsed.data.phone ||
    // Already belongs to a different account — treat as not found.
    (booking.customerId && booking.customerId !== session.user.id)
  ) {
    return { ok: false, error: "NOT_FOUND" };
  }

  await prisma.booking.update({ where: { id: booking.id }, data: { customerId: session.user.id } });
  revalidatePath("/[locale]/account", "page");
  return { ok: true };
}

// ── Inline sign-up / sign-in for the booking flow ───────────────────────────
// Same checks as the forms above, but they return a result instead of
// redirecting, so the booking carries on from where the customer was.

export type BookingAuthResult =
  | { ok: true }
  | { ok: false; error: "INVALID_INPUT" | "PHONE_TAKEN" | "INVALID_CREDENTIALS" };

export async function registerForBookingAction(raw: unknown): Promise<BookingAuthResult> {
  const parsed = customerRegisterSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const { name, phone, password } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { phone }, select: { id: true } });
  if (existing) return { ok: false, error: "PHONE_TAKEN" };

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.customer.create({ data: { name, phone, passwordHash } });
  } catch {
    // Lost a race with a concurrent sign-up for the same number.
    return { ok: false, error: "PHONE_TAKEN" };
  }

  try {
    await signIn("customer", { phone, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "INVALID_CREDENTIALS" };
    throw error;
  }
  return { ok: true };
}

export async function signInForBookingAction(raw: unknown): Promise<BookingAuthResult> {
  const parsed = customerLoginSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_CREDENTIALS" };

  try {
    await signIn("customer", {
      phone: parsed.data.phone,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "INVALID_CREDENTIALS" };
    throw error;
  }
  return { ok: true };
}
