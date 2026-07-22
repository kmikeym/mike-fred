/**
 * Date-convention and value-source tests.
 *
 * The convention used to live as prose in five places (the append script header,
 * a code comment, STANDARDS.md, CLAUDE.md, report narratives) and drifted. It is
 * now typed data on the registry, read by both the site and the write path.
 *
 * Regression guard for #12.
 */

import { test, expect } from "bun:test";
import { INDICATOR_REGISTRY, rowDateForRelease, nextReleaseDate } from "./indicators";
import type { IndicatorId } from "./types";

const IDS = Object.keys(INDICATOR_REGISTRY) as IndicatorId[];

test("every indicator declares a date convention and a value source", () => {
  for (const id of IDS) {
    const m = INDICATOR_REGISTRY[id];
    expect(`${id}:${m.dateConvention}`).toMatch(/:(release-lag|data-month)$/);
    expect(`${id}:${m.valueSource}`).toMatch(/:(derived|external)$/);
  }
});

test("PHI is the data-month series; the other five are release-lag", () => {
  const byConvention = IDS.filter((id) => INDICATOR_REGISTRY[id].dateConvention === "data-month");
  expect(byConvention).toEqual(["phi"]);
});

test("PHI 2.0 values are external — this repo cannot compute them", () => {
  // PHI 2.0 needs per-day HRV, sleep stages, VO2 max and 2023-2025 baselines that
  // live in the Apple Health pipeline. The append script refuses to derive a value
  // for any series marked external; deleting that guard must fail this test.
  expect(INDICATOR_REGISTRY.phi.valueSource).toBe("external");
});

test("a release-lag series dates its row by the release month", () => {
  expect(rowDateForRelease("ppi", "2026-08")).toBe("2026-08-01");
});

test("a data-month series dates its row by the month it measures", () => {
  // The August release reports July; PHI dates that row July.
  expect(rowDateForRelease("phi", "2026-08")).toBe("2026-07-01");
});

test("a data-month row date crosses the year boundary", () => {
  expect(rowDateForRelease("phi", "2026-01")).toBe("2025-12-01");
});

test("the two conventions disagree by exactly one month for the same release", () => {
  expect(rowDateForRelease("ppi", "2026-08")).not.toBe(rowDateForRelease("phi", "2026-08"));
});

test("next release of a release-lag series is one period out", () => {
  expect(nextReleaseDate("2026-07-01", "monthly", "release-lag")).toBe("2026-08-01");
});

test("next release of a data-month series is two periods out", () => {
  // Its last row (June) was published ~Jul 1; the July row cannot exist until
  // July closes, so the next *publication* is ~Aug 1.
  expect(nextReleaseDate("2026-06-01", "monthly", "data-month")).toBe("2026-08-01");
});

test("no indicator advertises a next update in the past", async () => {
  // The bug this guards: /series/phi advertised "Jul 1, 2026" on Jul 22 because
  // the derivation assumed release-lag for a data-month series (#9 D7).
  const { loadIndicatorData } = await import("./indicators");
  const today = new Date().toISOString().slice(0, 10);

  for (const id of IDS) {
    const indicator = await loadIndicatorData(id);
    expect(`${id}:${indicator.nextUpdate >= today}`).toBe(`${id}:true`);
  }
});
