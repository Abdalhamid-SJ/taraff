-- Customers type their area in freehand instead of picking from the Area list,
-- and can optionally have an account (booking history / profile).

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- AlterTable: free-text area + optional customer link; areaId becomes optional
ALTER TABLE "Booking" ADD COLUMN "areaText" TEXT NOT NULL DEFAULT '',
ADD COLUMN "customerId" TEXT,
ALTER COLUMN "areaId" DROP NOT NULL;

-- Prisma's default for an optional relation is ON DELETE SET NULL (it was RESTRICT
-- while areaId was required) — re-create the constraint so the DB matches the schema.
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_areaId_fkey";
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing bookings keep showing the area they were booked with
UPDATE "Booking" b
SET "areaText" = a."nameEn"
FROM "Area" a
WHERE b."areaId" = a."id" AND b."areaText" = '';

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
