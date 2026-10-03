import { redirect } from "@/i18n/navigation";

// The old phone-only "My bookings" lookup listed every booking for any number
// typed in. Bookings now live in the customer's password-protected account,
// so this address just forwards there (sign-in first if needed).
export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/account", locale });
}
