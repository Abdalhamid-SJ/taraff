"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { customerLoginAction } from "@/lib/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ locale, redirectTo }: { locale: string; redirectTo: string }) {
  const t = useTranslations("Account");
  const [state, formAction, pending] = useActionState(
    customerLoginAction.bind(null, locale, redirectTo),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          dir="ltr"
          autoComplete="username"
          required
          className="mt-1.5 min-h-11"
          placeholder={t("phonePlaceholder")}
        />
      </div>
      <div>
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 min-h-11"
        />
      </div>

      {state?.errorCode && (
        <p role="alert" className="text-sm text-destructive">
          {t("invalidCredentials")}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full bg-mulberry text-paper hover:opacity-90"
      >
        {pending ? t("signingIn") : t("signIn")}
      </Button>
    </form>
  );
}
