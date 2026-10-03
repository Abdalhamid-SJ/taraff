import type { AvailabilityRule } from "./types";

// The business's opening hours for one weekday, in business-local minutes.
// startMinute >= endMinute means closed that day.
export interface BusinessHoursDay {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

/**
 * Trims a beautician's weekly availability to the business's opening hours,
 * so no slot is ever offered (or assigned) while the business is closed.
 * Days missing from `businessHours` are left as the beautician set them.
 */
export function clampAvailabilityToBusinessHours(
  rules: AvailabilityRule[],
  businessHours: BusinessHoursDay[],
): AvailabilityRule[] {
  if (businessHours.length === 0) return rules;
  const byDay = new Map(businessHours.map((d) => [d.dayOfWeek, d]));
  const clamped: AvailabilityRule[] = [];
  for (const rule of rules) {
    const day = byDay.get(rule.dayOfWeek);
    if (!day) {
      clamped.push(rule);
      continue;
    }
    const startMinute = Math.max(rule.startMinute, day.startMinute);
    const endMinute = Math.min(rule.endMinute, day.endMinute);
    if (startMinute < endMinute) clamped.push({ dayOfWeek: rule.dayOfWeek, startMinute, endMinute });
  }
  return clamped;
}
