/**
 * Value formatting tests.
 *
 * STANDARDS.md §6: "Rounding is stated in the series metadata, not applied
 * silently." Precision used to be hardcoded in formatValue, with one series
 * special-cased by id (#5).
 *
 * The refactor must be output-identical for every value currently published —
 * these tests pin that.
 */

import { test, expect } from "bun:test";
import { INDICATOR_REGISTRY, loadIndicatorData, formatValue } from "./indicators";
import type { IndicatorId } from "./types";

const IDS = Object.keys(INDICATOR_REGISTRY) as IndicatorId[];

test("every indicator declares its precision", () => {
  for (const id of IDS) {
    expect(`${id}:${typeof INDICATOR_REGISTRY[id].precision}`).toBe(`${id}:number`);
  }
});

test("formatValue uses the declared precision, not a hardcoded rule", () => {
  // KBER is a whole-number count; the index series carry one decimal.
  expect(INDICATOR_REGISTRY["knowledge-expansion"].precision).toBe(0);
  expect(INDICATOR_REGISTRY.ppi.precision).toBe(1);

  expect(formatValue(6158, "knowledge-expansion")).toBe("6,158");
  expect(formatValue(83.75, "ppi")).toBe("83.8");
  expect(formatValue(106, "phi")).toBe("106.0");
});

test("large counts keep thousands separators", () => {
  expect(formatValue(12275, "knowledge-expansion")).toBe("12,275");
});

test("formatValue output is unchanged for every published value", async () => {
  // Baseline captured from the pre-refactor implementation across all 119 points
  // in the shipped CSVs. A refactor that changes any of these is a regression,
  // not a cleanup.
  const baseline = (await import("./formatting-baseline.json")).default as Record<string, string[]>;

  for (const id of IDS) {
    const indicator = await loadIndicatorData(id);
    const actual = indicator.data.map((p) => formatValue(p.value, id));
    expect(`${id}:${actual.join("|")}`).toBe(`${id}:${baseline[id]!.join("|")}`);
  }
});
