// Shared types for lib/scheduling/. Pure data contracts only — no DB types leak in here.
// Callers (Server Actions, later phases) are responsible for mapping Prisma rows to these shapes.

export interface Interval {
  start: Date;
  end: Date;
}

export interface AvailabilityRule {
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday, business-local
  startMinute: number; // minutes from midnight, business-local
  endMinute: number;
}

export interface TimeOffPeriod {
  startsAt: Date; // UTC instant
  endsAt: Date; // UTC instant
}

export interface ExistingBooking {
  beauticianId: string;
  scheduledStart: Date; // UTC instant
  scheduledEnd: Date; // UTC instant — already includes the travel buffer
}

export interface BeauticianCandidate {
  id: string;
  isActive: boolean;
  serviceIds: string[]; // skills
  areaIds: string[]; // covered areas
  availability: AvailabilityRule[];
  timeOff: TimeOffPeriod[];
}

export interface SchedulingSettings {
  travelBufferMinutes: number;
  bookingLeadTimeHours: number;
  maxAdvanceDays: number;
  slotGranularityMinutes: number;
}

export interface OpenSlot {
  start: Date; // UTC instant the job would begin
}

export interface ComputeOpenSlotsInput {
  dateStr: string; // business-local calendar date, "YYYY-MM-DD"
  areaId?: string; // optional — omit to skip the coverage-area filter
  serviceIds: string[];
  variantDurations: number[]; // durationMinutes of each selected variant
  beauticians: BeauticianCandidate[];
  existingBookings: ExistingBooking[];
  settings: SchedulingSettings;
  now: Date; // UTC instant treated as "current time"
  timeZone?: string;
}

export interface AutoAssignInput {
  candidates: BeauticianCandidate[]; // eligible candidates (skills — and area, if one was given — already filtered)
  chosenSlot: Interval; // start..end, end includes duration + travel buffer
  existingBookings: ExistingBooking[];
  timeZone?: string;
}
