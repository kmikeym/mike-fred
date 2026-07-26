/**
 * Social Capital Index derivation tests.
 *
 * SCI is declared `valueSource: "derived"` in the registry, but until now the
 * repo could not actually derive it: the weighted-composite stage lived only as
 * prose naming 5 of 11 platforms and 2 of 11 weights. These tests pin the whole
 * pipeline so `derived` is a true statement (#17).
 */

import { test, expect } from "bun:test";
import { promises as fs } from "fs";
import path from "path";
import { SCI_WEIGHTS, SCI_BASELINE, weightedComposite, sciIndex } from "./sci";

test("the weight table covers 11 platforms", () => {
  expect(SCI_WEIGHTS.length).toBe(11);
});

test("weights sum to 1", () => {
  const sum = SCI_WEIGHTS.reduce((a, w) => a + w.weight, 0);
  // Tolerance, not equality: 0.35 + 0.30 + ... accumulates binary float error and
  // does not land on exactly 1. The invariant is the intent, not the bit pattern.
  expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
});

test("platform ids are unique", () => {
  const ids = SCI_WEIGHTS.map((w) => w.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("a uniform audience across every platform composites to that same number", () => {
  // Because the weights sum to 1, the composite is a weighted MEAN: if every
  // platform reports 1000 followers, the composite is 1000. This is the property
  // that distinguishes a weighted mean from a weighted sum, and it is the one
  // that made the ~3042 baseline plausible in the first place.
  const counts = Object.fromEntries(SCI_WEIGHTS.map((w) => [w.id, 1000]));
  expect(weightedComposite(counts)).toBeCloseTo(1000, 9);
});

test("weightedComposite applies each platform's weight", () => {
  const counts = Object.fromEntries(SCI_WEIGHTS.map((w) => [w.id, 0]));
  counts["substack"] = 1000; // weight 0.30
  expect(weightedComposite(counts)).toBeCloseTo(300, 9);
});

test("a missing platform count throws rather than silently counting as zero", () => {
  // A dropped platform would quietly deflate the index and read as audience
  // decline. Absent input is an error, not a zero (STANDARDS §6: "no data" and
  // "scored zero" must stay distinguishable).
  const counts = Object.fromEntries(SCI_WEIGHTS.slice(1).map((w) => [w.id, 100]));
  expect(() => weightedComposite(counts)).toThrow(/kmikeym-accounts/);
});

test("an unknown platform throws rather than being ignored", () => {
  const counts = Object.fromEntries(SCI_WEIGHTS.map((w) => [w.id, 100]));
  counts["threads"] = 500;
  expect(() => weightedComposite(counts)).toThrow(/threads/);
});

test("the baseline composite indexes to exactly 100", () => {
  expect(sciIndex(SCI_BASELINE)).toBe(100);
});

test("every published SCI row is reproducible from its raw composite", async () => {
  const csv = await fs.readFile(
    path.join(process.cwd(), "data", "social-capital.csv"),
    "utf-8",
  );
  const rows = csv.trim().split("\n").slice(1);
  expect(rows.length).toBeGreaterThan(0);

  for (const row of rows) {
    const date = row.slice(0, 10);
    const raw = Number(row.match(/raw: ([\d.]+)/)?.[1]);
    const published = Number(row.split(",")[1]);
    expect(`${date}:${Number.isFinite(raw)}`).toBe(`${date}:true`);

    // Compare at the precision the row was published to — a row stored as 101.15
    // must reproduce to 101.15, one stored as 100.4 to 100.4.
    const decimals = (String(published).split(".")[1] ?? "").length;
    expect(`${date}:${sciIndex(raw).toFixed(decimals)}`).toBe(
      `${date}:${published.toFixed(decimals)}`,
    );
  }
});
