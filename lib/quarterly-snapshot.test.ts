/**
 * Quarterly snapshot loading tests.
 *
 * A quarterly report is a frozen record: its indicator cards must show what was
 * true in that quarter, not today's values. `loadQuarterlySnapshot` is what makes
 * that so, and `null` from it means "render live values instead".
 *
 * Three distinct states have to stay distinguishable (#5):
 *   1. a real snapshot        -> frozen Indicator[]
 *   2. no indicators section  -> null, deliberately (the methodology report)
 *   3. a corrupt/unreadable file -> throw, loudly
 *
 * Before this, 2 and 3 were the same code path: a TypeError from reading
 * `snapshot.indicators` on an absent key was caught by the same catch-all that
 * swallowed malformed JSON. A one-character typo in a quarterly file therefore
 * made a 2025 report silently render 2026 numbers, with a green build.
 */

import { test, expect } from "bun:test";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { loadQuarterlySnapshot } from "./indicators";

async function withQuarterlyDir<T>(
  files: Record<string, string>,
  fn: (dir: string) => Promise<T>,
): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "mike-fred-snap-"));
  const dir = path.join(root, "quarterly");
  await fs.mkdir(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    await fs.writeFile(path.join(dir, name), body, "utf-8");
  }
  try {
    return await fn(dir);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

const VALID = JSON.stringify({
  quarter: "Q3 2025",
  period: { start: "2025-07-01", end: "2025-09-30" },
  indicators: {
    ppi: { value: 105, change: 6.3, changePercent: 6.3, trend: "up", note: "peak" },
  },
});

test("a real snapshot returns frozen indicators, not live values", async () => {
  const result = await withQuarterlyDir({ "q3-2025.json": VALID }, (dir) =>
    loadQuarterlySnapshot("q3-2025", dir),
  );

  expect(result).toHaveLength(1);
  expect(result![0]!.currentValue).toBe(105);
  // Dated to the close of its own period, not to today.
  expect(result![0]!.lastUpdate).toBe("2025-09-30");
});

test("a report with no indicators section returns null so live values render", async () => {
  // The PHI 2.0 methodology report is not a quarter; it has narrative and
  // highlights but no indicators, and its cards should show current values.
  const body = JSON.stringify({ highlights: ["..."], narrative: { executiveSummary: "..." } });

  const result = await withQuarterlyDir({ "phi-2.0-methodology.json": body }, (dir) =>
    loadQuarterlySnapshot("phi-2.0-methodology", dir),
  );

  expect(result).toBeNull();
});

test("a missing snapshot returns null", async () => {
  const result = await withQuarterlyDir({}, (dir) => loadQuarterlySnapshot("does-not-exist", dir));

  expect(result).toBeNull();
});

test("malformed JSON throws instead of silently falling back to live data", async () => {
  // The bug this guards: a stray comma made a published historical report render
  // today's numbers, and the build stayed green.
  const broken = VALID.replace('"indicators":{', '"indicators":{,');
  expect(() => JSON.parse(broken)).toThrow(); // the fixture really is malformed

  await expect(
    withQuarterlyDir({ "q3-2025.json": broken }, (dir) => loadQuarterlySnapshot("q3-2025", dir)),
  ).rejects.toThrow(/Failed to read quarterly snapshot q3-2025/);
});

test("the real methodology report still returns null against the shipped data", async () => {
  expect(await loadQuarterlySnapshot("phi-2.0-methodology")).toBeNull();
});

test("the real quarterly reports still load their snapshots", async () => {
  for (const id of ["q1-2025", "q2-2025", "q3-2025", "q4-2025", "q1-2026", "q2-2026"]) {
    const result = await loadQuarterlySnapshot(id);
    expect(`${id}:${result === null ? "null" : "loaded"}`).toBe(`${id}:loaded`);
  }
});
