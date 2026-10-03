import { getTranslations } from "next-intl/server";
import { getAllServicesForSelect } from "@/lib/data/admin-beauticians";
import { BeauticianForm } from "../_components/beautician-form";

const DEFAULT_DAY = { enabled: false, startMinute: 9 * 60, endMinute: 18 * 60 };

export default async function NewBeauticianPage() {
  const t = await getTranslations("AdminBeauticians");
  const services = await getAllServicesForSelect();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{t("addBeautician")}</h1>
      <div className="mt-6">
        <BeauticianForm
          services={services}
          initial={{
            fullName: "",
            phone: "",
            photoUrl: "",
            isActive: true,
            serviceIds: [],
            availability: Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY })),
            timeOff: [],
          }}
        />
      </div>
    </div>
  );
}
