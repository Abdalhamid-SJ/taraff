import type { AdminAlertPayload, NotifyProvider } from "./types";
import { formatAlertMessage, formatAlertSubject } from "./format";

// Best-effort Resend email — the §7 fallback so real notifications go out
// before the WhatsApp Cloud API template is approved. Missing config is
// treated as "not set up yet" (silent no-op), not a failure; an actual
// failed send (key present, request rejected) throws so the caller can
// record it.
async function sendEmail(payload: AdminAlertPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to = process.env.NOTIFY_EMAIL_TO || process.env.ADMIN_SEED_EMAIL;
  if (!to) return;

  const from = process.env.NOTIFY_EMAIL_FROM || "Bookings <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: formatAlertSubject(payload),
      text: formatAlertMessage(payload),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

export const consoleProvider: NotifyProvider = {
  async sendAdminAlert(payload) {
    console.log(`[notify:console]\n${formatAlertMessage(payload)}`);
    await sendEmail(payload);
  },
};
