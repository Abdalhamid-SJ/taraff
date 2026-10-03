// wa.me click-to-chat link for an arbitrary phone number (e.g. a customer's).
export function waLink(phone: string, message?: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;

  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

// wa.me click-to-chat link. Returns null when no business number is configured
// so callers can skip rendering the CTA instead of linking to a broken URL.
export function businessWhatsAppLink(message?: string): string | null {
  const raw = process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP;
  if (!raw) return null;
  return waLink(raw, message);
}
