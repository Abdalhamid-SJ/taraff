// Calendar helpers for business-local dates ("YYYY-MM-DD" in Asia/Riyadh).
// Dates are handled as plain calendar strings; arithmetic happens at UTC noon
// so no timezone edge can shift the day.

export const BUSINESS_TIME_ZONE = "Asia/Riyadh";

export function todayBusinessDateStr(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE }).format(now);
}

function toUtcNoon(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function addDays(dateStr: string, days: number): string {
  const date = toUtcNoon(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Today plus the next `count - 1` days.
export function upcomingDays(count: number, from = todayBusinessDateStr()): string[] {
  return Array.from({ length: Math.max(1, count) }, (_, i) => addDays(from, i));
}

export function formatDay(
  dateStr: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
    ...options,
    timeZone: "UTC",
  }).format(toUtcNoon(dateStr));
}

// Hour of day (0-23) of an instant, in business time.
export function businessHour(iso: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: BUSINESS_TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso)),
  );
}
