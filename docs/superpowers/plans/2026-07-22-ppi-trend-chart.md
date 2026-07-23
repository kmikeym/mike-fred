# PPI Trend Chart Implementation Plan

> **For agentic workers:** Parallel execution: use `ultrapowers:ultrapowers` (this plan carries ultraplan markers). Sequential fallback: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add toggleable trailing moving-average trend lines (3-month default, 6-month available) and a baseline reference line to the PPI series chart, all derived at build time from the CSV.

**Architecture:** Extend the existing Recharts `IndicatorChart` (rendering) and its client wrapper `ChartWithRange` (interaction) rather than porting the standalone prototype. A pure `trailingAverage` helper computes the averages from the raw values; a new `baseline` metadata field drives the reference line. No trend value is ever stored — only raw monthly numbers live in the CSV.

**Tech Stack:** Next.js 15, React 18, TypeScript, Recharts, bun test.

## Global Constraints

- **Derived, never stored** — no trend/average value in `data/` or the registry; every trailing average is computed from the CSV at build time (STANDARDS.md §9). `baseline` is the only chart constant that is declared rather than derived.
- **Trailing, not centered** — a trend point is the mean of that month and the months before it, never after. This preserves the "a dip here is a reaction to what came before" reading (release-lag convention).
- **Light theme only** — the dashboard is the light FRED style; ignore the prototype's dark theme.
- **PPI-only in this plan** — the mechanism is generic, but only PPI enables trends and only PPI carries a `baseline` here. Other series are a later pass.
- **Axis unchanged** — points stay labeled by row date (release-lag); this is intentional and wanted.
- **No new dependencies** — extend the existing Recharts chart; do not add a charting or component-test library.
- Test runner is `bun test`; run the suite with `npm test`.

---

### Task 1: `trailingAverage` helper

**Type:** implementation
**Depends-on:** none
**Review:** adversarial

**Files:**
- Modify: `lib/utils.ts`
- Test: `lib/trailing-average.test.ts`

**Interfaces:**
- Produces: `trailingAverage(values: number[], window: number): (number | null)[]`

**Parallelization rationale:** the correctness-critical math is a pure function in its own file, independent of both the metadata change and the chart rendering — isolating it lets the numeric behavior be reviewed and tested on its own, which a good engineer would do regardless of parallelism.

- [ ] **Step 1: Write the failing test**

```ts
// lib/trailing-average.test.ts
import { test, expect } from "bun:test";
import { trailingAverage } from "./utils";

test("returns null until the window is full, then the trailing mean", () => {
  // window 3 over four points: first two null, then means of the last-3.
  expect(trailingAverage([1, 2, 3, 4], 3)).toEqual([null, null, 2, 3]);
});

test("computes PPI's real 3-month trend at the last three points", () => {
  // From data/ppi.csv (…,103.75,100,93.75,96.25,83.75). Trailing 3-month:
  // May = mean(103.75,100,93.75)=99.1666…, Jun = mean(100,93.75,96.25)=96.6666…,
  // Jul = mean(93.75,96.25,83.75)=91.25.
  const tail = trailingAverage([103.75, 100, 93.75, 96.25, 83.75], 3);
  expect(tail[2]).toBeCloseTo(99.1667, 3);
  expect(tail[3]).toBeCloseTo(96.6667, 3);
  expect(tail[4]).toBe(91.25);
});

test("a window of 1 is the series itself", () => {
  expect(trailingAverage([5, 6, 7], 1)).toEqual([5, 6, 7]);
});

test("a window longer than the series is all null", () => {
  expect(trailingAverage([1, 2], 6)).toEqual([null, null]);
});

test("empty input yields empty output", () => {
  expect(trailingAverage([], 3)).toEqual([]);
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `bun test lib/trailing-average.test.ts`
Expected: FAIL — `trailingAverage` is not exported from `./utils`.

- [ ] **Step 3: Implement the helper**

Add to `lib/utils.ts`:

```ts
/**
 * Trailing simple moving average, aligned to the input.
 *
 * Each output point is the mean of that value and the `window - 1` values
 * before it; points without enough history are `null`, so a chart line begins
 * only where the average is real. Trailing (not centered) on purpose: a point
 * never averages in data from after it, which keeps the release-lag reading
 * intact — a movement here summarises the run ending here (STANDARDS.md §9,
 * issue #1). Nothing is stored; this runs over the raw CSV values at build time.
 */
