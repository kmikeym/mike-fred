/**
 * Report addenda ("updates") tests.
 *
 * Published reports are annotated, never rewritten (#11). An update is a dated
 * note appended to a report explaining a restatement or correction, leaving the
 * original text intact.
 */

import { test, expect } from "bun:test";
import { buildNarrative } from "./indicators";

test("returns updates declared on the snapshot", () => {
  const n = buildNarrative({
    narrative: { executiveSummary: "..." },
    updates: [{ date: "2026-07-22", title: "PHI restated", body: "..." }],
  });

  expect(n!.updates).toHaveLength(1);
  expect(n!.updates[0]!.title).toBe("PHI restated");
});

test("returns updates for a report that has no narrative block", () => {
  // q1-2025, q2-2025 and q3-2025 carry highlights but no narrative, and they are
  // among the reports that must be annotated. Updates must survive that shape.
  const n = buildNarrative({
    highlights: ["..."],
    updates: [{ date: "2026-07-22", title: "PHI data now exists for 2025", body: "..." }],
  });

  expect(n).not.toBeNull();
  expect(n!.updates).toHaveLength(1);
  expect(n!.executiveSummary).toBeUndefined();
});

test("orders updates newest first", () => {
  const n = buildNarrative({
    narrative: { executiveSummary: "..." },
    updates: [
      { date: "2026-07-22", title: "second", body: "..." },
      { date: "2026-09-01", title: "third", body: "..." },
      { date: "2026-01-05", title: "first", body: "..." },
    ],
  });

  expect(n!.updates.map((u) => u.title)).toEqual(["third", "second", "first"]);
});

test("defaults updates to an empty array when absent", () => {
  const n = buildNarrative({ narrative: { executiveSummary: "..." } });

  expect(n!.updates).toEqual([]);
});

test("returns null only when there is neither narrative nor updates", () => {
  expect(buildNarrative({ highlights: ["..."] })).toBeNull();
  expect(buildNarrative({})).toBeNull();
});
