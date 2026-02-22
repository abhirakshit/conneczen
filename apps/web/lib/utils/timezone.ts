/**
 * Get the next scheduled call time based on user's preferred time and timezone
 */
export function getNextScheduledCall(
  callTime: string, // "HH:MM" format
  userTimezone: string
): Date {
  const [hours, minutes] = callTime.split(":").map(Number);
  const now = new Date();

  // Create a date object for today's call time in the user's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Get current time in user's timezone
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value || "0";

  const currentYear = parseInt(getPart("year"));
  const currentMonth = parseInt(getPart("month")) - 1;
  const currentDay = parseInt(getPart("day"));
  const currentHour = parseInt(getPart("hour"));
  const currentMinute = parseInt(getPart("minute"));

  // Create today's call time
  let callDate = new Date(
    currentYear,
    currentMonth,
    currentDay,
    hours,
    minutes,
    0,
    0
  );

  // If the call time has passed today, move to tomorrow
  const currentTimeMinutes = currentHour * 60 + currentMinute;
  const callTimeMinutes = hours * 60 + minutes;

  if (callTimeMinutes <= currentTimeMinutes) {
    callDate.setDate(callDate.getDate() + 1);
  }

  return callDate;
}

/**
 * Format a date in the user's timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    timeZone: timezone,
    ...options,
  });
}

/**
 * Check if a date is today in the user's timezone
 */
export function isToday(date: Date, timezone: string): boolean {
  const now = new Date();
  const dateStr = formatInTimezone(date, timezone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = formatInTimezone(now, timezone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dateStr === todayStr;
}

/**
 * Check if a date is tomorrow in the user's timezone
 */
export function isTomorrow(date: Date, timezone: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = formatInTimezone(date, timezone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const tomorrowStr = formatInTimezone(tomorrow, timezone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dateStr === tomorrowStr;
}

/**
 * Common timezone options for the settings form
 */
export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];

/**
 * Convert local time (HH:MM) to UTC time based on timezone
 * Returns time in HH:MM:SS format for PostgreSQL
 */
export function localTimeToUtc(localTime: string, timezone: string): string {
  const [hours, minutes] = localTime.split(":").map(Number);

  // Create a date object for today with the local time
  const now = new Date();
  const localDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );

  // Get the offset for the timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const utcFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Calculate offset by comparing same instant in both timezones
  const localParts = formatter.formatToParts(localDate);
  const utcParts = utcFormatter.formatToParts(localDate);

  const getTime = (parts: Intl.DateTimeFormatPart[]) => {
    const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
    const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
    return h * 60 + m;
  };

  const localMinutes = getTime(localParts);
  const utcMinutes = getTime(utcParts);
  const offsetMinutes = localMinutes - utcMinutes;

  // Apply offset to get UTC time
  let utcTotalMinutes = hours * 60 + minutes - offsetMinutes;

  // Handle day wraparound
  if (utcTotalMinutes < 0) utcTotalMinutes += 24 * 60;
  if (utcTotalMinutes >= 24 * 60) utcTotalMinutes -= 24 * 60;

  const utcHours = Math.floor(utcTotalMinutes / 60);
  const utcMins = utcTotalMinutes % 60;

  return `${utcHours.toString().padStart(2, "0")}:${utcMins.toString().padStart(2, "0")}:00`;
}

/**
 * Determine schedule type based on call time
 */
export function getScheduleType(callTime: string): "morning" | "evening" | "custom" {
  const [hours] = callTime.split(":").map(Number);
  if (hours >= 5 && hours < 12) return "morning";
  if (hours >= 17 && hours < 22) return "evening";
  return "custom";
}
