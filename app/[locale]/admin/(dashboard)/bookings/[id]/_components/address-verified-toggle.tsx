"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleAddressVerifiedAction } from "@/lib/actions/admin-bookings";
import { Button } from "@/components/ui/button";

export function AddressVerifiedToggle({
  bookingId,
  verified,
}: {
  bookingId: string;
  verified: boolean;
}) {
  const t = useTranslations("AdminBookings");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={verified ? "secondary" : "default"}
      disabled={pending}
      onClick={() => startTransition(() => toggleAddressVerifiedAction(bookingId, !verified))}
      className={
        verified
          ? "bg-sage/20 text-sage hover:bg-sage/30"
          : "bg-mulberry text-paper hover:opacity-90"
      }
    >
      {verified ? t("markUnverified") : t("markVerified")}
    </Button>
  );
}
