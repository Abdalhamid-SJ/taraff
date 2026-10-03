// Saudi phone numbers are stored in one canonical form: +966 followed by the
// national number without its leading 0 (e.g. +966501234567). Customers type
// them every which way, so everything that accepts a phone normalises first.

// +966 followed by 8 (landline) or 9 (mobile) digits.
export const SAUDI_PHONE_REGEX = /^\+966\d{8,9}$/;

const ARABIC_INDIC_ZERO = 0x0660; // ٠
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0; // ۰ (Persian/Urdu keyboards)

function toAsciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code >= EXTENDED_ARABIC_INDIC_ZERO ? EXTENDED_ARABIC_INDIC_ZERO : ARABIC_INDIC_ZERO;
    return String(code - base);
  });
}

/**
 * Normalises the common ways a Saudi number is written to +966XXXXXXXXX:
 * "0501234567", "501234567", "966501234567", "00966 50 123 4567",
 * "+966 (50) 123-4567", and the same with Arabic-Indic digits.
 * Anything that isn't recognisably a number is returned trimmed and unchanged,
 * so validation still rejects it.
 */
export function normalizeSaudiPhone(raw: string): string {
  const compact = toAsciiDigits(raw.trim()).replace(/[\s\-().‎‏]/g, "");
  let digits = compact.startsWith("+") ? compact.slice(1) : compact;
  if (!/^\d+$/.test(digits)) return raw.trim();
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("966")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `+966${digits}`;
}
