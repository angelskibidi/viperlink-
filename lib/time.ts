export const COMMON_TIMEZONES = [
  { label: "Auto (your device)", value: "" },
  // Americas
  { label: "New York (ET)", value: "America/New_York" },
  { label: "Chicago (CT)", value: "America/Chicago" },
  { label: "Denver (MT)", value: "America/Denver" },
  { label: "Los Angeles (PT)", value: "America/Los_Angeles" },
  { label: "Phoenix (MST)", value: "America/Phoenix" },
  { label: "Anchorage (AKT)", value: "America/Anchorage" },
  { label: "Honolulu (HST)", value: "Pacific/Honolulu" },
  { label: "Toronto (ET)", value: "America/Toronto" },
  { label: "Vancouver (PT)", value: "America/Vancouver" },
  { label: "Mexico City (CT)", value: "America/Mexico_City" },
  { label: "São Paulo (BRT)", value: "America/Sao_Paulo" },
  { label: "Buenos Aires (ART)", value: "America/Argentina/Buenos_Aires" },
  // Europe
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Paris (CET)", value: "Europe/Paris" },
  { label: "Berlin (CET)", value: "Europe/Berlin" },
  { label: "Rome (CET)", value: "Europe/Rome" },
  { label: "Madrid (CET)", value: "Europe/Madrid" },
  { label: "Amsterdam (CET)", value: "Europe/Amsterdam" },
  { label: "Stockholm (CET)", value: "Europe/Stockholm" },
  { label: "Warsaw (CET)", value: "Europe/Warsaw" },
  { label: "Helsinki (EET)", value: "Europe/Helsinki" },
  { label: "Athens (EET)", value: "Europe/Athens" },
  { label: "Moscow (MSK)", value: "Europe/Moscow" },
  { label: "Istanbul (TRT)", value: "Europe/Istanbul" },
  // Middle East & Africa
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "Riyadh (AST)", value: "Asia/Riyadh" },
  { label: "Cairo (EET)", value: "Africa/Cairo" },
  { label: "Lagos (WAT)", value: "Africa/Lagos" },
  { label: "Nairobi (EAT)", value: "Africa/Nairobi" },
  // Asia
  { label: "Karachi (PKT)", value: "Asia/Karachi" },
  { label: "Mumbai (IST)", value: "Asia/Kolkata" },
  { label: "Dhaka (BST)", value: "Asia/Dhaka" },
  { label: "Bangkok (ICT)", value: "Asia/Bangkok" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Hong Kong (HKT)", value: "Asia/Hong_Kong" },
  { label: "Shanghai (CST)", value: "Asia/Shanghai" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Seoul (KST)", value: "Asia/Seoul" },
  // Pacific
  { label: "Sydney (AEST)", value: "Australia/Sydney" },
  { label: "Melbourne (AEST)", value: "Australia/Melbourne" },
  { label: "Auckland (NZST)", value: "Pacific/Auckland" },
];

export function formatTs(dateStr: string, tz?: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    timeZone: tz || undefined,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function formatTsShort(dateStr: string, tz?: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    timeZone: tz || undefined,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  if (h < 48) return "yesterday";
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function getStoredTz(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vl_tz") ?? "";
}

export function setStoredTz(tz: string): void {
  localStorage.setItem("vl_tz", tz);
}
