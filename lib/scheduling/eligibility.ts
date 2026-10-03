import type { BeauticianCandidate } from "./types";

// `areaId` is optional: customers now type their area in freehand, so the
// booking flow no longer filters by coverage area. It is still honoured when a
// caller passes one (legacy / future use).
export function getEligibleBeauticians(
  beauticians: BeauticianCandidate[],
  criteria: { areaId?: string; serviceIds: string[] },
): BeauticianCandidate[] {
  return beauticians.filter(
    (b) =>
      b.isActive &&
      (criteria.areaId === undefined || b.areaIds.includes(criteria.areaId)) &&
      criteria.serviceIds.every((serviceId) => b.serviceIds.includes(serviceId)),
  );
}