export function trailingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) =>
    i < window - 1
      ? null
      : values.slice(i - window + 1, i + 1).reduce((sum, v) => sum + v, 0) / window,
  );
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `bun test lib/trailing-average.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts lib/trailing-average.test.ts
git commit -m "feat: trailingAverage helper for chart trend lines (#1)"
```

---

### Task 2: `baseline` metadata field

**Type:** implementation
**Depends-on:** none

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/indicators.ts`
- Test: `lib/baseline.test.ts`

**Interfaces:**
- Produces: `IndicatorMetadata.baseline?: number` (registry field; set to `100` on `ppi`, absent elsewhere)

**Parallelization rationale:** the reference-line value belongs in series metadata rather than a literal in the chart (STANDARDS.md §8, which required a `baseline` field that was never implemented); making it a typed registry field is a data-model change independent of the helper and the rendering, and is worth doing on its own.

- [ ] **Step 1: Write the failing test**

```ts
// lib/baseline.test.ts
import { test, expect } from "bun:test";
import { INDICATOR_REGISTRY } from "./indicators";

test("PPI declares a baseline of 100", () => {
  expect(INDICATOR_REGISTRY.ppi.baseline).toBe(100);
});

test("count/point series declare no baseline — a line at 100 would be meaningless", () => {
  // KBER is Total Notes, LMV is Points; 100 is not a reference on those scales.
  expect(INDICATOR_REGISTRY["knowledge-expansion"].baseline).toBeUndefined();
  expect(INDICATOR_REGISTRY["completion-rate"].baseline).toBeUndefined();
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `bun test lib/baseline.test.ts`
Expected: FAIL — `INDICATOR_REGISTRY.ppi.baseline` is `undefined` (property does not exist yet).

- [ ] **Step 3: Add the type field**

In `lib/types.ts`, inside `interface IndicatorMetadata`, immediately after the `precision: number;` field, add:

```ts
  /**
   * The value the reference line marks — what "100" (or any anchor) means for
   * this series. Declared, not derived: a baseline is a fixed reference set once
   * (STANDARDS.md §8). Absent on series with no meaningful baseline (counts,
   * point totals), where no reference line is drawn.
   */
  baseline?: number;
```

- [ ] **Step 4: Set PPI's baseline in the registry**

In `lib/indicators.ts`, in the `"ppi"` registry entry, immediately after the `precision: 1,` line, add:

```ts
    baseline: 100,
```

Do not add `baseline` to any other entry in this plan — PPI only.

- [ ] **Step 5: Run the test, verify it passes**

Run: `bun test lib/baseline.test.ts && npx tsc --noEmit`
Expected: PASS (2 tests); tsc clean (the field is optional, so the other five entries need no change).

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/indicators.ts lib/baseline.test.ts
git commit -m "feat: baseline metadata field, PPI=100 (#1, STANDARDS §8)"
```

---

### Task 3: Render trend lines and baseline in `IndicatorChart`

**Type:** implementation
**Depends-on:** none

**Files:**
- Modify: `components/IndicatorChart.tsx`

**Interfaces:**
- Produces: `TrendLine` type `{ key: string; label: string; color: string; dash?: string }`; extended `IndicatorChart` props `{ data, color, unit, trends?: TrendLine[], baseline?: number }` where each `data` point may carry numeric values under the `key` names in `trends`.

**Parallelization rationale:** the rendering contract (what props the chart accepts and how it draws overlays + a reference line) is a self-contained view change that defines the interface its wrapper builds against; fixing it up front lets the wrapper task build to a known shape, and it is a coherent unit a good engineer would isolate.

- [ ] **Step 1: Add `ReferenceLine` to the Recharts import**

In `components/IndicatorChart.tsx`, change the import on line 3 to include `ReferenceLine`:

```tsx
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
```

- [ ] **Step 2: Add the `TrendLine` type and extend the props**

Replace the `IndicatorChartProps` interface (lines 7–11) with:

```tsx
export interface TrendLine {
  key: string;    // the numeric field on each data point, e.g. "ma3"
  label: string;  // legend/tooltip label, e.g. "3-month trend"
  color: string;
  dash?: string;  // strokeDasharray, e.g. "5 4" for the 6-month line
}

interface IndicatorChartProps {
  data: (DataPoint & Record<string, number | null | undefined>)[];
  color: string;
  unit: string;
  trends?: TrendLine[];
  baseline?: number;
}
```

- [ ] **Step 3: Accept the new props and de-emphasise the raw line when a trend is shown**

Change the function signature (line 13) to:

```tsx
export default function IndicatorChart({ data, color, unit, trends, baseline }: IndicatorChartProps) {
```

Then, immediately before the `return (` statement, add:

```tsx
  // When a smoothed trend is on, the raw series steps back so the trend reads as
  // the signal rather than competing with it.
  const hasTrends = (trends?.length ?? 0) > 0;
  const rawStrokeWidth = hasTrends ? 1.5 : 3;
  const rawDotRadius = hasTrends ? 2 : 4;
```

- [ ] **Step 4: Draw the baseline reference line**

Immediately after the `<CartesianGrid ... />` element (line 45), add:

```tsx
          {typeof baseline === "number" && (
            <ReferenceLine
              yAxisId="left"
              y={baseline}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              label={{ value: `Baseline ${baseline}`, position: "insideTopLeft", fill: "#9ca3af", fontSize: 11 }}
            />
          )}
```

- [ ] **Step 5: Apply the de-emphasis to the raw line and draw the trend lines**

Replace the raw `<Line ... />` element (lines 94–103) with:

```tsx
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="value"
            name={unit}
            stroke={color}
            strokeWidth={rawStrokeWidth}
            dot={{ fill: color, r: rawDotRadius }}
            activeDot={{ r: 6 }}
          />
          {trends?.map((t) => (
            <Line
              key={t.key}
              yAxisId="left"
              type="monotone"
              dataKey={t.key}
              name={t.label}
              stroke={t.color}
              strokeWidth={2}
              strokeDasharray={t.dash}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          ))}
```

- [ ] **Step 6: Verify typecheck and build**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|error"`
Expected: tsc clean; `✓ Compiled successfully`. (No behavior change yet — no caller passes `trends`/`baseline`, so every existing chart renders exactly as before.)

- [ ] **Step 7: Commit**

```bash
git add components/IndicatorChart.tsx
git commit -m "feat: IndicatorChart renders trend overlays + baseline line (#1)"
```

---

### Task 4: Trend toggles, asterisk, and PPI wiring

**Type:** implementation
**Depends-on:** 1, 2, 3

**Files:**
- Modify: `components/ChartWithRange.tsx`
- Modify: `app/(site)/series/[id]/page.tsx`

**Interfaces:**
- Consumes: `trailingAverage(values, window)` (Task 1); `IndicatorMetadata.baseline` (Task 2); `IndicatorChart` props `{ trends, baseline }` and the `TrendLine` type (Task 3).
- Produces: `ChartWithRange` props extended with `{ enableTrends?: boolean; baseline?: number }`.

- [ ] **Step 1: Rewrite `ChartWithRange` to compute trends, hold toggle state, and render chips + asterisk**

Replace the entire contents of `components/ChartWithRange.tsx` with:

```tsx
"use client";

import { useState } from "react";
import IndicatorChart, { type TrendLine } from "@/components/IndicatorChart";
import { windowByMonths, trailingAverage } from "@/lib/utils";
import type { DataPoint } from "@/lib/types";

const RANGES: { label: string; months: number }[] = [
  { label: "ALL", months: Infinity },
  { label: "1Y", months: 12 },
  { label: "6M", months: 6 },
  { label: "3M", months: 3 },
];

// Trailing-average overlays. 3-month is on by default; 6-month is opt-in. Windows
// are computed over the FULL series, then the range clips the view — so a 6-month
// trend stays correct even when the range is narrowed below six months (#1).
const TREND_DEFS: (TrendLine & { months: number; defaultOn: boolean })[] = [
  { key: "ma3", label: "3-month trend", months: 3, color: "#f59e0b", defaultOn: true },
  { key: "ma6", label: "6-month trend", months: 6, color: "#6b7280", dash: "5 4", defaultOn: false },
];

export default function ChartWithRange({
  title, data, color, unit, enableTrends = false, baseline,
}: {
  title: string;
  data: DataPoint[];
  color: string;
  unit: string;
  enableTrends?: boolean;
  baseline?: number;
}) {
  const [range, setRange] = useState("ALL");
  const [activeTrends, setActiveTrends] = useState<string[]>(
    enableTrends ? TREND_DEFS.filter((t) => t.defaultOn).map((t) => t.key) : [],
  );

  const months = RANGES.find((r) => r.label === range)?.months ?? Infinity;

  // Attach every trend value to each point (computed over the full series), then
  // window. Nothing is stored — this derives from the raw values at render time.
  const values = data.map((p) => p.value);
  const withTrends = data.map((p, i) => {
    const point: DataPoint & Record<string, number | null> = { ...p };
    if (enableTrends) {
      for (const t of TREND_DEFS) point[t.key] = trailingAverage(values, t.months)[i]!;
    }
    return point;
  });
  const filtered = windowByMonths(withTrends, months);

  const shownTrends: TrendLine[] = enableTrends
    ? TREND_DEFS.filter((t) => activeTrends.includes(t.key)).map(({ key, label, color, dash }) => ({ key, label, color, dash }))
    : [];

  const toggleTrend = (key: string) =>
    setActiveTrends((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex space-x-2 text-sm">
          {RANGES.map((r) => {
            // Hide ranges that don't shorten the available data (e.g. 1Y when <12 pts)
            if (r.months !== Infinity && data.length <= r.months) return null;
            const active = r.label === range;
            return (
              <button
                key={r.label}
                onClick={() => setRange(r.label)}
                className={
                  active
                    ? "px-3 py-1 rounded-md bg-primary text-white font-medium"
                    : "px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100"
                }
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {enableTrends && (
        <div className="flex items-center space-x-2 text-sm mb-4">
          <span className="text-gray-500">Trend*:</span>
          {TREND_DEFS.map((t) => {
            const on = activeTrends.includes(t.key);
            return (
              <button
                key={t.key}
                onClick={() => toggleTrend(t.key)}
                className={
                  on
                    ? "px-3 py-1 rounded-md font-medium text-white"
                    : "px-3 py-1 rounded-md text-gray-600 border border-gray-300 hover:bg-gray-100"
                }
                style={on ? { backgroundColor: t.color } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <IndicatorChart data={filtered} color={color} unit={unit} trends={shownTrends} baseline={baseline} />

      {enableTrends && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          <strong>* Trend lines are trailing simple moving averages.</strong> Each point is the mean of
          that month and the months before it — the 3-month trend at July 2026 averages the May, June and
          July rows, which under MIKE&apos;s release lag are April, May and June actuals. A trend summarises
          the run <em>ending</em> at each point, never data from after it, so the 3-month line begins at the
          third point and the 6-month at the sixth.
        </p>
      )}
    </>
  );
}
```

- [ ] **Step 2: Enable trends and pass the baseline for PPI at the call site**

In `app/(site)/series/[id]/page.tsx`, replace the `ChartWithRange` element (line 107):

```tsx
        <ChartWithRange title="Historical Data" data={indicator.data} color={indicator.color} unit={indicator.unit} />
```

with:

```tsx
        <ChartWithRange
          title="Historical Data"
          data={indicator.data}
          color={indicator.color}
          unit={indicator.unit}
          enableTrends={indicator.id === "ppi"}
          baseline={indicator.baseline}
        />
```

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|error"`
Expected: tsc clean; `✓ Compiled successfully`.

- [ ] **Step 4: Verify the existing suite is unaffected**

Run: `npm test 2>&1 | grep -E "^ [0-9]+ (pass|fail)"`
Expected: all pass, 0 fail (the trailingAverage and baseline tests from Tasks 1–2 included).

- [ ] **Step 5: Verify in the browser**

Run `npm run dev`, open `http://localhost:3000/series/ppi`, and confirm:
- a dotted "Baseline 100" reference line is drawn;
- a "Trend*:" row shows "3-month trend" (active, amber) and "6-month trend" (inactive);
- the amber 3-month line is present and starts at the third point, the raw line is thinner;
- clicking "6-month trend" adds a grey dashed line starting at the sixth point; clicking again removes it;
- narrowing Range to 3M still shows the trend lines' last points (computed over the full series);
- open `http://localhost:3000/series/phi` and confirm it has **no** Trend row and **no** baseline line (PPI-only).

- [ ] **Step 6: Commit**

```bash
git add components/ChartWithRange.tsx "app/(site)/series/[id]/page.tsx"
git commit -m "feat: toggleable PPI trend lines + baseline + asterisk (#1)"
```

---

## Acceptance

**Acceptance:** waived — small, read-review feature: the operator reviews every diff inline, and the correctness-critical math (`trailingAverage`) is pinned by unit tests with a worked example from the real PPI series. Client-component wiring is verified by tsc, build, and the browser checklist in Task 4 Step 5, consistent with this repo's other client components (no component-test harness exists, and this plan adds no dependency).
