"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">{t("errorTitle")}</h1>
      <p className="mt-2 text-ink/70">{t("errorBody")}</p>
      <Button
        type="button"
        onClick={reset}
        className="mt-8 min-h-11 bg-mulberry text-paper hover:opacity-90"
      >
        {t("errorRetry")}
      </Button>
    </main>
  );
}
