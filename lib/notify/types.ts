export type AdminAlertEvent = "BOOKING_CREATED" | "BOOKING_CANCELLED" | "BOOKING_RESCHEDULED";

export interface AdminAlertPayload {
  event: AdminAlertEvent;
  bookingReference: string;
  customerName: string;
  customerPhone: string;
  areaText: string;
  scheduledStartIso: string;
  totalAed: number;
  cancelReason?: string;
  previousScheduledStartIso?: string;
}

export interface NotifyProvider {
  sendAdminAlert(payload: AdminAlertPayload): Promise<void>;
}
