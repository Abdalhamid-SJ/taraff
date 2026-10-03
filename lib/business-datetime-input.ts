import { BUSINESS_TIME_ZONE, businessMinuteToUtc } from "@/lib/scheduling";

// Converts a UTC Date to the value shape <input type="datetime-local"> expects,
// expressed in business-local wall-clock time.
export function toBusinessInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Reverses toBusinessInputValue: an <input type="datetime-local"> value,
// interpreted as business-local wall-clock time, to a UTC ISO string.
export function businessInputValueToIso(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [hh, mm] = timePart.split(":").map(Number);
  return businessMinuteToUtc(datePart, hh * 60 + mm).toISOString();
}
