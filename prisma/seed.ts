import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Starter set of Saudi Arabia areas — not exhaustive, admin can add more via
// CRUD (§6). The object key stays `emirate` to match the Prisma column name
// (kept as-is rather than renamed — see the Saudi-market rebrand notes).
const AREAS: { emirate: string; nameEn: string; nameAr: string }[] = [
  { emirate: "Riyadh", nameEn: "Al Olaya", nameAr: "العليا" },
  { emirate: "Riyadh", nameEn: "Al Malaz", nameAr: "الملز" },
  { emirate: "Riyadh", nameEn: "Al Naseem", nameAr: "النسيم" },
  { emirate: "Riyadh", nameEn: "King Fahd District", nameAr: "حي الملك فهد" },
  { emirate: "Riyadh", nameEn: "Al Sulimaniyah", nameAr: "السليمانية" },
  { emirate: "Riyadh", nameEn: "Al Muruj", nameAr: "المروج" },
  { emirate: "Riyadh", nameEn: "Diriyah", nameAr: "الدرعية" },
  { emirate: "Riyadh", nameEn: "Al Yasmin", nameAr: "الياسمين" },
  { emirate: "Makkah", nameEn: "Al Rawdah", nameAr: "الروضة" },
  { emirate: "Makkah", nameEn: "Al Salamah", nameAr: "السلامة" },
  { emirate: "Makkah", nameEn: "Al Zahra", nameAr: "الزهراء" },
  { emirate: "Makkah", nameEn: "Al Hamra", nameAr: "الحمراء" },
  { emirate: "Eastern Province", nameEn: "Al Faisaliyah", nameAr: "الفيصلية" },
  { emirate: "Eastern Province", nameEn: "Al Shatea", nameAr: "الشاطئ" },
  { emirate: "Eastern Province", nameEn: "Al Rakah", nameAr: "الراكة" },
  { emirate: "Madinah", nameEn: "Quba", nameAr: "قباء" },
  { emirate: "Madinah", nameEn: "Al Aqiq", nameAr: "العقيق" },
  { emirate: "Asir", nameEn: "Al Sad", nameAr: "السد" },
  { emirate: "Qassim", nameEn: "Al Rabwa", nameAr: "الربوة" },
  { emirate: "Tabuk", nameEn: "Tabuk City Center", nameAr: "وسط مدينة تبوك" },
];

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env before seeding.",
    );
  }

  // Reset order respects FK dependencies. No bookings are seeded in Phase 1,
  // so this is safe against a fresh dev DB; re-running against a DB with
  // real bookings will fail loudly (FK restrict) rather than silently wipe them.
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.beauticianService.deleteMany();
  await prisma.beauticianArea.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.timeOff.deleteMany();
  await prisma.beautician.deleteMany();
  await prisma.serviceVariant.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.area.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.setting.deleteMany();

  const areas = await Promise.all(
    AREAS.map((area) => prisma.area.create({ data: area })),
  );
  const areaByName = (nameEn: string) => {
    const area = areas.find((a) => a.nameEn === nameEn);
    if (!area) throw new Error(`Seed area not found: ${nameEn}`);
    return area;
  };

  const category = await prisma.category.create({
    data: {
      nameEn: "Hair",
      nameAr: "الشعر",
      slug: "hair",
      sortOrder: 0,
    },
  });

  const haircut = await prisma.service.create({
    data: {
      categoryId: category.id,
      nameEn: "Haircut & Blow Dry",
      nameAr: "قص وتصفيف الشعر",
      slug: "haircut-blow-dry",
      sortOrder: 0,
      variants: {
        create: [
          { labelEn: "Short hair", labelAr: "شعر قصير", priceAed: 120, durationMinutes: 45, sortOrder: 0 },
          { labelEn: "Medium hair", labelAr: "شعر متوسط", priceAed: 150, durationMinutes: 60, sortOrder: 1 },
          { labelEn: "Long hair", labelAr: "شعر طويل", priceAed: 180, durationMinutes: 75, sortOrder: 2 },
        ],
      },
    },
  });

  const color = await prisma.service.create({
    data: {
      categoryId: category.id,
      nameEn: "Hair Color",
      nameAr: "صبغ الشعر",
      slug: "hair-color",
      sortOrder: 1,
      variants: {
        create: [
          { labelEn: "Short hair", labelAr: "شعر قصير", priceAed: 250, durationMinutes: 90, sortOrder: 0 },
          { labelEn: "Medium hair", labelAr: "شعر متوسط", priceAed: 320, durationMinutes: 120, sortOrder: 1 },
          { labelEn: "Long hair", labelAr: "شعر طويل", priceAed: 400, durationMinutes: 150, sortOrder: 2 },
        ],
      },
    },
  });

  const keratin = await prisma.service.create({
    data: {
      categoryId: category.id,
      nameEn: "Keratin Treatment",
      nameAr: "علاج الكيراتين",
      slug: "keratin-treatment",
      sortOrder: 2,
      variants: {
        create: [
          { labelEn: "Short hair", labelAr: "شعر قصير", priceAed: 350, durationMinutes: 120, sortOrder: 0 },
          { labelEn: "Medium hair", labelAr: "شعر متوسط", priceAed: 450, durationMinutes: 150, sortOrder: 1 },
          { labelEn: "Long hair", labelAr: "شعر طويل", priceAed: 550, durationMinutes: 180, sortOrder: 2 },
        ],
      },
    },
  });

  const layla = await prisma.beautician.create({
    data: {
      fullName: "Layla Ahmed",
      phone: "+966501234567",
      isActive: true,
      skills: {
        create: [
          { serviceId: haircut.id },
          { serviceId: color.id },
          { serviceId: keratin.id },
        ],
      },
      areas: {
        create: [
          { areaId: areaByName("Al Olaya").id },
          { areaId: areaByName("Al Malaz").id },
          { areaId: areaByName("Al Naseem").id },
          { areaId: areaByName("King Fahd District").id },
        ],
      },
      availability: {
        // Sunday (0) – Thursday (4), 10:00–20:00
        create: [0, 1, 2, 3, 4].map((dayOfWeek) => ({
          dayOfWeek,
          startMinute: 10 * 60,
          endMinute: 20 * 60,
        })),
      },
    },
  });

  const fatima = await prisma.beautician.create({
    data: {
      fullName: "Fatima Al Suwaidi",
      phone: "+966509876543",
      isActive: true,
      skills: {
        create: [{ serviceId: haircut.id }, { serviceId: color.id }],
      },
      areas: {
        create: [
          { areaId: areaByName("Al Rawdah").id },
          { areaId: areaByName("Al Salamah").id },
          { areaId: areaByName("Al Zahra").id },
          { areaId: areaByName("Al Hamra").id },
          { areaId: areaByName("Al Faisaliyah").id },
        ],
      },
      availability: {
        // Tuesday (2) – Saturday (6), 09:00–18:00
        create: [2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          startMinute: 9 * 60,
          endMinute: 18 * 60,
        })),
      },
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.create({
    data: {
      email: adminEmail,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // §3 settings keys — needed once the scheduling engine reads from the DB (Phase 3+).
  const settings: { key: string; value: unknown }[] = [
    { key: "travelBufferMinutes", value: 45 },
    { key: "bookingLeadTimeHours", value: 3 },
    { key: "maxAdvanceDays", value: 30 },
    { key: "slotGranularityMinutes", value: 30 },
    {
      key: "businessHours",
      // General booking window, independent of any one beautician's schedule.
      value: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        startMinute: 9 * 60,
        endMinute: 21 * 60,
      })),
    },
    { key: "whatsappAdminNumbers", value: [] },
    { key: "siteContact", value: { phone: "", whatsapp: "", email: "" } },
  ];
  await prisma.setting.createMany({
    data: settings.map((s) => ({ key: s.key, value: JSON.stringify(s.value) })),
  });

  console.log("Seed complete:", {
    areas: areas.length,
    category: category.slug,
    services: [haircut.slug, color.slug, keratin.slug],
    beauticians: [layla.fullName, fatima.fullName],
    admin: adminEmail,
    settings: settings.map((s) => s.key),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
