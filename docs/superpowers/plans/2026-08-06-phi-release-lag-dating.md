# PHI Release-Lag Dating Implementation Plan

> **For agentic workers:** Parallel execution: use `ultrapowers:ultrapowers` (this plan carries ultraplan markers). Sequential fallback: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move PHI from `data-month` to `release-lag` dating so its rows line up with the other five MIKE indicators, without changing a single published value.

**Architecture:** Shift all 43 data rows in `data/phi.csv` forward one month and flip one typed field on the indicator registry. Because the registry field is the single source read by the site, the API, the next-release derivation, and the monthly append script, no other production logic changes except a now-obsolete alignment shim in `loadPhiOverlap()`. Correctness is pinned by a characterization test written first, which asserts each PHI observation's measured `period` and must pass identically before and after the change.

**Tech Stack:** Next.js 15, TypeScript, Bun test runner, CSV data files, Python 3 for the one-shot date shift.

**Acceptance:** suite — the period-invariance pin authored in Task 1 passes both before and after the change by construction, which is a more direct check than a held-out exam for a pure re-dating, and the operator reads the full diff. Seal on request if this is routed to `/ultrapowers`.

## Global Constraints

- **No published value changes.** After the date field, every byte of `data/phi.csv` is identical to its current content, values and note text alike. Task 2 verifies this mechanically.
- **`data/phi-classic.csv` is not touched.** The retired vintage was always `release-lag` and is already aligned.
- **The `data-month` machinery stays.** The type union, the row-date helper, `observationPeriod`, and the append script's month-completeness guard all remain, supported but unused by any current series.
- **No user-facing disclosure.** Mike's call, 2026-08-06: this is a display fix. Do not add a dated note, a banner, or an API changelog entry. Internal docs are still corrected, because a doc claiming PHI is data-month is false once this ships.
- **PHI's `nextUpdate` must remain `2026-09-01`** across the whole change.
- **No em dashes in any new prose.** Match the surrounding file's existing style otherwise.

---

### Task 1: Pin the measured period as an invariant

**Type:** implementation
**Depends-on:** none

**Files:**
- Create: `lib/phi-convention.test.ts`

**Interfaces:**
- Consumes: `loadIndicatorData(id: IndicatorId): Promise<Indicator>` and `loadPhiOverlap(): Promise<{date: string; phi2: number | null; classic: number | null}[]>` from `lib/indicators.ts`; `observationPeriod(date: string, convention: "release-lag" | "data-month"): {start: string; end: string}` from `lib/api/documents.ts`
- Produces: no exported symbols; a regression pin other tasks must keep green

This test is a characterization pin for a refactor, not red-green TDD. It asserts what PHI *measures*, derived through the same convention-aware code path the public API uses. Under the current `data-month` dating and under the coming `release-lag` dating it computes the same answer, so it passes at both ends and fails loudly if the shift and the flip ever disagree by a month.

- [ ] **Step 1: Write the pin**

Create `lib/phi-convention.test.ts`:

