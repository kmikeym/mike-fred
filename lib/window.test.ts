/**
 * Chart range-window tests.
 *
 * The ALL/1Y/6M/3M selector used `data.slice(-months)`, which treats "last N
 * rows" as "last N months". That is correct only while every series is monthly
 * and gapless — true today, silently wrong the first time a month is missing,
 * and a missing month is exactly what a range selector should reveal (#5).
 */

import { test, expect } from "bun:test";
import { windowByMonths } from "./utils";
import { INDICATOR_REGISTRY, loadIndicatorData } from "./indicators";
import type { IndicatorId } from "./types";

const monthly = (dates: string[]) => dates.map((date, i) => ({ date, value: i }));

test("returns everything when the range is unbounded", () => {
  const data = monthly(["2026-01-01", "2026-02-01", "2026-03-01"]);

  expect(windowByMonths(data, Infinity)).toHaveLength(3);
});

test("keeps the last N calendar months", () => {
  const data = monthly(["2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01"]);

  expect(windowByMonths(data, 3).map((p) => p.date)).toEqual([
    "2026-02-01",
    "2026-03-01",
    "2026-04-01",
  ]);
});

test("crosses the year boundary", () => {
  const data = monthly(["2025-11-01", "2025-12-01", "2026-01-01", "2026-02-01"]);

  expect(windowByMonths(data, 3).map((p) => p.date)).toEqual([
    "2025-12-01",
    "2026-01-01",
    "2026-02-01",
  ]);
});

test("a gap yields fewer points rather than reaching further back", () => {
  // This is the whole point. slice(-3) would return Sep, Jan, Feb — silently
  // presenting a five-month span as a three-month window.
  const data = monthly(["2025-09-01", "2026-01-01", "2026-02-01"]);

  // Last point is Feb 2026, so a 3-month window starts Dec 2025. Only Jan and
  // Feb fall inside it; September is correctly excluded.
  expect(windowByMonths(data, 3).map((p) => p.date)).toEqual(["2026-01-01", "2026-02-01"]);
});

test("handles empty data", () => {
  expect(windowByMonths([], 6)).toEqual([]);
});

test("matches the old slice behaviour on every shipped series", async () => {
  // The series are monthly and gapless today, so this refactor must be a no-op
  // for real data. If these ever diverge, the data has a gap and the new
  // behaviour is the correct one.
  for (const id of Object.keys(INDICATOR_REGISTRY) as IndicatorId[]) {
    const { data } = await loadIndicatorData(id);
    for (const months of [3, 6, 12]) {
      const oldWay = data.slice(-months).map((p) => p.date);
      const newWay = windowByMonths(data, months).map((p) => p.date);
      expect(`${id}/${months}:${newWay.join(",")}`).toBe(`${id}/${months}:${oldWay.join(",")}`);
    }
  }
});
