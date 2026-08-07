/**
 * Cross-surface integration: the API must not drift from the site, because both
 * are built from the same load path (#6). If these fail, the API and the HTML
 * disagree — a machine consumer would read a different number than a human.
 */
import { test, expect } from "bun:test";
import { loadAllIndicators, loadIndicatorData } from "@/lib/indicators";
import { buildSeriesList, buildSeriesDocument, registryCoverageGap } from "./documents";

test("the series list covers every registry indicator", async () => {
  const list = buildSeriesList(await loadAllIndicators());
  expect(registryCoverageGap(list.series.map((s) => s.id))).toEqual([]);
});

test("every series document matches the loaded indicator (no drift from the site)", async () => {
  for (const i of await loadAllIndicators()) {
    const doc = buildSeriesDocument(i);
    expect(`${i.id}:${doc.observations.length}`).toBe(`${i.id}:${i.data.length}`);
    expect(`${i.id}:${doc.observations.at(-1)!.value}`).toBe(`${i.id}:${i.currentValue}`);
    i.data.forEach((p, idx) => {
      expect(`${i.id}[${idx}]:${doc.observations[idx]!.notes ?? ""}`).toBe(`${i.id}[${idx}]:${p.notes ?? ""}`);
    });
  }
});

test("PHI's corrected June value (106.0) survives the API build", async () => {
  // PHI moved to release-lag dating in 2026-08 (#12); the row measuring June is now
  // dated by its July release, not by the month it measures. Same value, new date.
  const doc = buildSeriesDocument(await loadIndicatorData("phi"));
  expect(doc.observations.find((o) => o.date === "2026-07-01")!.value).toBe(106.0);
});
