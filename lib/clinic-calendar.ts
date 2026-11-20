import { TZDate } from "@date-fns/tz";
export const CLINIC_TIMEZONE = "America/New_York";
export const calendarMonth = (now = new Date()) => {
  const local = new TZDate(now, CLINIC_TIMEZONE);
  return new TZDate(local.getFullYear(), local.getMonth(), 1, CLINIC_TIMEZONE);
};
export const calendarBounds = (month: Date) => ({
  start: new Date(
    new TZDate(
      month.getFullYear(),
      month.getMonth(),
      1,
      CLINIC_TIMEZONE,
    ).getTime(),
  ).toISOString(),
  end: new Date(
    new TZDate(
      month.getFullYear(),
      month.getMonth() + 1,
      1,
      CLINIC_TIMEZONE,
    ).getTime(),
  ).toISOString(),
});
export const calendarDateKey = (value: string | Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
export const calendarDoctors: Record<string, string> = {
  trivedi: "Dr. Trivedi",
  lascurain: "Dr. Lascurain",
  perez: "Dr. Perez",
};
export const calendarDayLabel = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new TZDate(
    year,
    month - 1,
    day,
    12,
    CLINIC_TIMEZONE,
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};
export const calendarStatuses: Record<string, string> = {
  requested: "Requested",
  scheduled: "Scheduled internally",
  completed: "Completed",
  canceled: "Canceled",
};
