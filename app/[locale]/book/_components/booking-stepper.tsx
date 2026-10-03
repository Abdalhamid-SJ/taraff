"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { BookingDetailsInput } from "@/lib/validation/booking";
import { todayBusinessDateStr } from "@/components/booking/dates";
import {
  cartTotals,
  parseCartParam,
  pruneCart,
  selectVariant,
  serializeCartParam,
  setQuantity,
} from "../_lib/cart";
import type { BookingStep, CartLine, CategoryDto, ServiceDto } from "../_lib/types";
import { AccountStep } from "./account-step";
import { ConfirmStep } from "./confirm-step";
import { DateTimeStep } from "./datetime-step";
import { DetailsStep } from "./details-step";
import { ServicesStep } from "./services-step";
import { StepIndicator } from "./step-indicator";
import { SuccessStep } from "./success-step";

type ProgressStep = Exclude<BookingStep, "success">;
const SIGNED_IN_STEPS: ProgressStep[] = ["services", "datetime", "details", "confirm"];
const GUEST_STEPS: ProgressStep[] = ["account", ...SIGNED_IN_STEPS];

const EMPTY_DETAILS: BookingDetailsInput = {
  customerName: "",
  customerPhone: "",
  areaText: "",
  addressText: "",
  addressNotes: "",
};

