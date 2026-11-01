import { test, expect } from "bun:test";
import { VINTAGE_META, vintagesFor, isVintage, ALL_SERIES_IDS } from "./vintages";

test("phi-classic is a declared vintage with its own metadata", () => {
  expect(isVintage("phi-classic")).toBe(true);
  expect(VINTAGE_META["phi-classic"]!.date_convention).toBe("release-lag");
  expect(VINTAGE_META["phi-classic"]!.unit).toContain("Index");
});

test("phi supersedes phi-classic; other series supersede nothing", () => {
  const v = vintagesFor("phi");
  expect(v).toHaveLength(1);
  expect(v[0]!.id).toBe("phi-classic");
  expect(v[0]!.url).toBe("/api/v1/series/phi-classic.json");
  expect(vintagesFor("ppi")).toEqual([]);
});

test("ALL_SERIES_IDS is the six registry ids plus the two retired vintages", () => {
  expect(ALL_SERIES_IDS).toContain("ppi");
  expect(ALL_SERIES_IDS).toContain("phi-classic");
  expect(ALL_SERIES_IDS).toContain("social-capital-classic");
  expect(ALL_SERIES_IDS).toHaveLength(8);
});

test("SCI points at SCI Classic, superseded at the 2026-11-01 release", () => {
  const [v] = vintagesFor("social-capital");
  expect(v?.id).toBe("social-capital-classic");
  expect(v?.superseded_on).toBe("2026-11-01");
});
