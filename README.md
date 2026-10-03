# Home Beauty Services — Booking Platform

Build spec for Claude Code. A bilingual (AR/EN) booking site for a **home-service beauty business**: beauticians travel to the customer. Customers book without creating an account; the admin runs everything from a dashboard.

---

## 1. Product summary

| | |
|---|---|
| **Model** | Home service — staff travel to the customer's address |
| **Customer booking** | Guest checkout, phone number only (no login, no OTP in v1) |
| **Payment** | Cash on arrival. No payment gateway in v1. |
| **Assignment** | System auto-suggests a beautician; admin can override |
| **Languages** | Arabic + English, full RTL/LTR |
| **Admin** | Full dashboard: bookings, services, staff, availability, coverage areas |
| **Beautician portal** | ❌ Not in v1 — architect for it, don't build it |
| **Notifications** | WhatsApp message to admin on every new booking |
| **Hosting** | Vercel + hosted Postgres (Neon or Supabase Postgres) |

---

## 2. Stack

- **Next.js 15**, App Router, TypeScript, Server Actions
- **Tailwind CSS v4** + shadcn/ui
- **Prisma** ORM → **PostgreSQL**
- **next-intl** for i18n and RTL
- **Auth.js (NextAuth)** — credentials provider, **admin users only**
- **Zod** for all input validation (shared client + server schemas)
- **date-fns** + `date-fns-tz`, everything stored UTC, displayed `Asia/Dubai`

**Do not** add Redux, a component library other than shadcn, or a payments SDK.

---

## 3. Data model

```prisma
// Core catalogue
model Category {
  id        String    @id @default(cuid())
  nameEn    String
  nameAr    String
  slug      String    @unique
  sortOrder Int       @default(0)
  isActive  Boolean   @default(true)
  services  Service[]
}

model Service {
  id           String           @id @default(cuid())
  categoryId   String
  category     Category         @relation(fields: [categoryId], references: [id])
  nameEn       String
  nameAr       String
  descEn       String?
  descAr       String?
  slug         String           @unique
  imageUrl     String?
  sortOrder    Int              @default(0)
  isActive     Boolean          @default(true)
  variants     ServiceVariant[]
}

// Tiered pricing: every service has 1+ variants (S / M / L, Short / Medium / Long hair, etc.)
model ServiceVariant {
  id              String  @id @default(cuid())
  serviceId       String
  service         Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  labelEn         String  // "Short hair"
  labelAr         String  // "شعر قصير"
  priceAed        Decimal @db.Decimal(10, 2)
  durationMinutes Int
  sortOrder       Int     @default(0)
  isActive        Boolean @default(true)
}

// Staff
model Beautician {
  id           String              @id @default(cuid())
  fullName     String
  phone        String
  photoUrl     String?
  isActive     Boolean             @default(true)
  skills       BeauticianService[] // which services she can perform
  areas        BeauticianArea[]    // where she works
  availability Availability[]      // weekly recurring hours
  timeOff      TimeOff[]           // one-off blocks
  bookings     Booking[]
}

model BeauticianService {
  beauticianId String
  serviceId    String
  @@id([beauticianId, serviceId])
}

// Geography — flat list, seeded, admin-editable
model Area {
  id       String @id @default(cuid())
  emirate  String // Dubai, Sharjah, Ajman, Abu Dhabi, UAQ, RAK, Fujairah
  nameEn   String
  nameAr   String
  isActive Boolean @default(true)
}

model BeauticianArea {
  beauticianId String
  areaId       String
  @@id([beauticianId, areaId])
}

model Availability {
  id           String @id @default(cuid())
  beauticianId String
  dayOfWeek    Int    // 0 = Sunday
  startMinute  Int    // minutes from midnight, e.g. 600 = 10:00
  endMinute    Int
}

model TimeOff {
  id           String   @id @default(cuid())
  beauticianId String
  startsAt     DateTime
  endsAt       DateTime
  reason       String?
}

// Bookings
model Booking {
  id             String        @id @default(cuid())
  reference      String        @unique // e.g. "BK-7F3K2Q" — shown to customer
  status         BookingStatus @default(PENDING)

  customerName   String
  customerPhone  String
  areaId         String
  addressText    String        // free text — building, flat, landmark
  addressNotes   String?
  addressVerified Boolean      @default(false) // admin ticks after calling

  scheduledStart DateTime
  scheduledEnd   DateTime      // start + total duration + travel buffer
  beauticianId   String?       // null until assigned
  assignedBy     AssignMode    @default(AUTO)

  items          BookingItem[]
  subtotalAed    Decimal       @db.Decimal(10, 2)
  totalAed       Decimal       @db.Decimal(10, 2)

  adminNotes     String?
  cancelReason   String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model BookingItem {
  id              String  @id @default(cuid())
  bookingId       String
  booking         Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  variantId       String
  // Snapshot at time of booking — never join to live prices for historical bookings
  serviceNameEn   String
  serviceNameAr   String
  variantLabelEn  String
  variantLabelAr  String
  priceAed        Decimal @db.Decimal(10, 2)
  durationMinutes Int
  quantity        Int     @default(1)
}

enum BookingStatus { PENDING CONFIRMED ON_THE_WAY COMPLETED CANCELLED NO_SHOW }
enum AssignMode    { AUTO ADMIN }

model AdminUser {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
  name         String
  role         String @default("ADMIN") // ADMIN | STAFF
}

model Setting {
  key   String @id
  value String // JSON
}
```