export function BookingStepper({
  categories,
  customer,
  maxAdvanceDays,
}: {
  categories: CategoryDto[];
  // Signed-in customer, if any — used to pre-fill name and phone.
  customer: { name: string; phone: string } | null;
  maxAdvanceDays: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();

  // The server only learns about a sign-in made on the account step after a
  // refresh, so remember it locally in the meantime. `sessionLost` covers a
  // session that expired mid-booking (the server said AUTH_REQUIRED).
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [sessionLost, setSessionLost] = useState(false);
  const signedIn = (!!customer || justSignedIn) && !sessionLost;
  const steps = signedIn ? SIGNED_IN_STEPS : GUEST_STEPS;

  const step =
    (searchParams.get("step") as BookingStep | null) ?? (signedIn ? "services" : "account");
  // `variants` is the parameter older service-page links used.
  const rawCartParam =
    searchParams.get("v") ??
    (searchParams.get("variants")
      ?.split(",")
      .map((id) => `${id}:1`)
      .join(",") ||
      null);
  const lines = useMemo(
    () => pruneCart(parseCartParam(rawCartParam), categories),
    [rawCartParam, categories],
  );
  const dateStr = searchParams.get("date") ?? todayBusinessDateStr();
  const slotIso = searchParams.get("slot");
  const successReference = searchParams.get("ref");

  // Not in the URL by design — see the PII-in-URL decision for this phase.
  const [details, setDetails] = useState<BookingDetailsInput>(() => ({
    ...EMPTY_DETAILS,
    customerName: customer?.name ?? "",
    customerPhone: customer?.phone ?? "",
  }));

  // After signing in on the account step, the refreshed page brings the
  // customer's saved name and phone: use them unless already typed.
  useEffect(() => {
    if (!customer) return;
    setDetails((d) => ({
      ...d,
      customerName: d.customerName || customer.name,
      customerPhone: d.customerPhone || customer.phone,
    }));
  }, [customer]);

  const setParams = useCallback(
    (
      updates: Record<string, string | null | undefined>,
      mode: "push" | "replace" = "replace",
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router[mode](href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const goToStep = useCallback(
    (next: BookingStep) => setParams({ step: next }, "push"),
    [setParams],
  );

  // Normalise the cart in the URL: migrate the old parameter and drop options
  // that are no longer on sale, so what's shown is exactly what gets booked.
  useEffect(() => {
    const canonical = serializeCartParam(lines);
    if (searchParams.has("variants") || (searchParams.get("v") ?? "") !== canonical) {
      setParams({ v: canonical || null, variants: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  // Guards against landing on a step without its prerequisites (e.g. after a
  // refresh, which intentionally does not restore name/phone/address).
  useEffect(() => {
    if (step === "success") {
      if (!successReference) setParams({ step: "services" }, "replace");
    } else if (!signedIn && step !== "account") {
      setParams({ step: "account" }, "replace");
    } else if (signedIn && step === "account") {
      setParams({ step: "services" }, "replace");
    } else if (step === "datetime" && lines.length === 0) {
      setParams({ step: "services" }, "replace");
    } else if (step === "details" && !slotIso) {
      setParams({ step: lines.length === 0 ? "services" : "datetime" }, "replace");
    } else if (
      step === "confirm" &&
      (!slotIso ||
        !details.customerName ||
        !details.customerPhone ||
        !details.areaText ||
        !details.addressText)
    ) {
      setParams({ step: !slotIso ? "datetime" : "details" }, "replace");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, signedIn]);

  // Each step starts at the top (navigation here doesn't scroll by itself).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [step, reduce]);

  // The URL updates asynchronously, so quick successive taps (e.g. "+" twice)
  // must build on the latest cart, not on the last rendered one.
  const latestLines = useRef(lines);
  useEffect(() => {
    latestLines.current = lines;
  }, [lines]);

  // Any change to the cart changes the appointment length, so a previously
  // chosen time may no longer fit: clear it.
  function updateCart(next: CartLine[]) {
    latestLines.current = next;
    setParams({ v: serializeCartParam(next) || null, slot: null });
  }

  const handleSelect = (service: ServiceDto, variantId: string) =>
    updateCart(selectVariant(latestLines.current, categories, service, variantId));
  const handleRemove = (variantId: string) =>
    updateCart(latestLines.current.filter((l) => l.variantId !== variantId));
  const handleQuantity = (variantId: string, delta: 1 | -1) => {
    const line = latestLines.current.find((l) => l.variantId === variantId);
    if (line) updateCart(setQuantity(latestLines.current, variantId, line.quantity + delta));
  };

  function handleSignedIn(info: { name: string; phone: string } | null) {
    setJustSignedIn(true);
    setSessionLost(false);
    if (info) {
      setDetails((d) => ({ ...d, customerName: info.name, customerPhone: info.phone }));
    }
    router.refresh();
    setParams({ step: "services" }, "replace");
  }

  const { totalMinutes } = cartTotals(lines, categories);

  if (step === "success" && successReference) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SuccessStep reference={successReference} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto mb-10 max-w-3xl">
        <StepIndicator current={step} steps={steps} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === "account" && !signedIn && <AccountStep onSignedIn={handleSignedIn} />}

          {step === "services" && signedIn && (
            <ServicesStep
              categories={categories}
              lines={lines}
              onSelect={handleSelect}
              onRemove={handleRemove}
              onQuantity={handleQuantity}
              onNext={() => goToStep("datetime")}
            />
          )}

          {step === "datetime" && signedIn && (
            <DateTimeStep
              lines={lines}
              totalMinutes={totalMinutes}
              dateStr={dateStr}
              slotIso={slotIso}
              maxAdvanceDays={maxAdvanceDays}
              onChangeDate={(d) => setParams({ date: d, slot: null })}
              onChangeSlot={(s) => setParams({ slot: s })}
              onBack={() => goToStep("services")}
              onNext={() => goToStep("details")}
            />
          )}

          {step === "details" && signedIn && (
            <DetailsStep
              values={details}
              onChange={setDetails}
              onBack={() => goToStep("datetime")}
              onNext={() => goToStep("confirm")}
            />
          )}

          {step === "confirm" && signedIn && slotIso && (
            <ConfirmStep
              categories={categories}
              lines={lines}
              slotIso={slotIso}
              details={details}
              onBack={() => goToStep("details")}
              onSlotTaken={() => {
                setParams({ slot: null, step: "datetime" }, "replace");
              }}
              onAuthRequired={() => {
                setSessionLost(true);
                setJustSignedIn(false);
                setParams({ step: "account" }, "replace");
              }}
              onSuccess={(reference) => {
                setParams({ step: "success", ref: reference }, "push");
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