```typescript
/**
 * PHI's measured periods are invariant under its date convention.
 *
 * PHI moved from data-month to release-lag dating in 2026-08 so its rows line up
 * with the other five series. That change re-dates every row but must not move a
 * single measured month. STANDARDS.md §3 tells consumers to align on `period`,
 * never on `date` — so this asserts the periods, which makes it pass identically
 * before and after the shift. If the CSV shift and the registry flip ever
 * disagree by a month, every assertion here moves at once.
 */

import { test, expect } from "bun:test";
import { loadIndicatorData, loadPhiOverlap } from "./indicators";
import { observationPeriod } from "./api/documents";

test("PHI measures a contiguous run of months from 2023-01 to 2026-07", async () => {
  const phi = await loadIndicatorData("phi");
  const periods = phi.data.map((p) => observationPeriod(p.date, phi.dateConvention).start);

  expect(periods.length).toBe(43);
  expect(periods[0]).toBe("2023-01-01");
  expect(periods[periods.length - 1]).toBe("2026-07-01");

  // No gaps and no repeats: each period is exactly one month after the last.
  const gaps: string[] = [];
  for (let i = 1; i < periods.length; i++) {
    const [py, pm] = periods[i - 1]!.split("-").map(Number) as [number, number];
    const expected = pm === 12 ? `${py + 1}-01-01` : `${py}-${String(pm + 1).padStart(2, "0")}-01`;
    if (periods[i] !== expected) gaps.push(`${periods[i - 1]} -> ${periods[i]}`);
  }
  expect(gaps).toEqual([]);
});

test("each PHI value stays attached to the month it measures", async () => {
  const phi = await loadIndicatorData("phi");
  const byPeriod = new Map(
    phi.data.map((p) => [observationPeriod(p.date, phi.dateConvention).start, p.value]),
  );

  // Spot checks across the span, including the two most recently published rows.
  expect(byPeriod.get("2023-01-01")).toBe(112.4);
  expect(byPeriod.get("2026-05-01")).toBe(113.2);
  expect(byPeriod.get("2026-06-01")).toBe(106.0);
  expect(byPeriod.get("2026-07-01")).toBe(111.6);
});

test("PHI's next update is unmoved by the convention", async () => {
  const phi = await loadIndicatorData("phi");
  expect(phi.nextUpdate).toBe("2026-09-01");
});

test("the PHI-Classic overlap pairs the same two values", async () => {
  // The overlap chart aligns PHI 2.0 against the retired vintage. The pairing is
  // what the methodology report shows; only the x-axis label moves.
  const overlap = await loadPhiOverlap();
  const paired = overlap.filter((p) => p.phi2 !== null && p.classic !== null);

  // PHI-Classic ran Oct 2025 to Jul 2026 on a release lag, which is ten months of
  // overlap against PHI 2.0. Only the x-axis label moves; the pairs do not.
  expect(paired.length).toBe(10);
  expect(paired.slice(-3).map((p) => [p.phi2, p.classic])).toEqual([
    [101.6, 102.8],
    [113.2, 114.3],
    [106.0, 119.5],
  ]);
});
```

- [ ] **Step 2: Run it against the current code and verify it PASSES**

Run: `cd ~/Projects/mike-fred && bun test lib/phi-convention.test.ts`
Expected: PASS, 4 tests. This is the point of the task. A failure here means the pin's literals are wrong, not that the code is; correct the literals against the current `data/phi.csv` and re-run.

If the fourth test fails, print the current pairing with
`bun -e 'import("./lib/indicators.ts").then(async m => console.log((await m.loadPhiOverlap()).filter(p => p.phi2 !== null && p.classic !== null)))'`
and use the real values. Do not change the assertion to be loose; the exact pairing is the thing being pinned.

- [ ] **Step 3: Run the full suite to confirm a green baseline**

Run: `cd ~/Projects/mike-fred && bun test`
Expected: PASS, all files. Record the pass count in the commit message; later tasks compare against it.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/mike-fred
git add lib/phi-convention.test.ts
git commit -m "Pin PHI's measured periods before the convention change

The periods are what the API promises consumers align on, so they must not
move when the row dates do. Passing now and after the shift is the point."
```

---

### Task 2: Shift the data and flip the convention

**Type:** implementation
**Depends-on:** 1
**Review:** adversarial

**Files:**
- Modify: `data/phi.csv`
- Modify: `lib/indicators.ts:95,99,206-229,269-286`
- Modify: `lib/conventions.test.ts:27-30,43-54`
- Modify: `lib/release-schedule.test.ts:44-49`

**Interfaces:**
- Consumes: the period-invariance pin from the task that characterizes PHI's measured months
- Produces: `rowDateFor(convention: "release-lag" | "data-month", releaseMonth: string): string`, a pure helper that `rowDateForRelease(id, releaseMonth)` now delegates to

**Parallelization rationale:** none. The data shift, the registry flip, and the two convention-pinned test files are one atomic change; the suite is red at any intermediate state, so splitting them would only manufacture a broken commit.

The `rowDateFor` extraction is not parallelism-driven: once no series is `data-month`, that branch of `rowDateForRelease` is unreachable through its own signature and its two tests become untestable. Extracting the pure helper keeps a supported branch covered without mutating a registry in a test.

- [ ] **Step 1: Shift every date in `data/phi.csv` forward one month**

```bash
cd ~/Projects/mike-fred
python3 - <<'PY'
path = "data/phi.csv"
lines = open(path).read().split("\n")
out = [lines[0]]
for line in lines[1:]:
    if not line.strip():
        out.append(line)
        continue
    date, rest = line.split(",", 1)
    y, m, _ = date.split("-")
    y, m = int(y), int(m)
    m += 1
    if m == 13:
        m, y = 1, y + 1
    out.append(f"{y:04d}-{m:02d}-01,{rest}")
