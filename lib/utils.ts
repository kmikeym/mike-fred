/**
 * MIKE Federal Reserve - Utility Functions
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a date for display.
 *
 * `new Date("2026-07-01")` parses as UTC midnight, so formatting it in a
 * negative-UTC-offset zone renders the previous day — and since every MIKE
 * observation falls on the 1st, that shifts the month (and at January, the
 * year). Date-only strings are therefore parsed as local calendar dates, so a
 * given YYYY-MM-DD always renders as itself. See STANDARDS.md §3.
 */
function toCalendarDate(date: string | Date): Date {
  if (typeof date !== "string") return date;
  if (!DATE_ONLY.test(date)) return new Date(date);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return toCalendarDate(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format date as short version
 */
export function formatDateShort(date: string | Date): string {
  return toCalendarDate(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getTimeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

/**
 * Generate CSS class for trend
 */
export function getTrendClass(change: number): string {
  if (change > 0) return "trend-up";
  if (change < 0) return "trend-down";
  return "trend-neutral";
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate quarter ID from date (e.g., "q4-2025")
 */
export function getQuarterId(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `q${quarter}-${year}`;
}

/**
 * Format quarter display (e.g., "Q4 2025")
 */
export function formatQuarter(quarterId: string): string {
  const [q = "", year = ""] = quarterId.split("-");
  return `Q${q.replace("q", "")} ${year}`;
}

/**
 * CN (className) utility for conditional classes
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
