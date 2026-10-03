"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { linkBookingToAccountAction } from "@/lib/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Pulls an earlier guest booking into this account. Needs the reference *and*
// the phone used — the same proof the guest lookup asks for.
export function LinkBookingForm({ defaultPhone }: { defaultPhone: string }) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState(defaultPhone);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    try {
      const result = await linkBookingToAccountAction({ reference, phone });
      if (result.ok) {
        setStatus("success");
        setReference("");
        router.refresh();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-12 rounded-lg border border-border p-4">
      <h2 className="font-medium text-ink">{t("linkHeading")}</h2>
      <p className="mt-1 text-sm text-ink/60">{t("linkHint")}</p>

      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="link-reference">{t("linkReference")}</Label>
          <Input
            id="link-reference"
            dir="ltr"
            required
            className="mt-1.5 min-h-11"
            placeholder="BK-XXXXXX"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="link-phone">{t("linkPhone")}</Label>
          <Input
            id="link-phone"
            type="tel"
            dir="ltr"
            required
            className="mt-1.5 min-h-11"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          {status === "error" && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {t("linkError")}
            </p>
          )}
          {status === "success" && <p className="mb-3 text-sm text-sage">{t("linkSuccess")}</p>}
          <Button
            type="submit"
            variant="outline"
            disabled={pending || !reference}
            className="min-h-11"
          >
            {pending ? t("linkSaving") : t("linkSubmit")}
          </Button>
        </div>
      </form>
    </section>
  );
}
