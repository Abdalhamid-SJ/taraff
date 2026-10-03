import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const BUSINESS_TIME_ZONE = "Asia/Riyadh";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function businessMinuteToUtc(
  dateStr: string,
  minuteOfDay: number,
  timeZone: string = BUSINESS_TIME_ZONE,
): Date {
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;
  const localWallTime = `${dateStr}T${pad(hours)}:${pad(minutes)}:00`;
  return fromZonedTime(localWallTime, timeZone);
}

export function businessDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function businessDateString(
  date: Date,
  timeZone: string = BUSINESS_TIME_ZONE,
): string {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd");
}

export function startOfBusinessDay(
  date: Date,
  timeZone: string = BUSINESS_TIME_ZONE,
): Date {
  const dateStr = businessDateString(date, timeZone);
  return businessMinuteToUtc(dateStr, 0, timeZone);
}

export function startOfBusinessWeek(
  date: Date,
  timeZone: string = BUSINESS_TIME_ZONE,
): Date {
  const dayStart = startOfBusinessDay(date, timeZone);
  const dayOfWeek = businessDayOfWeek(businessDateString(dayStart, timeZone));
  // Safe as fixed-ms-offset subtraction only because Asia/Riyadh has no DST —
  // in a DST-observing zone this would land on the wrong wall-clock time.
  return new Date(dayStart.getTime() - dayOfWeek * MS_PER_DAY);
}
