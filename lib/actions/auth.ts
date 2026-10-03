"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function loginAction(
  redirectTo: string,
  _prevState: { errorCode?: "invalid_credentials" } | undefined,
  formData: FormData,
): Promise<{ errorCode?: "invalid_credentials" }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { errorCode: "invalid_credentials" };
    }
    throw error;
  }
  return {};
}

export async function logoutAction(redirectTo: string) {
  await signOut({ redirectTo });
}
