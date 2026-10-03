import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { isCustomerRole } from "@/lib/auth-roles";
import { getActiveCategoriesWithServices } from "@/lib/data/catalog";
import { prisma } from "@/lib/db";
import { localeAlternates } from "@/lib/seo";
import { getSchedulingSettings } from "@/lib/settings";
import { BookingStepper } from "./_components/booking-stepper";
import type { CategoryDto } from "./_lib/types";

// Rendered per request (it reads the session to pre-fill a signed-in customer's
// details), so the catalog shown here is always current. The booking
// transaction still re-reads prices/availability live in the Server Actions.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Book" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates("/book", locale),
  };
}

export default async function BookPage() {
  const [categories, session, settings] = await Promise.all([
    getActiveCategoriesWithServices(),
    auth(),
    getSchedulingSettings(),
  ]);

  // Pre-fill name/phone for a signed-in customer. Looked up fresh rather than
  // trusting the session's copy of the name.
  const customerRow =
    session?.user && isCustomerRole(session.user.role)
      ? await prisma.customer.findUnique({
          where: { id: session.user.id },
          select: { name: true, phone: true },
        })
      : null;

  // Services without a bookable option, and categories left empty by that,
  // would only be dead ends in the picker.
  const categoryDtos: CategoryDto[] = categories
    .map((c) => ({
      id: c.id,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      services: c.services
        .filter((s) => s.variants.length > 0)
        .map((s) => ({
          id: s.id,
          nameEn: s.nameEn,
          nameAr: s.nameAr,
          descEn: s.descEn,
          descAr: s.descAr,
          imageUrl: s.imageUrl,
          slug: s.slug,
          variants: s.variants.map((v) => ({
            id: v.id,
            labelEn: v.labelEn,
            labelAr: v.labelAr,
            priceAed: Number(v.priceAed),
            durationMinutes: v.durationMinutes,
          })),
        })),
    }))
    .filter((c) => c.services.length > 0);

  return (
    <BookingStepper
      categories={categoryDtos}
      customer={customerRow}
      maxAdvanceDays={settings.maxAdvanceDays}
    />
  );
}
