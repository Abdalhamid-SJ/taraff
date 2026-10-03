export interface VariantDto {
  id: string;
  labelEn: string;
  labelAr: string;
  priceAed: number;
  durationMinutes: number;
}

export interface ServiceDto {
  id: string;
  nameEn: string;
  nameAr: string;
  descEn: string | null;
  descAr: string | null;
  imageUrl: string | null;
  slug: string;
  variants: VariantDto[];
}

export interface CategoryDto {
  id: string;
  nameEn: string;
  nameAr: string;
  services: ServiceDto[];
}

export interface CartLine {
  variantId: string;
  // Number of people receiving this option (done back to back).
  quantity: number;
}

export type BookingStep = "account" | "services" | "datetime" | "details" | "confirm" | "success";
