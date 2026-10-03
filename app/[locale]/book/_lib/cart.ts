import { fromHalalas, totalsForLines } from "@/lib/pricing";
import { MAX_CART_LINES, MAX_QUANTITY } from "@/lib/validation/booking";
import type { CartLine, CategoryDto, ServiceDto, VariantDto } from "./types";

export function parseCartParam(v: string | null): CartLine[] {
  if (!v) return [];
  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (const chunk of v.split(",")) {
    const [id, qty] = chunk.split(":");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    lines.push({
      variantId: id,
      quantity: Math.max(1, Math.min(MAX_QUANTITY, Math.floor(Number(qty)) || 1)),
    });
  }
  return lines.slice(0, MAX_CART_LINES);
}

export function serializeCartParam(lines: CartLine[]): string {
  return lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
}

export function findVariantWithService(
  categories: CategoryDto[],
  variantId: string,
): { service: ServiceDto; variant: VariantDto } | undefined {
  for (const category of categories) {
    for (const service of category.services) {
      const variant = service.variants.find((v) => v.id === variantId);
      if (variant) return { service, variant };
    }
  }
  return undefined;
}

// Drops lines whose option is no longer on sale (stale link, admin change).
export function pruneCart(lines: CartLine[], categories: CategoryDto[]): CartLine[] {
  return lines.filter((l) => findVariantWithService(categories, l.variantId));
}

// Picking an option replaces any other option of the same service: a service
// has one tier per appointment (e.g. short OR long hair). More people getting
// the same service is what quantity is for.
export function selectVariant(
  lines: CartLine[],
  categories: CategoryDto[],
  service: ServiceDto,
  variantId: string,
): CartLine[] {
  const siblingIds = new Set(service.variants.map((v) => v.id));
  const previous = lines.find((l) => siblingIds.has(l.variantId));
  const others = lines.filter((l) => !siblingIds.has(l.variantId));
  const next = [...others, { variantId, quantity: previous?.quantity ?? 1 }];
  return pruneCart(next, categories).slice(0, MAX_CART_LINES);
}

export function setQuantity(lines: CartLine[], variantId: string, quantity: number): CartLine[] {
  const q = Math.max(1, Math.min(MAX_QUANTITY, quantity));
  return lines.map((l) => (l.variantId === variantId ? { ...l, quantity: q } : l));
}

export function cartTotals(
  lines: CartLine[],
  categories: CategoryDto[],
): { totalAed: number; totalMinutes: number } {
  const priced = lines.flatMap((line) => {
    const found = findVariantWithService(categories, line.variantId);
    return found
      ? [{ price: found.variant.priceAed, durationMinutes: found.variant.durationMinutes, quantity: line.quantity }]
      : [];
  });
  const { totalHalalas, totalMinutes } = totalsForLines(priced);
  return { totalAed: fromHalalas(totalHalalas), totalMinutes };
}