**Settings keys to seed:** `travelBufferMinutes` (default 45), `bookingLeadTimeHours` (default 3), `maxAdvanceDays` (default 30), `slotGranularityMinutes` (default 30), `businessHours`, `whatsappAdminNumbers`, `siteContact`.

---

## 4. Booking flow (customer)

Single-page stepper at `/[locale]/book`, state in URL search params so back/refresh survives.

1. **Choose services** — browse by category, pick a variant per service, add to cart. Cart shows running total (AED) and total duration.
2. **Choose area** — emirate → area. If no active beautician covers that area, say so immediately and offer WhatsApp contact instead of a dead end.
3. **Choose date & time** — calendar plus slot grid. Slots come from the availability engine (§5), computed server-side for the selected area + service set.
4. **Details** — name, phone (UAE format, `+971`), address free text, optional notes.
5. **Confirm** — summary, "Payment: cash on arrival" stated plainly, submit.
6. **Success** — booking reference, summary, "we'll call to confirm your address" line, and a WhatsApp link to the business.

Guests can re-open a booking at `/[locale]/booking/[reference]` by entering the phone number used. Read-only plus a cancel button (blocked inside the lead-time window — show the number to call instead).

**No account. No password. No OTP.** Phone is not verified in v1 — flag suspicious duplicates in the dashboard instead (same phone, 3+ pending bookings).

---

## 5. Availability & auto-assignment engine

This is the heart of the app. Put it in `lib/scheduling/` as pure, unit-tested functions with no DB calls inside — pass data in, get results out.

**Computing open slots** for a given date, area, and set of services:

1. Total job duration = sum of variant durations.
2. Candidate beauticians = active AND cover the area AND have every selected service in their skills.
3. For each candidate, build her free windows for that day: weekly `Availability` minus `TimeOff` minus existing bookings (each existing booking occupies `scheduledStart` → `scheduledEnd`, and `scheduledEnd` already includes the travel buffer).
4. Walk each free window in `slotGranularityMinutes` steps; a slot is open if `duration + travelBuffer` fits before the window closes.
5. Union the slots across candidates, dedupe, drop anything inside `bookingLeadTimeHours` from now or beyond `maxAdvanceDays`.

The customer never sees who is available — only *that* the time is available.

**Auto-assign on submit:** among candidates free at the chosen slot, pick by — fewest bookings that day, then earliest-ending previous job (minimises travel), then lowest total load that week. Tie-break deterministically by id so tests are stable. Record `assignedBy = AUTO`.

**Admin override:** reassignment in the dashboard sets `assignedBy = ADMIN` and re-validates the conflict check. Admin may force-assign despite a soft conflict, but must see an explicit warning naming the clash.

**Race conditions:** wrap booking creation in a transaction that re-checks the chosen beautician's conflicts before insert. If it fails, return a clean "that slot was just taken" error and refresh the slot grid — never silently double-book.

---

## 6. Admin dashboard

Routes under `/[locale]/admin`, protected by middleware.

