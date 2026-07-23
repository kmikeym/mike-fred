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
  expect(v[0]!.url).toBe("/api/v1/series/phi-classic");
  expect(vintagesFor("ppi")).toEqual([]);
});

test("ALL_SERIES_IDS is the six registry ids plus phi-classic", () => {
  expect(ALL_SERIES_IDS).toContain("ppi");
  expect(ALL_SERIES_IDS).toContain("phi-classic");
  expect(ALL_SERIES_IDS).toHaveLength(7);
});
