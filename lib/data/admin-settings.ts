import { prisma } from "@/lib/db";
import { DEFAULT_BUSINESS_HOURS } from "@/lib/settings";
import type { SettingsInput } from "@/lib/validation/admin-settings";

const DEFAULTS: SettingsInput = {
  travelBufferMinutes: 45,
  bookingLeadTimeHours: 3,
  maxAdvanceDays: 30,
  slotGranularityMinutes: 30,
  businessHours: DEFAULT_BUSINESS_HOURS,
  whatsappAdminNumbers: [],
  siteLogoUrl: "",
  siteContact: { phone: "", whatsapp: "", email: "" },
};

export async function getAllSettings(): Promise<SettingsInput> {
  const rows = await prisma.setting.findMany();
  const values = new Map(rows.map((r) => [r.key, JSON.parse(r.value)]));

  return {
    travelBufferMinutes: values.get("travelBufferMinutes") ?? DEFAULTS.travelBufferMinutes,
    bookingLeadTimeHours: values.get("bookingLeadTimeHours") ?? DEFAULTS.bookingLeadTimeHours,
    maxAdvanceDays: values.get("maxAdvanceDays") ?? DEFAULTS.maxAdvanceDays,
    slotGranularityMinutes:
      values.get("slotGranularityMinutes") ?? DEFAULTS.slotGranularityMinutes,
    businessHours: values.get("businessHours") ?? DEFAULTS.businessHours,
    whatsappAdminNumbers: values.get("whatsappAdminNumbers") ?? DEFAULTS.whatsappAdminNumbers,
    siteLogoUrl: values.get("siteLogoUrl") ?? DEFAULTS.siteLogoUrl,
    siteContact: values.get("siteContact") ?? DEFAULTS.siteContact,
  };
}