open(path, "w").write("\n".join(out))
PY
```

- [ ] **Step 2: Verify nothing but the date changed**

```bash
cd ~/Projects/mike-fred
diff <(git show HEAD:data/phi.csv | cut -d, -f2-) <(cut -d, -f2- data/phi.csv) \
  && echo "OK: values and notes byte-identical"
head -2 data/phi.csv; tail -1 data/phi.csv
```
Expected: `OK: values and notes byte-identical`, first data row `2023-02-01,112.4,...`, last row `2026-08-01,111.6,...`.
If the diff is non-empty, `git checkout data/phi.csv` and re-run Step 1. Do not hand-edit.

- [ ] **Step 3: Flip the registry field**

In `lib/indicators.ts`, inside the `"phi"` block only, change:

```typescript
    dateConvention: "data-month",
```
to:
```typescript
    dateConvention: "release-lag",
```

The other five blocks already read `"release-lag"`; make sure the edit lands in the block whose `id` is `"phi"` (around line 99).

- [ ] **Step 4: Correct the `calculation` prose in the same block**

In the `"phi"` block, replace this fragment of the `calculation` string:

```
Series starts 2023-01 (Apple Watch sleep-stage tracking availability).
```
with:
```
Data begins 2023-01 (Apple Watch sleep-stage tracking availability); rows carry the release-lag date, so the first row is 2023-02.
```

- [ ] **Step 5: Drop the now-wrong alignment shim in `loadPhiOverlap`**

Replace the doc comment and function (currently lines 206-229) with:

```typescript
/**
 * Load PHI 2.0 and the preserved PHI-Classic vintage, merged for the methodology
 * overlap chart. Both series are release-lag, so a shared row date already means a
 * shared measured month and the merge is a plain join. PHI 2.0 was data-month until
 * 2026-08 and this function shifted PHI-Classic back a month to compensate; the
 * shift is gone because there is nothing left to compensate for.
 */
export async function loadPhiOverlap(): Promise<{ date: string; phi2: number | null; classic: number | null }[]> {
  const dir = path.join(process.cwd(), "data");
  const phi2 = await parseCSV(path.join(dir, "phi.csv"));
  const classic = await parseCSV(path.join(dir, "phi-classic.csv"));
  const map = new Map<string, { phi2: number | null; classic: number | null }>();
  for (const p of phi2) map.set(p.date.slice(0, 7), { phi2: p.value, classic: null });
  for (const p of classic) {
    const dm = p.date.slice(0, 7);
    const cur = map.get(dm) || { phi2: null, classic: null };
    cur.classic = p.value;
    map.set(dm, cur);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));
}
```

- [ ] **Step 6: Extract `rowDateFor` so the data-month branch stays testable**

Replace the `rowDateForRelease` doc comment and body (currently lines 269-286) with:

```typescript
/**
 * The row date a convention uses for the release published in `releaseMonth` (YYYY-MM).
 *
 * Split from `rowDateForRelease` so the `data-month` branch stays reachable in tests.
 * As of 2026-08 no series declares `data-month`, so routing every test through the
 * registry would leave a supported branch uncovered until the next series needs it.
 *
 *   rowDateFor("release-lag", "2026-08")  ->  "2026-08-01"   (August release, July data)
 *   rowDateFor("data-month",  "2026-08")  ->  "2026-07-01"   (same data, dated by month)
 */
