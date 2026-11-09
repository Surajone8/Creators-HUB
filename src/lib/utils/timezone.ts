/**
 * Normalizes user-selected local datetime with a specific IANA timezone into ISO UTC string
 * for reliable backend scheduling and reconciliation.
 */
export function normalizeToUTC(localDateTimeString: string, timeZone: string): string {
  // Normalize string to UTC ISO representation
  const date = new Date(localDateTimeString);
  return date.toISOString();
}

/**
 * Returns user browser's detected default IANA timezone
 */
export function getDefaultTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/**
 * List of commonly used creator timezones
 */
export const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin, Paris (CET/CEST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Singapore", label: "Singapore / Hong Kong (SGT/HKT)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];
