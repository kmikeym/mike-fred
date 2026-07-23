import { test, expect } from "bun:test";
import { loadIndicatorData, loadAllIndicators } from "@/lib/indicators";
import {
  observationPeriod, buildObservation, buildSeriesDocument, buildSeriesList, buildIndex,
} from "./documents";
import { requiredFields } from "./schema";

test("release-lag period is the month before the row date", () => {
  expect(observationPeriod("2026-07-01", "release-lag")).toEqual({ start: "2026-06-01", end: "2026-06-30" });
});

test("data-month period is the month of the row date", () => {
  expect(observationPeriod("2026-06-01", "data-month")).toEqual({ start: "2026-06-01", end: "2026-06-30" });
});

test("an observation whose note begins ESTIMATED is flagged; others are not", () => {
  const est = buildObservation({ date: "2026-03-01", value: 86.4, notes: "ESTIMATED — interpolated" }, "release-lag");
  expect(est.estimated).toBe(true);
  const plain = buildObservation({ date: "2026-06-01", value: 106, notes: "Strong month" }, "data-month");
  expect(plain.estimated).toBeUndefined();
});

test("notes pass through verbatim, commas and all; missing note is null", () => {
  const o = buildObservation({ date: "2026-07-01", value: 11, notes: "3 books, 3 films" }, "release-lag");
  expect(o.notes).toBe("3 books, 3 films");
  const n = buildObservation({ date: "2026-07-01", value: 11 }, "release-lag");
  expect(n.notes).toBeNull();
});

test("a PPI series document carries provenance, an observation per CSV row, and satisfies its schema's required fields", async () => {
  const doc = buildSeriesDocument(await loadIndicatorData("ppi"));
  expect(doc.id).toBe("ppi");
  expect(doc.date_convention).toBe("release-lag");
  expect(doc.baseline).toBe(100);
  const ppi = await loadIndicatorData("ppi");
  expect(doc.observations.length).toBe(ppi.data.length);
  for (const f of requiredFields("series")) {
    expect(`ppi doc has ${f}: ${f in doc}`).toBe(`ppi doc has ${f}: true`);
  }
});

test("the PHI series document links its PHI-Classic vintage", () => {
  return loadIndicatorData("phi").then((phi) => {
    const doc = buildSeriesDocument(phi);
    expect(doc.vintages.map((v) => v.id)).toEqual(["phi-classic"]);
  });
});

test("buildSeriesDocument throws when an observation value is NaN", () => {
  const broken = { ...({} as any), id: "ppi", title: "x", unit: "u", frequency: "monthly",
    category: "c", source: "s", calculation: null, color: "#000", precision: 1,
    dateConvention: "release-lag", valueSource: "derived",
    lastUpdate: "2026-07-01", nextUpdate: "2026-08-01", currentValue: 1, previousValue: 1,
    change: 0, changePercent: 0, trend: "neutral",
    data: [{ date: "2026-07-01", value: NaN, notes: "bad" }] };
  expect(() => buildSeriesDocument(broken as any)).toThrow(/NaN/);
});

test("the index document lists links and the series list summarises every indicator", async () => {
  const idx = buildIndex();
  expect(idx.links.some((l) => l.href === "/api/v1/series.json")).toBe(true);
  const list = buildSeriesList(await loadAllIndicators());
  expect(list.series.length).toBe(6);
  expect(list.series[0]!.url).toMatch(/^\/api\/v1\/series\/.+\.json$/);
});
