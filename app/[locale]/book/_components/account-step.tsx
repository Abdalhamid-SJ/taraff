"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { registerForBookingAction, signInForBookingAction } from "@/lib/actions/customer";
import { customerRegisterSchema } from "@/lib/validation/customer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "register" | "signin";
type FieldErrors = Partial<Record<"name" | "phone" | "password", boolean>>;

// First step for visitors who aren't signed in. Every booking belongs to an
// account, which is how the customer later finds, changes or cancels it with
// just their phone number and password.
export function AccountStep({
  onSignedIn,
}: {
  onSignedIn: (customer: { name: string; phone: string } | null) => void;
}) {
  const t = useTranslations("Book");
  const reduce = useReducedMotion();
  const pillId = useId();
  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<"phoneTaken" | "invalidCredentials" | "generic" | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (mode === "register") {
      const parsed = customerRegisterSchema.safeParse({ name, phone, password });
      if (!parsed.success) {
        const next: FieldErrors = {};
        for (const issue of parsed.error.issues) next[issue.path[0] as keyof FieldErrors] = true;
        setErrors(next);
        return;
      }
    } else if (!phone.trim() || !password) {
      setErrors({ phone: !phone.trim(), password: !password });
      return;
    }
    setErrors({});

    setPending(true);
    try {
      const result =
        mode === "register"
          ? await registerForBookingAction({ name, phone, password })
          : await signInForBookingAction({ phone, password });
      if (result.ok) {
        // Name is only known here for a new account; a returning customer's
        // details arrive with the refreshed page.
        onSignedIn(mode === "register" ? { name: name.trim(), phone } : null);
        return;
      }
      if (result.error === "PHONE_TAKEN") setFormError("phoneTaken");
      else if (result.error === "INVALID_CREDENTIALS") setFormError("invalidCredentials");
      else setFormError("generic");
    } catch {
      setFormError("generic");
    } finally {
      setPending(false);
    }
  }

  const tabs: { mode: Mode; label: string }[] = [
    { mode: "register", label: t("accountTabNew") },
    { mode: "signin", label: t("accountTabExisting") },
  ];

  return (
    <div className="mx-auto max-w-md">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {mode === "register" ? t("accountHeading") : t("accountSignInHeading")}
      </h2>
      <p className="mt-2 text-ink/70">
        {mode === "register" ? t("accountSubheading") : t("accountSignInSubheading")}
      </p>

      <div role="tablist" className="mt-8 grid grid-cols-2 rounded-full bg-blush/70 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            aria-selected={mode === tab.mode}
            onClick={() => switchMode(tab.mode)}
            className={`relative min-h-11 rounded-full text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
              mode === tab.mode ? "text-ink" : "text-ink/60 hover:text-ink"
            }`}
          >
            {mode === tab.mode && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-full bg-white shadow-[var(--shadow-soft)]"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {mode === "register" && (
          <div>
            <Label htmlFor="account-name">{t("nameLabel")}</Label>
            <Input
              id="account-name"
              autoComplete="name"
              className="mt-1.5 min-h-12 rounded-xl"
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "account-name-error" : undefined}
            />
            {errors.name && (
              <p id="account-name-error" className="mt-1.5 text-sm text-destructive">
                {t("nameError")}
              </p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="account-phone">{t("phoneLabel")}</Label>
          <Input
            id="account-phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            className="mt-1.5 min-h-12 rounded-xl text-start"
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={!!errors.phone}
            aria-describedby="account-phone-hint"
          />
          <p id="account-phone-hint" className={`mt-1.5 text-sm ${errors.phone ? "text-destructive" : "text-ink/55"}`}>
            {errors.phone ? t("phoneError") : t("phoneHint")}
          </p>
        </div>

        <div>
          <Label htmlFor="account-password">{t("passwordLabel")}</Label>
          <div className="relative mt-1.5">
            <Input
              id="account-password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              className="min-h-12 rounded-xl pe-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={mode === "register" ? "account-password-hint" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              aria-pressed={showPassword}
              className="absolute inset-y-0 end-0 flex w-12 items-center justify-center rounded-e-xl text-ink/55 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
            >
              {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
            </button>
          </div>
          {mode === "register" && (
            <p
              id="account-password-hint"
              className={`mt-1.5 text-sm ${errors.password ? "text-destructive" : "text-ink/55"}`}
            >
              {errors.password ? t("passwordError") : t("passwordHint")}
            </p>
          )}
        </div>

        {formError && (
          <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError === "phoneTaken"
              ? t("accountPhoneTaken")
              : formError === "invalidCredentials"
                ? t("accountInvalidCredentials")
                : t("errorGeneric")}
            {formError === "phoneTaken" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="ms-1 font-medium underline underline-offset-2"
              >
                {t("accountUseSignIn")}
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-mulberry px-6 text-base font-medium text-paper shadow-[var(--shadow-lift)] transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          {mode === "register"
            ? pending
              ? t("accountCreating")
              : t("accountCreate")
            : pending
              ? t("accountSigningIn")
              : t("accountSignIn")}
        </button>
      </form>
    </div>
  );
}
