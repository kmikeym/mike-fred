/**
 * Report index tests.
 *
 * Report metadata — title, quarter, published date, summaries — used to live in
 * two hand-maintained `REPORTS` constants in TSX *and* in the quarterly JSON.
 * The JSON copy was never read, so it silently drifted from the rendered text in
 * three of six reports. The TSX copies drifted from each other too, and both
 * went stale at once when a figure was restated (#13).
 *
 * One source now: `data/quarterly/<id>.json`.
 */

import { test, expect } from "bun:test";
import { loadReportIndex, loadReport } from "./indicators";

test("every report exposes the metadata both pages need", async () => {
  const index = await loadReportIndex();

  expect(index.length).toBe(7);
  for (const r of index) {
    for (const field of ["id", "title", "quarter", "publishedDate", "blurb", "summary", "status"] as const) {
      expect(`${r.id}.${field}:${Boolean(r[field])}`).toBe(`${r.id}.${field}:true`);
    }
  }
});

test("reports are ordered newest first", async () => {
  const dates = (await loadReportIndex()).map((r) => r.publishedDate);

  expect(dates).toEqual([...dates].sort().reverse());
});

test("the index carries each report's addendum count", async () => {
  const index = await loadReportIndex();
  const byId = Object.fromEntries(index.map((r) => [r.id, r]));

  // The listing badges reports carrying addenda (#11).
  expect(byId["q4-2025"]!.updateCount).toBe(3);
  expect(byId["q1-2025"]!.updateCount).toBe(1);
  expect(byId["phi-2.0-methodology"]!.updateCount).toBe(0);
});

test("blurb and summary are distinct — a short card line and the full prose", async () => {
  const q3 = await loadReport("q3-2025");

  expect(q3!.blurb.length).toBeLessThan(q3!.summary.length);
  expect(q3!.summary).toContain(q3!.blurb.slice(0, 40));
});

test("loadReport returns null for an unknown id", async () => {
  expect(await loadReport("q9-9999")).toBeNull();
});

test("status is preserved for the listing badge", async () => {
  const index = await loadReportIndex();
  const current = index.filter((r) => r.status === "current").map((r) => r.id);

  expect(current.sort()).toEqual(["phi-2.0-methodology", "q2-2026"]);
});
