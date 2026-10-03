"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { registerCustomerAction } from "@/lib/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ locale, redirectTo }: { locale: string; redirectTo: string }) {
  const t = useTranslations("Account");
  const [state, formAction, pending] = useActionState(
    registerCustomerAction.bind(null, locale, redirectTo),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          className="mt-1.5 min-h-11"
          placeholder={t("namePlaceholder")}
        />
      </div>
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
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          className="mt-1.5 min-h-11"
        />
        <p className="mt-1 text-xs text-ink/50">{t("passwordHint")}</p>
      </div>

      {state?.errorCode === "phone_taken" && (
        <p role="alert" className="text-sm text-destructive">
          {t("phoneTaken")}
        </p>
      )}
      {state?.errorCode === "invalid_input" && (
        <p role="alert" className="text-sm text-destructive">
          {t("invalidInput")}
        </p>
      )}
      {state?.errorCode === "invalid_credentials" && (
        <p role="alert" className="text-sm text-destructive">
          {t("invalidCredentials")}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full bg-mulberry text-paper hover:opacity-90"
      >
        {pending ? t("registering") : t("register")}
      </Button>
    </form>
  );
}
