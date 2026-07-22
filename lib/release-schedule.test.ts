/**
 * Release-schedule tests.
 *
 * STANDARDS.md §9: any value that can be computed from the data MUST be, rather
 * than hardcoded. `nextUpdate` was hand-typed in six registry entries, drifted,
 * and told the public PHI updates in October 2026.
 *
 * Regression guard for issue #4.
 */

import { test, expect } from "bun:test";
import { nextReleaseDate, loadIndicatorData, INDICATOR_REGISTRY } from "./indicators";
import type { IndicatorId } from "./types";

test("a monthly series releases the following month", () => {
  expect(nextReleaseDate("2026-07-01", "monthly")).toBe("2026-08-01");
});

test("a monthly series crosses the year boundary", () => {
  expect(nextReleaseDate("2026-12-01", "monthly")).toBe("2027-01-01");
});

test("a quarterly series releases three months out", () => {
  expect(nextReleaseDate("2026-07-01", "quarterly")).toBe("2026-10-01");
});

test("every indicator is monthly", () => {
  // All six stats are monthly; quarterly *reports* are a separate artifact.
  for (const meta of Object.values(INDICATOR_REGISTRY)) {
    expect(`${meta.id}:${meta.frequency}`).toBe(`${meta.id}:monthly`);
  }
});

test("every indicator's next update is derived from its own last data point", async () => {
  const ids = Object.keys(INDICATOR_REGISTRY) as IndicatorId[];

  for (const id of ids) {
    const indicator = await loadIndicatorData(id);
    const expected = nextReleaseDate(indicator.lastUpdate, indicator.frequency);
    expect(`${id}:${indicator.nextUpdate}`).toBe(`${id}:${expected}`);
  }
});

test("PHI no longer advertises an October release", async () => {
  const phi = await loadIndicatorData("phi");

  expect(phi.nextUpdate).not.toBe("2026-10-01");
  expect(phi.nextUpdate).toBe(nextReleaseDate(phi.lastUpdate, "monthly"));
});
