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
import { promises as fs } from "fs";
import path from "path";
import { INDICATOR_REGISTRY, rowDateFor, rowDateForRelease, nextReleaseDate } from "./indicators";
import type { IndicatorId } from "./types";

const IDS = Object.keys(INDICATOR_REGISTRY) as IndicatorId[];

test("every indicator declares a date convention and a value source", () => {
  for (const id of IDS) {
    const m = INDICATOR_REGISTRY[id];
    expect(`${id}:${m.dateConvention}`).toMatch(/:(release-lag|data-month)$/);
    expect(`${id}:${m.valueSource}`).toMatch(/:(derived|external)$/);
  }
});

test("every series is release-lag", () => {
  // PHI was the lone data-month series until 2026-08, when it was re-dated to line
  // up with the other five. The convention is still supported and still typed; this
  // fails loudly if a seventh series arrives on the other one without a decision.
  const offenders = IDS.filter((id) => INDICATOR_REGISTRY[id].dateConvention !== "release-lag");
  expect(offenders).toEqual([]);
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

test("rowDateForRelease reads the registry, not a hardcoded convention", () => {
  // Every series is release-lag right now, so comparing rowDateForRelease("ppi", ...)
  // against rowDateFor(registry-value, ...) alone would still pass if the delegation
  // were deleted and the body hardcoded "${releaseMonth}-01": both sides would agree
  // by coincidence. Flip the registry entry to data-month for the length of this
  // test so the two conventions actually disagree, then restore it.
  // The restore is in a finally block and bun:test runs tests within a file sequentially,
  // so no other test can observe the flipped value; if tests ever run concurrently, this
  // needs a local registry instead.
  const original = INDICATOR_REGISTRY.ppi.dateConvention;
  INDICATOR_REGISTRY.ppi.dateConvention = "data-month";
  try {
    expect(rowDateForRelease("ppi", "2026-08")).toBe(rowDateFor("data-month", "2026-08"));
    expect(rowDateForRelease("ppi", "2026-08")).not.toBe(`2026-08-01`);
  } finally {
    INDICATOR_REGISTRY.ppi.dateConvention = original;
  }
});

test("a data-month convention dates its row by the month it measures", () => {
  // The August release reports July; a data-month series dates that row July.
  expect(rowDateFor("data-month", "2026-08")).toBe("2026-07-01");
});

test("a data-month row date crosses the year boundary", () => {
  expect(rowDateFor("data-month", "2026-01")).toBe("2025-12-01");
});

test("the two conventions disagree by exactly one month for the same release", () => {
  expect(rowDateFor("release-lag", "2026-08")).not.toBe(rowDateFor("data-month", "2026-08"));
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

/**
 * Estimate-marker sweep (#21).
 *
 * STANDARDS.md §6 requires an estimated value's note to BEGIN with `ESTIMATED`,
 * because that prefix is what `buildObservation` matches to set `estimated: true`
 * in the API. The convention is enforced by a string match but authored by hand,
 * so nothing sat between someone typing "Estimated linear growth" and the check
 * silently returning false — four rows across two live series published
 * interpolations as measurements for months.
 *
 * The unit test on the matcher could not catch this (it feeds synthetic notes),
 * and the row-specific test could not either (it checked one row we already knew
 * about). This sweeps the corpus instead: no note may READ like an estimate while
 * claiming, by omission, to be a measurement.
 */
const ESTIMATE_LANGUAGE = /estimat|interpolat|assumed|projected/i;

test("no data note reads like an estimate without the ESTIMATED marker", async () => {
  const dir = path.join(process.cwd(), "data");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".csv"));
  expect(files.length).toBeGreaterThan(0);

  const offenders: string[] = [];
  for (const file of files) {
    const lines = (await fs.readFile(path.join(dir, file), "utf-8")).trim().split("\n");
    for (const line of lines.slice(1)) {
      const note = line.split(",").slice(2).join(",").trim();
      if (!note) continue;
      if (ESTIMATE_LANGUAGE.test(note) && !note.startsWith("ESTIMATED")) {
        offenders.push(`${file}:${line.slice(0, 10)}`);
      }
    }
  }

  expect(offenders).toEqual([]);
});

test("every ESTIMATED note states that it is not a measurement", async () => {
  // The marker alone only tells a machine. STANDARDS §6 also requires the note to
  // state the method and inputs so a human reading the series can judge the value.
  const dir = path.join(process.cwd(), "data");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".csv"));

  for (const file of files) {
    const lines = (await fs.readFile(path.join(dir, file), "utf-8")).trim().split("\n");
    for (const line of lines.slice(1)) {
      const note = line.split(",").slice(2).join(",").trim();
      if (!note.startsWith("ESTIMATED")) continue;
      const where = `${file}:${line.slice(0, 10)}`;
      expect(`${where}: ${/not a measurement/i.test(note)}`).toBe(`${where}: true`);
    }
  }
});