- **Today** — landing view. Timeline of today's jobs grouped by beautician, unassigned jobs pinned at top in red, quick status buttons.
- **Bookings** — filter by status, date range, area, beautician. Detail view: change status, reassign, tick "address verified", edit scheduled time, add notes, cancel with reason. Every booking detail has a one-tap "WhatsApp customer" link.
- **Calendar** — week view, all beauticians in columns, drag-to-reassign is a nice-to-have, not required.
- **Services** — CRUD categories, services, and variants. Bilingual fields side by side in one form. Image upload via Vercel Blob.
- **Beauticians** — CRUD staff, assign skills (multi-select services), assign areas, set weekly availability, add time off.
- **Areas** — CRUD, seeded with the main UAE emirates and areas.
- **Settings** — the `Setting` keys above, plus admin WhatsApp numbers.
- **Users** — admin accounts, seeded with one from env on first run.

Dashboard is desktop-first but must be usable on a phone — the owner will run it from a phone more often than a laptop.

---

## 7. WhatsApp notifications

Fire on: booking created, booking cancelled by customer. Goes to the admin numbers in settings.

**Provider:** WhatsApp Cloud API (Meta) using a pre-approved template message. Put it behind an interface — `lib/notify/index.ts` exporting `sendAdminAlert(payload)` — with two implementations: `cloudApi` and `consoleLog`. Select via `NOTIFY_PROVIDER` env var.

⚠️ **Lead time warning:** Cloud API needs a Meta Business account, a verified business, a dedicated number, and template approval. That takes days to weeks. Build against the interface and ship with `consoleLog` + an email fallback (Resend) so the launch is never blocked on Meta. Swapping providers later must be a one-file change.

Notification failures **must not** fail the booking. Send after the transaction commits, catch errors, log them, surface a "notification failed" badge in the dashboard.

---

## 8. Bilingual & RTL

- Route structure `/[locale]/...` with `ar` and `en`. **Arabic is the default locale.**
- `next-intl` with message files `messages/ar.json`, `messages/en.json`. No hardcoded user-facing strings anywhere.
- `<html lang dir>` set per locale. Use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) — never `ml-`, `pr-`, `text-left`.
- Content fields are dual-column in the DB (`nameEn` / `nameAr`), not a translation table. A `useLocalized(entity, 'name')` helper picks the right one.
- Numbers, prices, and dates: Latin digits in both locales (Gulf convention for pricing), format via `Intl` with the right locale.
- Language switcher in the header preserves the current path and params.
- Test both directions on every screen. RTL is not a stylesheet flip — check icon direction, chevrons, the stepper, and the calendar.

---

## 9. Visual direction

Not a generic wellness template. The reference points are the UAE home-visit beauty market: private, premium, arriving at your door.

**Palette** — name these as CSS variables, don't hardcode:
- `--ink` `#1F1A24` — deep aubergine-black, primary text and dark surfaces
- `--mulberry` `#5B2B47` — brand primary, buttons and headers
- `--brass` `#B08843` — accent, used sparingly: active states, price emphasis, dividers
- `--blush` `#EBD9DC` — soft fills, selected chips, hover states
- `--paper` `#FBF8F6` — page background
- `--sage` `#4A6B5C` — success/confirmed status only

Avoid pink-on-white "salon default", and avoid cream + terracotta.

**Typography:**
- Body & UI, both languages: **IBM Plex Sans Arabic** — covers Arabic and Latin in one family, so the two locales feel like one brand.
- Display, Latin: **Fraunces** (high optical size, tight tracking) for headings.
- Display, Arabic: **Almarai Bold**.
- Set a real type scale. Headings are large and confident; body is 16px minimum.

**Signature element:** the time-slot grid. It's the moment the product proves itself — make it fast, tactile, and obviously live (slots visibly recompute when services or area change, with a subtle skeleton rather than a spinner). Everything else stays quiet.

**Quality floor, unannounced:** responsive to 360px, visible keyboard focus rings, `prefers-reduced-motion` respected, all interactive targets ≥44px.

---

## 10. Public pages

- `/` — hero, service categories, how it works (3 steps), coverage areas, testimonials placeholder, CTA to book.
- `/services` and `/services/[slug]` — category listing and service detail with variant pricing table.
- `/book` — the stepper.
- `/booking/[reference]` — guest lookup.
- `/about`, `/contact` — simple, with WhatsApp CTA.
- SEO: per-locale metadata, `hreflang` alternates, JSON-LD `LocalBusiness` + `Service`, sitemap, OG images.

---

## 11. Build order

