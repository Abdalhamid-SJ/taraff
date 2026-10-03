import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAllServicesForSelect, getBeauticianById } from "@/lib/data/admin-beauticians";
import { toBusinessInputValue } from "@/lib/business-datetime-input";
import { BeauticianForm } from "../../_components/beautician-form";

const DEFAULT_DAY = { enabled: false, startMinute: 9 * 60, endMinute: 18 * 60 };

export default async function EditBeauticianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("AdminBeauticians");

  const [beautician, services] = await Promise.all([
    getBeauticianById(id),
    getAllServicesForSelect(),
  ]);
  if (!beautician) notFound();

  const availability = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const rule = beautician.availability.find((a) => a.dayOfWeek === dayOfWeek);
    return rule
      ? { enabled: true, startMinute: rule.startMinute, endMinute: rule.endMinute }
      : { ...DEFAULT_DAY };
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{t("editBeautician")}</h1>
      <div className="mt-6">
        <BeauticianForm
          services={services}
          initial={{
            id: beautician.id,
            fullName: beautician.fullName,
            phone: beautician.phone,
            photoUrl: beautician.photoUrl ?? "",
            isActive: beautician.isActive,
            serviceIds: beautician.skills.map((s) => s.serviceId),
            availability,
            timeOff: beautician.timeOff.map((t) => ({
              id: t.id,
              startsAt: toBusinessInputValue(t.startsAt),
              endsAt: toBusinessInputValue(t.endsAt),
              reason: t.reason ?? "",
            })),
          }}
        />
      </div>
    </div>
  );
}
