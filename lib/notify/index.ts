import type { AdminAlertPayload, NotifyProvider } from "./types";
import { consoleProvider } from "./console";
import { cloudApiProvider } from "./cloud-api";

const PROVIDERS: Record<string, NotifyProvider> = {
  console: consoleProvider,
  cloudapi: cloudApiProvider,
};

// §7: swapping providers is a one-file change — flip NOTIFY_PROVIDER.
export async function sendAdminAlert(payload: AdminAlertPayload): Promise<void> {
  const providerKey = process.env.NOTIFY_PROVIDER || "console";
  const provider = PROVIDERS[providerKey] ?? consoleProvider;
  await provider.sendAdminAlert(payload);
}

export type { AdminAlertEvent, AdminAlertPayload, NotifyProvider } from "./types";