export function rowDateFor(
  convention: IndicatorMetadata["dateConvention"],
  releaseMonth: string,
): string {
  const [year, month] = releaseMonth.split("-").map(Number) as [number, number];
  if (convention === "release-lag") {
    return `${releaseMonth}-01`;
  }
  const d = new Date(Date.UTC(year, month - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * The row date a series uses for the release published in `releaseMonth` (YYYY-MM).
 *
 * Single source of truth for the monthly write path: the append script calls this
 * rather than assuming one convention for all six series (#12).
 *
 *   rowDateForRelease("ppi", "2026-08")  ->  "2026-08-01"   (August release, July data)
 */
export function rowDateForRelease(id: IndicatorId, releaseMonth: string): string {
  return rowDateFor(INDICATOR_REGISTRY[id].dateConvention, releaseMonth);
}
```

- [ ] **Step 7: Retarget the convention-pinned tests**

In `lib/conventions.test.ts`, add `rowDateFor` to the existing import from `./indicators`:

```typescript
import { INDICATOR_REGISTRY, rowDateFor, rowDateForRelease, nextReleaseDate } from "./indicators";
```

Replace this test:

```typescript
test("PHI is the data-month series; the other five are release-lag", () => {
  const byConvention = IDS.filter((id) => INDICATOR_REGISTRY[id].dateConvention === "data-month");
  expect(byConvention).toEqual(["phi"]);
});
```
with:
```typescript
test("every series is release-lag", () => {
  // PHI was the lone data-month series until 2026-08, when it was re-dated to line
  // up with the other five. The convention is still supported and still typed; this
  // fails loudly if a seventh series arrives on the other one without a decision.
  const offenders = IDS.filter((id) => INDICATOR_REGISTRY[id].dateConvention !== "release-lag");
  expect(offenders).toEqual([]);
});
```

Replace these three tests:

```typescript
test("a data-month series dates its row by the month it measures", () => {
  // The August release reports July; PHI dates that row July.
  expect(rowDateForRelease("phi", "2026-08")).toBe("2026-07-01");
});

test("a data-month row date crosses the year boundary", () => {
  expect(rowDateForRelease("phi", "2026-01")).toBe("2025-12-01");
});

test("the two conventions disagree by exactly one month for the same release", () => {
  expect(rowDateForRelease("ppi", "2026-08")).not.toBe(rowDateForRelease("phi", "2026-08"));
});
```
with:
```typescript
test("a data-month convention dates its row by the month it measures", () => {
  // The August release reports July; a data-month series dates that row July.
  expect(rowDateFor("data-month", "2026-08")).toBe("2026-07-01");
});

test("a data-month row date crosses the year boundary", () => {
  expect(rowDateFor("data-month", "2026-01")).toBe("2025-12-01");
});

test("the two conventions disagree by exactly one month for the same release", () => {
  expect(rowDateFor("release-lag", "2026-08")).not.toBe(rowDateFor("data-month", "2026-08"));
});
```

Leave every other test in the file alone. In particular `nextReleaseDate("2026-06-01", "monthly", "data-month")` takes a literal convention and still passes.

- [ ] **Step 8: Retarget the PHI release-schedule test**

In `lib/release-schedule.test.ts`, replace:

```typescript
test("PHI no longer advertises an October release", async () => {
  const phi = await loadIndicatorData("phi");

  expect(phi.nextUpdate).not.toBe("2026-10-01");
  expect(phi.nextUpdate).toBe(nextReleaseDate(phi.lastUpdate, "monthly", "data-month"));
});
```
with:
```typescript
test("PHI no longer advertises an October release", async () => {
  const phi = await loadIndicatorData("phi");

  expect(phi.nextUpdate).not.toBe("2026-10-01");
  expect(phi.nextUpdate).toBe(nextReleaseDate(phi.lastUpdate, "monthly", "release-lag"));
});
```

- [ ] **Step 9: Run the pin, then the full suite**

Run: `cd ~/Projects/mike-fred && bun test lib/phi-convention.test.ts && bun test`
Expected: the pin PASSES unchanged (4 tests), then the full suite PASSES at the same count recorded in Task 1 Step 3.

If the pin fails on periods, the CSV shift and the registry flip disagree: confirm Step 2 printed `2026-08-01` as the last row date and that Step 3 landed inside the `"phi"` block.

- [ ] **Step 10: Confirm the numbers a reader sees**

```bash
cd ~/Projects/mike-fred
bun -e 'import("./lib/indicators.ts").then(async m => { const p = await m.loadIndicatorData("phi"); console.log(p.lastUpdate, p.nextUpdate, p.currentValue, p.previousValue); })'
```
Expected: `2026-08-01 2026-09-01 111.6 106`. The last-update month now matches the other five series, the next update has not moved, and the values are untouched.

- [ ] **Step 11: Commit**

```bash
cd ~/Projects/mike-fred
git add data/phi.csv lib/indicators.ts lib/conventions.test.ts lib/release-schedule.test.ts
git commit -m "Move PHI to release-lag dating

PHI was the only data-month series, so its rows sat a month behind the other
five on every chart and card. All 43 rows shift forward one month and the
registry field flips; no value or note changes, and every observation's
measured period is identical, which is what the API tells consumers to align
on. The PHI-Classic overlap shim is gone because both series now share a
convention, and rowDateFor keeps the data-month branch covered."
```

---

### Task 3: Correct the docs that name PHI as data-month

**Type:** implementation
**Depends-on:** none

**Files:**
- Modify: `STANDARDS.md:54,81`
- Modify: `CLAUDE.md:40,126,143-148`
- Modify: `README.md:81`
- Modify: `data/SOURCES.md:19`
- Modify: `lib/api/vintages.ts:5-8`
- Modify: `components/PhiOverlapChart.tsx:8,34-37`
- Modify: `lib/types.ts:39-41`
- Modify: `scripts/mike-fred-append-month.sh:13-19`

**Interfaces:**
- Consumes: nothing
- Produces: nothing

These files only describe the convention; none of them reads it. They share no file with any other task and can be corrected independently. Write them in the end state: PHI is release-lag, and the `data-month` convention remains supported with no current series using it.

- [ ] **Step 1: `STANDARDS.md`**

Replace:
```
PHI 2.0 instead uses **data-month** dating, where the row date is the month measured.
Both conventions are legitimate; leaving a consumer to guess which is in play is not.
```
with:
```
A second convention, **data-month** dating, puts the row date on the month measured.
PHI 2.0 used it until 2026-08; no series uses it today, and it remains supported.
Both conventions are legitimate; leaving a consumer to guess which is in play is not.
```

Replace:
```
convention was stated in five places and was wrong in three of them. As of 2026-07,
PHI is the only `data-month` series; the other five are `release-lag`.
```
with:
```
convention was stated in five places and was wrong in three of them. As of 2026-08,
all six series are `release-lag`; PHI moved off `data-month` so the six line up.
```

- [ ] **Step 2: `CLAUDE.md`, the `phi.csv` table row**

Replace the trailing warning in the `phi.csv` row:
```
⚠️ **`phi.csv` is data-month dated** — the row for July's data is dated `2026-07-01`, unlike the five release-lag series. |
```
with:
```
As of 2026-08 it is release-lag dated like every other series: July's data is the `2026-08-01` row. |
```

- [ ] **Step 3: `CLAUDE.md`, the date-conventions block**

Replace:
```
**Date conventions — two of them.** The authoritative source is `INDICATOR_REGISTRY[id].dateConvention` in `lib/indicators.ts`, which both the site and the append script read. Do not restate the rule from memory; check the field.

- **`release-lag`** (PPI, KBER, SCI, PWI, LMV) — a row dated month N reports month **N-1**'s actuals. April's data lives in the `2026-05-01` row. Charts label the x-axis by row date, so a bar reads one month ahead of the data it shows — known and accepted as of 2026-05.
- **`data-month`** (PHI only) — the row is dated the month it **measures**. June's data is the `2026-06-01` row, and no row exists for a month until that month is over.

This split is why `./scripts/mike-fred-append-month.sh --month 2026-08` writes the five release-lag series at `2026-08-01` and PHI at `2026-07-01`. Keep each month's pulse and hours together in the same row.
```
with:
```
**Date conventions — two exist, all six series use one.** The authoritative source is `INDICATOR_REGISTRY[id].dateConvention` in `lib/indicators.ts`, which both the site and the append script read. Do not restate the rule from memory; check the field.

- **`release-lag`** (all six series) — a row dated month N reports month **N-1**'s actuals. April's data lives in the `2026-05-01` row. Charts label the x-axis by row date, so a bar reads one month ahead of the data it shows — known and accepted as of 2026-05.
- **`data-month`** (no current series) — the row is dated the month it **measures**, and no row exists for a month until that month is over. PHI used this until 2026-08, when it was re-dated to line up with the other five. The branch is still supported and still tested; a new series may declare it.

So `./scripts/mike-fred-append-month.sh --month 2026-08` writes all six series at `2026-08-01`. Keep each month's pulse and hours together in the same row.
```

- [ ] **Step 4: `CLAUDE.md`, the annotated-code note**

Replace:
```
- `INDICATOR_REGISTRY.dateConvention` looks redundant until you know the
  convention was stated in prose in five places and wrong in three (#12).
```
with:
```
- `INDICATOR_REGISTRY.dateConvention` looks redundant now that all six series
  share one convention, until you know it was stated in prose in five places
  and wrong in three (#12), and that it is what made re-dating PHI a one-field
  change in 2026-08.
```

- [ ] **Step 5: `README.md`**

Replace:
```
  series; PHI is `data-month`, the rest are `release-lag`).
```
with:
```
  series; all six are `release-lag` as of 2026-08, and `data-month` remains
  supported for a future series).
```

- [ ] **Step 6: `data/SOURCES.md`**

In the indicator table, change the PHI row's Convention cell from `**data-month**` to `release-lag`, so the row reads:

```
| **PHI** Health | Apple Health archive | separate PHI 2.0 generator | — | release-lag |
```

- [ ] **Step 7: `lib/api/vintages.ts` comment**

Replace:
```
 * 2.0 shipped (STANDARDS.md §4). Its convention is release-lag (a row dated
 * month N holds month N-1 data), unlike PHI 2.0's data-month dating.
```
with:
```
 * 2.0 shipped (STANDARDS.md §4). Its convention is release-lag (a row dated
 * month N holds month N-1 data), which PHI 2.0 also adopted in 2026-08.
```

- [ ] **Step 8: `components/PhiOverlapChart.tsx`**

Change the `date` field comment on `OverlapPoint` from:
```typescript
  date: string;     // data-month, YYYY-MM
```
to:
```typescript
  date: string;     // release-lag row month, YYYY-MM
```

Replace the caption paragraph text:
```
        Both series rise together out of the late-2025 trough — the level gap is the re-basing, not a change in
        health. PHI-Classic is shown on its own legacy scale and aligned to data-month (it was published on a
        one-month release lag).
```
with:
```
        Both series rise together out of the late-2025 trough — the level gap is the re-basing, not a change in
        health. PHI-Classic is shown on its own legacy scale. Both series are dated on the same one-month release
        lag, so a point compares the two indices over the same month.
```

- [ ] **Step 9: `lib/types.ts`, the `dateConvention` field docstring**

Replace:
```typescript
   * `release-lag` — the row is dated the month AFTER the data (the 2026-07-01
   *   PPI row reports June). Five of the six series.
   * `data-month` — the row is dated the month it measures (the 2026-06-01 PHI
   *   row IS June). PHI 2.0 only.
```
with:
```typescript
   * `release-lag` — the row is dated the month AFTER the data (the 2026-07-01
   *   PPI row reports June). All six series, since PHI moved over in 2026-08.
   * `data-month` — the row is dated the month it measures. No current series;
   *   PHI 2.0 used it until 2026-08. Still supported and still tested.
```

- [ ] **Step 10: `scripts/mike-fred-append-month.sh`, the runbook header**

This header is what a human reads before running the monthly release, so a stale line here misleads at exactly the wrong moment. Replace:
```
#   release-lag (5 series) - row dated the release month; the 2026-08 release reports July
#                            in a row dated 2026-08-01.
#   data-month  (PHI only)  - row dated the month it MEASURES; that same July data is dated
#                            2026-07-01. PHI rows for an incomplete month are refused.
```
with:
```
#   release-lag (all 6)     - row dated the release month; the 2026-08 release reports July
#                            in a row dated 2026-08-01.
#   data-month  (none now)  - row dated the month it MEASURES; that same July data would be
#                            dated 2026-07-01, and a row for an incomplete month is refused.
#                            PHI used this until 2026-08; the branch is still live for a
#                            future series that declares it.
```

- [ ] **Step 11: Verify no stale claim survives**

```bash
cd ~/Projects/mike-fred
grep -rn "data-month" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=docs --exclude-dir=.superpowers
```
Expected: every remaining hit either describes `data-month` as a supported convention with no current series, is a generic description of the two conventions, or is a test exercising the convention with a literal. No hit may claim PHI is data-month.

Note the deliberately wide sweep: an earlier draft of this step filtered to `*.md` and `*.tsx` and would have missed the stale claims in `lib/types.ts` and the append script, which is how they survived to review.

- [ ] **Step 12: Typecheck and commit**

```bash
cd ~/Projects/mike-fred
bunx tsc --noEmit
git add STANDARDS.md CLAUDE.md README.md data/SOURCES.md lib/api/vintages.ts components/PhiOverlapChart.tsx lib/types.ts scripts/mike-fred-append-month.sh
git commit -m "Docs: PHI is release-lag, data-month is supported but unused

Six files stated PHI was the data-month series. The convention itself stays
documented and supported, because the branch, the helper, and the append
script's completeness guard all survive for a future series."
```

---

### Task 4: Verification gate

**Type:** gate
**Depends-on:** 2, 3

**Files:**
- None. This task writes nothing.

**Interfaces:**
- Consumes: the shipped change from the data/registry task and the docs task
- Produces: nothing

- [ ] **Step 1: Full suite**

Run: `cd ~/Projects/mike-fred && bun test`
Expected: PASS at the count recorded in Task 1 Step 3, including all four assertions in `lib/phi-convention.test.ts`.

- [ ] **Step 2: Typecheck and production build**

Run: `cd ~/Projects/mike-fred && bunx tsc --noEmit && bun run build`
Expected: both succeed. The API documents are prerendered at build time and `buildSeriesDocument` throws on a malformed observation, so a green build is also a data guard.

- [ ] **Step 3: Confirm the published API for PHI**

```bash
cd ~/Projects/mike-fred
cat out/api/v1/series/phi.json 2>/dev/null || find . -path ./node_modules -prune -o -name "phi.json" -print | grep -v data/
```
Then confirm, in the emitted document: `date_convention` is `release-lag`, the last observation has `date: "2026-08-01"` with `period.start: "2026-07-01"` and `period.end: "2026-07-31"`, and `value: 111.6`. The period is the assertion that matters; it is what the current published API already reports for that value.

- [ ] **Step 4: Eyeball the rendered pages**

Run: `cd ~/Projects/mike-fred && bun run dev` and open, in a browser:
- `/` — the PHI card reads the same "Last Updated" month as PPI, KBER, SCI, PWI, LMV.
- `/series/phi` — the chart's rightmost point is labeled Aug 2026, the value is 111.6, and the next update reads Sep 1, 2026.
- `/reports/phi-2.0-methodology` — the overlap chart still renders both lines with the same shape as before, shifted one month right on the x-axis.

Stop the dev server when done.

---

### Task 5: Fix the PHI generator's join in the operations repo

**Type:** manual
**Depends-on:** 4

**Files:**
- Modify: `~/Projects/operations/governance/mike-fred/phi/phi_fit.py:15-17`

**Interfaces:**
- Consumes: `~/Projects/mike-fred/data/phi.csv` in its shifted, release-lag form
- Produces: nothing consumed by other tasks

This is a separate repository, and `phi_fit.py` reads `~/Projects/mike-fred/data/phi.csv` by absolute path. It therefore sees whatever is in the main checkout, not an isolated worktree, so it must run after the mike-fred change is merged to `main`. Wooden owns PHI generation; tell him this landed.

The harness keys published values by the row date's month and joins that map straight against health-archive months extracted from real data months. After the shift every comparison is off by one, silently, which would report a false failure or a false pass on a candidate formula.

Note: the harness README says 42 published rows and the file now holds 43, because July shipped after the harness was written. Do not hardcode either count.

- [ ] **Step 1: Record the current fit statistics**

```bash
cd ~/Projects/operations/governance/mike-fred/phi
python3 phi_fit.py > /tmp/phi_fit_before.txt 2>&1; tail -20 /tmp/phi_fit_before.txt
```
This runs against the already-shifted CSV, so it should look wrong: the printed MAE and worst month will be far off the documented best candidate (MAE 1.88, worst month 5.27). That wrongness is the bug this task fixes. If `phi_monthly.csv` is absent, generate it first per the harness README.

- [ ] **Step 2: Shift the published map back to data months**

Replace:
```python
pub = {}
for r in csv.reader(open(PUBLISHED)):
    if r and len(r[0]) == 10 and r[0][:4].isdigit():
        pub[r[0][:7]] = float(r[1])
```
with:
```python
def data_month(row_date):
    """phi.csv is release-lag as of 2026-08: a row dated month N holds month N-1.

    The extracted health months are real data months, so the published map has to
    be shifted back one month before the two can be joined. Keying this by the raw
    row date silently offsets every comparison by a month, which looks like a bad
    candidate formula rather than a bad join.
    """
    y, m = int(row_date[:4]), int(row_date[5:7])
    m -= 1
    if m == 0:
        m, y = 12, y - 1
    return f"{y:04d}-{m:02d}"

pub = {}
for r in csv.reader(open(PUBLISHED)):
    if r and len(r[0]) == 10 and r[0][:4].isdigit():
        pub[data_month(r[0])] = float(r[1])
```

- [ ] **Step 3: Confirm the fit statistics come back**

```bash
cd ~/Projects/operations/governance/mike-fred/phi
python3 phi_fit.py > /tmp/phi_fit_after.txt 2>&1; tail -20 /tmp/phi_fit_after.txt
diff /tmp/phi_fit_before.txt /tmp/phi_fit_after.txt
```
Expected: the after-run reports the documented best candidate again, MAE near 1.88 with a worst month near 5.27, and the published-row count line is unchanged. The two files must differ; if they are identical, the edit did not take effect.

- [ ] **Step 4: Note the count in the README and commit**

Add to `~/Projects/operations/governance/mike-fred/phi/README.md`, under the acceptance-test description: a generator is correct when it reproduces every published row in `phi.csv`, which is 43 rows as of 2026-08 and grows monthly, and `phi.csv` is release-lag dated so the join runs on data months.

```bash
cd ~/Projects/operations
git add governance/mike-fred/phi/phi_fit.py governance/mike-fred/phi/README.md
git commit -m "PHI harness: join on data months, not row dates

mike-fred moved phi.csv to release-lag dating, so a row dated month N holds
month N-1. Keying the published map by the raw row date offset every
comparison by one month and would have read as a bad candidate formula."
git push
```

- [ ] **Step 5: Tell Wooden**

Post to BBS that `phi.csv` is now release-lag dated like the other five series, that `phi_fit.py`'s join was updated in the same change, and that the row count is 43 and growing rather than the 42 the README used to name.

---

## Notes for whoever builds Q3

The next quarterly report must select PHI's value by observation `period`, not by row date, or it picks up a neighbouring month. No code does that selection today; the quarterly JSON snapshots are hand-authored. This is recorded here deliberately and is not work in this plan.
