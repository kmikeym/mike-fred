/**
 * PHI's measured periods are invariant under its date convention.
 *
 * PHI moved from data-month to release-lag dating in 2026-08 so its rows line up
 * with the other five series. That change re-dates every row but must not move a
 * single measured month. STANDARDS.md section 3 tells consumers to align on `period`,
 * never on `date` - so this asserts the periods, which makes it pass identically
 * before and after the shift. If the CSV shift and the registry flip ever
 * disagree by a month, every assertion here moves at once.
 */

import { test, expect } from "bun:test";
import { loadIndicatorData, loadPhiOverlap } from "./indicators";
import { observationPeriod } from "./api/documents";

test("PHI measures a contiguous run of months from 2023-01 to 2026-07", async () => {
  const phi = await loadIndicatorData("phi");
  const periods = phi.data.map((p) => observationPeriod(p.date, phi.dateConvention).start);

  expect(periods.length).toBe(43);
  expect(periods[0]).toBe("2023-01-01");
  expect(periods[periods.length - 1]).toBe("2026-07-01");

  // No gaps and no repeats: each period is exactly one month after the last.
  const gaps: string[] = [];
  for (let i = 1; i < periods.length; i++) {
    const [py, pm] = periods[i - 1]!.split("-").map(Number) as [number, number];
    const expected = pm === 12 ? `${py + 1}-01-01` : `${py}-${String(pm + 1).padStart(2, "0")}-01`;
    if (periods[i] !== expected) gaps.push(`${periods[i - 1]} -> ${periods[i]}`);
  }
  expect(gaps).toEqual([]);
});

test("each PHI value stays attached to the month it measures", async () => {
  const phi = await loadIndicatorData("phi");
  const byPeriod = new Map(
    phi.data.map((p) => [observationPeriod(p.date, phi.dateConvention).start, p.value]),
  );

  // Spot checks across the span, including the two most recently published rows.
  expect(byPeriod.get("2023-01-01")).toBe(112.4);
  expect(byPeriod.get("2026-05-01")).toBe(113.2);
  expect(byPeriod.get("2026-06-01")).toBe(106.0);
  expect(byPeriod.get("2026-07-01")).toBe(111.6);
});

test("PHI's next update is unmoved by the convention", async () => {
  const phi = await loadIndicatorData("phi");
  expect(phi.nextUpdate).toBe("2026-09-01");
});

test("the PHI-Classic overlap pairs the same two values", async () => {
  // The overlap chart aligns PHI 2.0 against the retired vintage. The pairing is
  // what the methodology report shows; only the x-axis label moves.
  const overlap = await loadPhiOverlap();
  const paired = overlap.filter((p) => p.phi2 !== null && p.classic !== null);

  // PHI-Classic ran Oct 2025 to Jul 2026 on a release lag, which is ten months of
  // overlap against PHI 2.0. Only the x-axis label moves; the pairs do not.
  expect(paired.length).toBe(10);
  expect(paired.slice(-3).map((p) => [p.phi2, p.classic])).toEqual([
    [101.6, 102.8],
    [113.2, 114.3],
    [106.0, 119.5],
  ]);
});
