/**
 * Date-formatting tests.
 *
 * STANDARDS.md §3: dates render timezone-independently. A YYYY-MM-DD string
 * parsed as UTC midnight and formatted locally shifts the day — and because
 * every MIKE observation falls on the 1st of a month, it shifts the *month*.
 *
 * Regression guard for issue #3. Run under multiple TZs: `bun run test:tz`.
 */

import { test, expect } from "bun:test";
import { formatDate, formatDateShort } from "./utils";

test("formatDateShort renders the calendar date it was given", () => {
  expect(formatDateShort("2026-07-01")).toBe("Jul 1, 2026");
});

test("formatDate renders the calendar date it was given", () => {
  expect(formatDate("2026-07-01")).toBe("July 1, 2026");
});

test("does not roll a month-start date back into the previous month", () => {
  // The failure this guards: in any negative-UTC-offset zone, "2026-07-01"
  // rendered "Jun 30, 2026" — labelling June data as May on the chart axis.
  for (const date of ["2026-01-01", "2026-07-01", "2026-12-01"]) {
    expect(formatDateShort(date)).toContain(date.slice(0, 4));
    expect(formatDateShort(date)).toContain(" 1, ");
  }
});

test("handles the year boundary without shifting the year", () => {
  expect(formatDateShort("2026-01-01")).toBe("Jan 1, 2026");
});

test("accepts a Date object unchanged", () => {
  expect(formatDateShort(new Date(2026, 6, 1))).toBe("Jul 1, 2026");
});
