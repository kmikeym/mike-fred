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
 * Keep only the observations falling in the last `months` calendar months.
 *
 * Powers the ALL/1Y/6M/3M selector on series charts. This used to be
 * `data.slice(-months)`, which counts *rows* rather than months — identical
 * while every series is monthly and gapless, and silently wrong the moment one
 * is not. A gap would have made a 3-month window quietly span five, which is
 * precisely the distortion a range selector exists to expose (#5).
 *
 * Anchored to the last observation rather than to today, so the window means the
 * same thing regardless of when the page is built.
 *
 * @param months number of calendar months to keep; `Infinity` keeps everything
 */
export function windowByMonths<T extends { date: string }>(data: T[], months: number): T[] {
  if (!Number.isFinite(months) || data.length === 0) return data;

  const last = data[data.length - 1]!.date;
  const [year, month] = last.split("-").map(Number) as [number, number];

  // Start of the window: the last point's month, minus (months - 1).
  const start = new Date(Date.UTC(year, month - 1, 1));
  start.setUTCMonth(start.getUTCMonth() - (months - 1));
  const cutoff = start.toISOString().slice(0, 10);

  return data.filter((p) => p.date >= cutoff);
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

/**
 * Trailing simple moving average, aligned to the input.
 *
 * Each output point is the mean of that value and the `window - 1` values
 * before it; points without enough history are `null`, so a chart line begins
 * only where the average is real. Trailing (not centered) on purpose: a point
 * never averages in data from after it, which keeps the release-lag reading
 * intact — a movement here summarises the run ending here (STANDARDS.md §9,
 * issue #1). Nothing is stored; this runs over the raw CSV values at build time.
 */
export function trailingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) =>
    i < window - 1
      ? null
      : values.slice(i - window + 1, i + 1).reduce((sum, v) => sum + v, 0) / window,
  );
}
