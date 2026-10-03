"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import type { BookingStep } from "../_lib/types";

type ProgressStep = Exclude<BookingStep, "success">;

const LABEL_KEYS: Record<ProgressStep, string> = {
  account: "stepAccount",
  services: "stepServices",
  datetime: "stepDateTime",
  details: "stepDetails",
  confirm: "stepConfirm",
};

export function StepIndicator({ current, steps }: { current: BookingStep; steps: ProgressStep[] }) {
  const t = useTranslations("Book");
  const reduce = useReducedMotion();
  if (current === "success") return null;
  const currentIndex = steps.indexOf(current);

  return (
    <ol
      className="grid gap-2 text-sm"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      aria-label={t("stepsNav")}
    >
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step} aria-current={isCurrent ? "step" : undefined} className="min-w-0">
            {/* Segment fills as the customer reaches each step. */}
            <div className="h-1.5 overflow-hidden rounded-full bg-blush">
              <motion.div
                className="h-full origin-left rounded-full bg-mulberry rtl:origin-right"
                initial={false}
                animate={{ scaleX: isDone || isCurrent ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span
              className={`mt-2.5 flex items-center gap-1.5 truncate ${
                isCurrent ? "font-medium text-ink" : isDone ? "text-mulberry" : "text-ink/55"
              }`}
            >
              {isDone && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
              <span className="truncate">{t(LABEL_KEYS[step])}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