**Phase 1 — Foundation**
Next.js + TS + Tailwind + shadcn scaffold. Prisma schema and migration. i18n routing with AR default and RTL working end to end. Seed script: areas, one category, three services with variants, two beauticians with availability, one admin user.

**Phase 2 — Scheduling engine**
`lib/scheduling/` pure functions with a full unit test suite before any UI. Cover: overlapping bookings, travel buffer at window edges, time off mid-window, no eligible beautician, DST-free but timezone-correct math, lead-time cutoff.

**Phase 3 — Public booking flow**
Home, services, the stepper, slot grid, submit with transaction, success page, guest lookup.

**Phase 4 — Admin dashboard**
Auth + middleware, Today view, bookings list and detail, services CRUD, beauticians CRUD, availability editor, settings.

**Phase 5 — Notifications & polish**
Notify interface with console + email, Cloud API implementation behind the env flag, error states, empty states, loading skeletons, SEO, full RTL pass.

**Phase 6 — Deploy**
Vercel, Neon Postgres, Vercel Blob for images, env documentation, migration on deploy, seed for production.

---

## 12. Environment

```
DATABASE_URL=
DIRECT_URL=                 # Prisma migrations against Neon
AUTH_SECRET=
AUTH_URL=
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_BUSINESS_WHATSAPP=   # click-to-chat number for customers
NOTIFY_PROVIDER=console          # console | cloudapi
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_TEMPLATE_NAME=
RESEND_API_KEY=
NOTIFY_EMAIL_TO=                 # who receives booking emails (falls back to ADMIN_SEED_EMAIL)
NOTIFY_EMAIL_FROM=               # sender on a Resend-verified domain, e.g. "Taraf Bookings <bookings@tarafsaloon.com>"
BLOB_READ_WRITE_TOKEN=
```

---

## 13. Conventions

- Server Components by default; `'use client'` only where interactivity demands it.
- Mutations via Server Actions, each guarded by a Zod schema; the same schema validates on the client.
- Money as `Decimal` in the DB and integer fils in any arithmetic — never float.
- All times UTC in the DB; convert at the edge with `Asia/Dubai`.
- Errors say what happened and what to do next, in the interface's voice. No apologies, no "something went wrong".
- Every user-facing string goes through `next-intl`. A hardcoded string is a bug.

## 13b. Changes since v1

- **Area is free text.** The area/emirate pick-list is gone from the booking flow; customers type their neighbourhood and city in the Details step (`Booking.areaText`). Beautician matching now uses **skills only** — the per-beautician coverage-area setting was removed from the admin form. `Area` / `BeauticianArea` tables and `Booking.areaId` are kept (nullable) so old data still resolves, and the home page "where we cover" list still reads `Area`.
- **Customer accounts (optional).** Phone + password (`Customer` model, `/account`, `/account/login`, `/account/register`). Signed-in customers get pre-filled details, and their bookings are attached to the account and listed (upcoming + history, with the same details/reschedule/cancel controls as `/orders`). Guest checkout still works, and an earlier guest booking can be added to an account from the account page with its reference + phone. There is **no password reset** yet — that needs SMS/OTP or email.
- **One session, two roles.** Staff and customers share the Auth.js JWT session, distinguished by `role` (`ADMIN`/`STAFF` vs `CUSTOMER`, see `lib/auth-roles.ts`). Every admin gate (middleware, admin layout, `requireAdminSession`, the blob-upload route) checks the role, not just "is signed in".
- **Site logo.** Admin → Settings → Branding uploads a logo (stored as the `siteLogoUrl` setting). It shows next to the site name in the public and admin headers and is the browser-tab icon (`app/favicon.ico` was removed so it can't override it; `public/default-icon.svg` is the fallback).
- **Currency symbol.** Prices render the Saudi Riyal sign via `components/currency-symbol.tsx` (`<Price amount={…} />`) instead of the "SAR"/"ريال" text. Plain-text staff alerts and JSON-LD keep the ISO code "SAR". Database/field names (`priceAed`, `totalAed`) are unchanged.
- **Deploy:** run `prisma migrate deploy` — new migration `20260920120000_free_text_area_and_customers`.

## 14. Explicitly out of scope for v1

Online payment, beautician login/portal, OTP, loyalty points, ratings and reviews, coupon codes, map pins or geocoding, multi-tenancy, native app.

Design the schema so beautician portal and customer accounts drop in later without a migration rewrite — but **do not build them**.
