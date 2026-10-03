import { getWhatsappAdminNumbers } from "@/lib/settings";
import type { AdminAlertPayload, NotifyProvider } from "./types";

// §7: the exact template parameters can't be finalized until a template is
// actually approved by Meta — this is a best-effort scaffold matching the
// interface, not a tested integration. Update the `components` below to
// match whatever template gets approved.
async function sendToNumber(
  phoneNumberId: string,
  accessToken: string,
  templateName: string,
  to: string,
  payload: AdminAlertPayload,
): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: payload.bookingReference },
              { type: "text", text: payload.customerName },
              { type: "text", text: payload.customerPhone },
            ],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WhatsApp Cloud API error ${res.status}: ${body}`);
  }
}

export const cloudApiProvider: NotifyProvider = {
  async sendAdminAlert(payload) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    if (!phoneNumberId || !accessToken || !templateName) {
      throw new Error(
        "WhatsApp Cloud API is not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN / WHATSAPP_TEMPLATE_NAME)",
      );
    }

    const numbers = await getWhatsappAdminNumbers();
    if (numbers.length === 0) {
      throw new Error("No admin WhatsApp numbers configured in Settings");
    }

    const results = await Promise.allSettled(
      numbers.map((to) => sendToNumber(phoneNumberId, accessToken, templateName, to, payload)),
    );
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failures.length === results.length) {
      throw new Error(failures.map((f) => String(f.reason)).join("; "));
    }
    for (const f of failures) {
      console.error("[notify:cloudApi] failed to reach one admin number:", f.reason);
    }
  },
};
