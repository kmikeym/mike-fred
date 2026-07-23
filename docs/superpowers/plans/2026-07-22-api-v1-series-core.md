# Machine-Readable API v1 — Series Core Implementation Plan

> **For agentic workers:** Parallel execution: use `ultrapowers:ultrapowers` (this plan carries ultraplan markers). Sequential fallback: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a read-only, agent-facing JSON API at `/api/v1/` for the six MIKE indicators plus the PHI-Classic vintage, generated at build time from the same load path the site uses.

**Architecture:** Next.js **force-static route handlers** under `app/api/v1/` (`export const dynamic = "force-static"` + `generateStaticParams`) prerender to static JSON during `next build` — no generator script, no TS runner, no new dependency, and it runs on Cloudflare's existing Node-20 build (verified by spike: a force-static route importing `loadAllIndicators` prerenders to a static `.body` asset). Document-building logic lives in a pure, unit-tested `lib/api/` library; route handlers are thin wrappers. Validation is enforced two ways: the builders throw on data violations (which fails the prerender, hence the build), and a `bun test` suite asserts the guards for fast local feedback.

**Tech Stack:** Next.js 15 (App Router route handlers), React 18, TypeScript, `bun test`. No new dependencies.

## Global Constraints

- **Generate from the same load path the HTML uses.** Documents are built from `loadAllIndicators()` / `loadIndicatorData()` / `loadPhiOverlap()` in `lib/indicators.ts` — never a parallel data source. A new registry indicator must appear in the API with no second edit.
- **Generated, never committed.** The prerendered JSON lives in the build output (`.next`, `.vercel`), already gitignored. Route-handler *source* is committed; no `public/api` directory, no checked-in JSON.
- **No new dependencies.** No ajv, no tsx, no bun-in-CI. Structure is guaranteed by TypeScript types; data invariants by builder assertions; schema conformance by a hand-rolled required-fields check.
- **Notes are never transformed.** An observation's `notes` is the CSV note verbatim (or `null`), byte-for-byte (STANDARDS.md §7, #2).
- **Dates carry both forms.** Every observation has `date` (publication / row date) and `period` {start,end} (the month measured). Every series declares `date_convention` (`release-lag` | `data-month`). Consumers align on `period` (STANDARDS.md §3, #4).
- **Estimated values are machine-flagged.** An observation whose CSV note begins `ESTIMATED` carries `"estimated": true` (STANDARDS.md §6).
- **Values are JSON numbers or `null`** — never strings, never `0` for missing, never `NaN`/`Infinity` (STANDARDS.md §6).
- **Envelope on every document:** `schema_version` `"1.0.0"`, `generated_at` (ISO 8601 UTC, build time), `commit` (`process.env.CF_PAGES_COMMIT_SHA ?? "unknown"`), `license` `"CC0-1.0"`, `docs` `"https://mike.quarterly.systems/api"` (STANDARDS.md §2).
- **CORS:** `Access-Control-Allow-Origin: *` on `/api/*` via `public/_headers`.
- **Additive-only within v1** (STANDARDS.md §9). Skip `valueSource`/`precision` — internal, not consumption (issue #6 decision 2).
- Test runner is `bun test` (`npm test`). Never run `npm run pages:build` while iterating — it rewrites `package-lock.json` (froze a deploy earlier; see CLAUDE.md).

---

### Task 1: API document types

**Type:** implementation
**Depends-on:** none

**Files:**
- Create: `lib/api/types.ts`
- Test: `lib/api/types.test.ts`

**Interfaces:**
- Produces: types `ApiEnvelope`, `ApiObservation`, `VintageRef`, `SeriesDocument`, `SeriesSummary`, `SeriesListDocument`, `IndexDocument`; and the const `API_ENVELOPE` (`{ schema_version, license, docs }` — the fixed fields).

**Parallelization rationale:** the document shapes are the contract every builder, schema, and route handler is written against; fixing them first lets the builder, schema, and vintage tasks proceed in parallel against a known interface. A good engineer defines the wire types before the code that emits them.

- [ ] **Step 1: Write the failing test**

```ts
// lib/api/types.test.ts
import { test, expect } from "bun:test";
import { API_ENVELOPE } from "./types";

test("the fixed envelope fields match STANDARDS §2", () => {
  expect(API_ENVELOPE.schema_version).toBe("1.0.0");
  expect(API_ENVELOPE.license).toBe("CC0-1.0");
  expect(API_ENVELOPE.docs).toBe("https://mike.quarterly.systems/api");
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `bun test lib/api/types.test.ts`
Expected: FAIL — cannot find module `./types`.

- [ ] **Step 3: Create the types**

```ts
// lib/api/types.ts

/** The fixed envelope fields (STANDARDS.md §2). generated_at and commit are per-build. */
export const API_ENVELOPE = {
  schema_version: "1.0.0",
  license: "CC0-1.0",
  docs: "https://mike.quarterly.systems/api",
} as const;

export interface ApiEnvelope {
  schema_version: string;
  generated_at: string; // ISO 8601 UTC, build time
  commit: string;
  license: string;
  docs: string;
}

export interface ApiObservation {
  date: string; // publication / row date, YYYY-MM-DD
  period: { start: string; end: string }; // the month measured
  value: number | null;
  notes: string | null;
  estimated?: true; // present only when the value is not a measurement (STANDARDS §6)
}

export interface VintageRef {
  id: string;
  superseded_on: string;
  reason: string;
  url: string;
}

export interface SeriesDocument extends ApiEnvelope {
  id: string;
  title: string;
  unit: string;
  frequency: string;
  category: string;
  source: string;
  calculation: string | null;
  baseline: number | null;
  date_convention: "release-lag" | "data-month";
  vintages: VintageRef[];
  observations: ApiObservation[];
}

export interface SeriesSummary {
  id: string;
  title: string;
  unit: string;
  category: string;
  current_value: number | null;
  change: number;
  change_percent: number;
  trend: string;
  last_update: string;
  next_update: string;
  url: string;
}

export interface SeriesListDocument extends ApiEnvelope {
  series: SeriesSummary[];
}

export interface IndexDocument extends ApiEnvelope {
  name: string;
  description: string;
  links: { rel: string; href: string }[];
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `bun test lib/api/types.test.ts && npx tsc --noEmit`
Expected: PASS (1 test); tsc clean.

- [ ] **Step 5: Commit**

```bash
git add lib/api/types.ts lib/api/types.test.ts
git commit -m "feat(api): document types + fixed envelope (#6)"
```

---

### Task 2: Vintage registry

**Type:** implementation
**Depends-on:** 1

**Files:**
- Create: `lib/api/vintages.ts`
- Test: `lib/api/vintages.test.ts`

**Interfaces:**
- Consumes: `VintageRef` (from Task 1).
- Produces: `VINTAGE_META: Record<string, { title: string; unit: string; frequency: string; category: string; source: string; calculation: string | null; baseline: number | null; date_convention: "release-lag" | "data-month" }>` (metadata for series that have no `INDICATOR_REGISTRY` entry — currently just `"phi-classic"`); `vintagesFor(seriesId: string): VintageRef[]` (the vintages a current series supersedes — `phi` → phi-classic, else `[]`); `isVintage(id: string): boolean`; `ALL_SERIES_IDS: string[]` (registry ids + vintage ids, for route `generateStaticParams`).

**Parallelization rationale:** PHI-Classic is a series with a CSV but no registry entry, and the current→retired linkage is data that neither the builders nor the schema own; giving it its own module lets the builder and route tasks consume a single declared source instead of hard-coding "phi-classic" in each. A good engineer models the vintage relationship in one place.

- [ ] **Step 1: Write the failing test**

```ts
// lib/api/vintages.test.ts
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
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `bun test lib/api/vintages.test.ts`
Expected: FAIL — cannot find module `./vintages`.

- [ ] **Step 3: Implement**

```ts
// lib/api/vintages.ts
import { INDICATOR_REGISTRY } from "@/lib/indicators";
import type { VintageRef } from "./types";

/**
 * Metadata for retired series that live as a CSV but have no INDICATOR_REGISTRY
 * entry. PHI-Classic is the legacy sleep/activity/weight index, frozen when PHI
 * 2.0 shipped (STANDARDS.md §4). Its convention is release-lag (a row dated
 * month N holds month N-1 data), unlike PHI 2.0's data-month dating.
 */
export const VINTAGE_META: Record<
  string,
  {
    title: string;
    unit: string;
    frequency: string;
    category: string;
    source: string;
    calculation: string | null;
    baseline: number | null;
    date_convention: "release-lag" | "data-month";
  }
> = {
  "phi-classic": {
    title: "Personal Health Index — Classic (retired)",
    unit: "Index (legacy scale)",
    frequency: "monthly",
    category: "Health & Wellness",
    source: "Manual sleep/activity/weight tally",
    calculation: "sleep% × 0.4 + activity% × 0.35 + weight% × 0.25 (retired 2026-07)",
    baseline: null,
    date_convention: "release-lag",
  },
};

/** The vintages a current series supersedes. */
export function vintagesFor(seriesId: string): VintageRef[] {
  if (seriesId === "phi") {
    return [
      {
        id: "phi-classic",
        superseded_on: "2026-07-04",
        reason: "Rebuilt on Apple Watch recovery/sleep/activity/fitness data (PHI 2.0)",
        url: "/api/v1/series/phi-classic",
      },
    ];
  }
  return [];
}

export function isVintage(id: string): boolean {
  return id in VINTAGE_META;
}

/** Every fetchable series id: current indicators plus retired vintages. */
export const ALL_SERIES_IDS: string[] = [
  ...Object.keys(INDICATOR_REGISTRY),
  ...Object.keys(VINTAGE_META),
];
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `bun test lib/api/vintages.test.ts && npx tsc --noEmit`
Expected: PASS (3 tests); tsc clean.

- [ ] **Step 5: Commit**

```bash
git add lib/api/vintages.ts lib/api/vintages.test.ts
git commit -m "feat(api): vintage registry (phi-classic) + series id list (#6)"
```

---

### Task 3: JSON Schemas

**Type:** implementation
**Depends-on:** 1

**Files:**
- Create: `lib/api/schema.ts`
- Test: `lib/api/schema.test.ts`

**Interfaces:**
- Consumes: the document types (from Task 1), by name only.
- Produces: `SCHEMAS: Record<string, object>` keyed by schema name (`"envelope"`, `"series"`, `"series-list"`, `"index"`); `SCHEMA_NAMES: string[]`; `getSchema(name: string): object | null`; `requiredFields(name: string): string[]` (the `required` array of that schema, for the conformance cross-check in Task 4).

**Parallelization rationale:** the published JSON Schema is the consumer-facing contract and is authored to match the wire types, not the builder code; it depends only on the type shapes, so it can be written alongside the builders rather than after them. A good engineer publishes the schema for an API regardless of how the payload is generated.

- [ ] **Step 1: Write the failing test**

```ts
// lib/api/schema.test.ts
import { test, expect } from "bun:test";
import { SCHEMAS, SCHEMA_NAMES, getSchema, requiredFields } from "./schema";

test("every named schema is a JSON Schema object with a title", () => {
  for (const name of SCHEMA_NAMES) {
    const s = getSchema(name) as any;
    expect(`${name}:${typeof s}`).toBe(`${name}:object`);
    expect(`${name}:${s.$schema ? "ok" : "missing"}`).toBe(`${name}:ok`);
  }
});

test("the series schema requires the envelope + provenance fields", () => {
  const req = requiredFields("series");
  for (const f of ["schema_version", "id", "date_convention", "observations"]) {
    expect(`series requires ${f}: ${req.includes(f)}`).toBe(`series requires ${f}: true`);
  }
});

test("getSchema returns null for an unknown name", () => {
  expect(getSchema("nope")).toBeNull();
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `bun test lib/api/schema.test.ts`
Expected: FAIL — cannot find module `./schema`.

- [ ] **Step 3: Implement**

```ts
// lib/api/schema.ts
// Hand-authored JSON Schema (draft 2020-12) for each document type, published at
// /api/v1/schema/{name}. Authored to match lib/api/types.ts; Task 4's builder
// tests cross-check that real output satisfies requiredFields(...) so the schema
// and the payload cannot silently diverge. No validator dependency — the check is
// a required-fields presence test, and TypeScript guarantees field types.

const ENVELOPE_PROPS = {
  schema_version: { type: "string" },
  generated_at: { type: "string", format: "date-time" },
  commit: { type: "string" },
  license: { type: "string" },
  docs: { type: "string" },
};
const ENVELOPE_REQUIRED = ["schema_version", "generated_at", "commit", "license", "docs"];

export const SCHEMAS: Record<string, object> = {
  series: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "MIKE series document",
    type: "object",
    required: [...ENVELOPE_REQUIRED, "id", "title", "unit", "date_convention", "observations"],
    properties: {
      ...ENVELOPE_PROPS,
      id: { type: "string" },
      title: { type: "string" },
      unit: { type: "string" },
      frequency: { type: "string" },
      category: { type: "string" },
      source: { type: "string" },
      calculation: { type: ["string", "null"] },
      baseline: { type: ["number", "null"] },
      date_convention: { enum: ["release-lag", "data-month"] },
      vintages: { type: "array" },
      observations: {
        type: "array",
        items: {
          type: "object",
          required: ["date", "period", "value", "notes"],
          properties: {
            date: { type: "string" },
            period: {
              type: "object",
              required: ["start", "end"],
              properties: { start: { type: "string" }, end: { type: "string" } },
            },
            value: { type: ["number", "null"] },
            notes: { type: ["string", "null"] },
            estimated: { const: true },
          },
        },
      },
    },
  },
  "series-list": {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "MIKE series list",
    type: "object",
    required: [...ENVELOPE_REQUIRED, "series"],
    properties: { ...ENVELOPE_PROPS, series: { type: "array" } },
  },
  index: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "MIKE API index",
    type: "object",
    required: [...ENVELOPE_REQUIRED, "name", "description", "links"],
    properties: {
      ...ENVELOPE_PROPS,
      name: { type: "string" },
      description: { type: "string" },
      links: { type: "array" },
    },
  },
};

export const SCHEMA_NAMES = Object.keys(SCHEMAS);

export function getSchema(name: string): object | null {
  return SCHEMAS[name] ?? null;
}

export function requiredFields(name: string): string[] {
  const s = SCHEMAS[name] as { required?: string[] } | undefined;
  return s?.required ?? [];
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `bun test lib/api/schema.test.ts && npx tsc --noEmit`
Expected: PASS (3 tests); tsc clean.

- [ ] **Step 5: Commit**

```bash
git add lib/api/schema.ts lib/api/schema.test.ts
git commit -m "feat(api): published JSON Schemas for each document type (#6)"
```

---

### Task 4: Document builders + validation

**Type:** implementation
**Depends-on:** 1, 2, 3
**Review:** adversarial

**Files:**
- Create: `lib/api/documents.ts`
- Test: `lib/api/documents.test.ts`

**Interfaces:**
- Consumes: types + `API_ENVELOPE` (Task 1); `vintagesFor`, `VINTAGE_META`, `ALL_SERIES_IDS` (Task 2); `requiredFields` (Task 3); `Indicator`/`DataPoint` and `loadIndicatorData`/`loadAllIndicators` from `lib/indicators.ts`.
- Produces: `buildEnvelope(): ApiEnvelope`; `observationPeriod(date: string, convention: "release-lag" | "data-month"): { start: string; end: string }`; `buildObservation(point: DataPoint, convention): ApiObservation`; `buildSeriesDocument(indicator: Indicator): SeriesDocument` (throws on any data violation); `buildSeriesList(indicators: Indicator[]): SeriesListDocument`; `buildIndex(): IndexDocument`.

**Parallelization rationale:** none — this is the convergence task that consumes the type, vintage, and schema contracts; it is correctly serial after them.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/api/documents.test.ts
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
  expect(idx.links.some((l) => l.href === "/api/v1/series")).toBe(true);
  const list = buildSeriesList(await loadAllIndicators());
  expect(list.series.length).toBe(6);
  expect(list.series[0]!.url).toContain("/api/v1/series/");
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `bun test lib/api/documents.test.ts`
Expected: FAIL — cannot find module `./documents`.

- [ ] **Step 3: Implement**

```ts
// lib/api/documents.ts
import type { DataPoint, Indicator } from "@/lib/types";
import { INDICATOR_REGISTRY } from "@/lib/indicators";
import {
  API_ENVELOPE,
  type ApiEnvelope, type ApiObservation, type IndexDocument,
  type SeriesDocument, type SeriesListDocument,
} from "./types";
import { vintagesFor } from "./vintages";

/** Per-build envelope. commit comes from Cloudflare's build env; unknown locally. */
export function buildEnvelope(): ApiEnvelope {
  return {
    ...API_ENVELOPE,
    generated_at: new Date().toISOString(),
    commit: process.env.CF_PAGES_COMMIT_SHA ?? "unknown",
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/**
 * The month an observation measures, as {start, end}. release-lag rows are dated
 * the month AFTER the data, so the period is the previous month; data-month rows
 * are dated the month they measure (STANDARDS.md §3).
 */
export function observationPeriod(
  date: string,
  convention: "release-lag" | "data-month",
): { start: string; end: string } {
  const [y, m] = date.split("-").map(Number) as [number, number];
  let py = y, pm = m;
  if (convention === "release-lag") {
    pm = m - 1;
    if (pm === 0) { pm = 12; py = y - 1; }
  }
  return { start: `${py}-${pad(pm)}-01`, end: `${py}-${pad(pm)}-${pad(lastDay(py, pm))}` };
}

export function buildObservation(
  point: DataPoint,
  convention: "release-lag" | "data-month",
): ApiObservation {
  const obs: ApiObservation = {
    date: point.date,
    period: observationPeriod(point.date, convention),
    value: point.value,
    notes: point.notes ?? null,
  };
  if (point.notes?.startsWith("ESTIMATED")) obs.estimated = true;
  return obs;
}

export function buildSeriesDocument(indicator: Indicator): SeriesDocument {
  const convention = indicator.dateConvention;
  const observations = indicator.data.map((p) => buildObservation(p, convention));

  // Data guards — a violation throws, which fails the prerender and the build.
  if (observations.length !== indicator.data.length) {
    throw new Error(`api: observation count mismatch for ${indicator.id}`);
  }
  for (const o of observations) {
    if (o.value !== null && Number.isNaN(o.value)) {
      throw new Error(`api: NaN observation value in ${indicator.id} at ${o.date}`);
    }
    if (o.value !== null && !Number.isFinite(o.value)) {
      throw new Error(`api: non-finite observation value in ${indicator.id} at ${o.date}`);
    }
  }

  return {
    ...buildEnvelope(),
    id: indicator.id,
    title: indicator.title,
    unit: indicator.unit,
    frequency: indicator.frequency,
    category: indicator.category,
    source: indicator.source,
    calculation: indicator.calculation ?? null,
    baseline: indicator.baseline ?? null,
    date_convention: convention,
    vintages: vintagesFor(indicator.id),
    observations,
  };
}

export function buildSeriesList(indicators: Indicator[]): SeriesListDocument {
  return {
    ...buildEnvelope(),
    series: indicators.map((i) => ({
      id: i.id,
      title: i.title,
      unit: i.unit,
      category: i.category,
      current_value: i.currentValue,
      change: i.change,
      change_percent: i.changePercent,
      trend: i.trend,
      last_update: i.lastUpdate,
      next_update: i.nextUpdate,
      url: `/api/v1/series/${i.id}`,
    })),
  };
}

export function buildIndex(): IndexDocument {
  return {
    ...buildEnvelope(),
    name: "MIKE Economic Data API",
    description:
      "Read-only JSON for the MIKE personal economic indicators. Generated at build time from the same source as mike.quarterly.systems. CC0-1.0. See /api/v1/schema.",
    links: [
      { rel: "series-list", href: "/api/v1/series" },
      { rel: "series", href: "/api/v1/series/{id}" },
      { rel: "schema", href: "/api/v1/schema/{name}" },
      { rel: "llms", href: "/llms.txt" },
      { rel: "docs", href: API_ENVELOPE.docs },
    ],
  };
}

/** Guard for a future edit: the API must cover every registry series. */
export function registryCoverageGap(built: string[]): string[] {
  return Object.keys(INDICATOR_REGISTRY).filter((id) => !built.includes(id));
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npm run test:tz 2>&1 | grep -E "^ [0-9]+ (pass|fail)" && npx tsc --noEmit`
Expected: all pass, 0 fail; tsc clean. (Run under `test:tz` so the period/date math is checked in multiple timezones.)

- [ ] **Step 5: Commit**

```bash
git add lib/api/documents.ts lib/api/documents.test.ts
git commit -m "feat(api): document builders with period, estimated flag, and data guards (#6)"
```

---

### Task 5: JSON route handlers (index, list, series)

**Type:** implementation
**Depends-on:** 2, 4
**Review:** adversarial

**Files:**
- Create: `app/api/v1/route.ts`
- Create: `app/api/v1/series/route.ts`
- Create: `app/api/v1/series/[id]/route.ts`

**Interfaces:**
- Consumes: `buildIndex`, `buildSeriesList`, `buildSeriesDocument` (Task 4); `loadAllIndicators`, `loadIndicatorData` from `lib/indicators.ts`; `ALL_SERIES_IDS`, `isVintage`, `VINTAGE_META` (Task 2); `parseCSV` from `lib/indicators.ts` (for the phi-classic vintage document, which has a CSV but no registry entry).
- Produces: prerendered static endpoints `/api/v1`, `/api/v1/series`, `/api/v1/series/{id}` (7 ids).

- [ ] **Step 1: Create the index and list handlers**

```ts
// app/api/v1/route.ts
import { buildIndex } from "@/lib/api/documents";
export const dynamic = "force-static";
export async function GET() {
  return Response.json(buildIndex());
}
```

```ts
// app/api/v1/series/route.ts
import { loadAllIndicators } from "@/lib/indicators";
import { buildSeriesList } from "@/lib/api/documents";
export const dynamic = "force-static";
export async function GET() {
  return Response.json(buildSeriesList(await loadAllIndicators()));
}
```

- [ ] **Step 2: Create the series-by-id handler, including the phi-classic vintage**

The current six come from the registry via `loadIndicatorData`. PHI-Classic has a CSV but no registry entry, so build its document from `VINTAGE_META` + its parsed CSV. Both paths produce a `SeriesDocument`.

```ts
// app/api/v1/series/[id]/route.ts
import path from "path";
import { loadIndicatorData, parseCSV, INDICATOR_REGISTRY } from "@/lib/indicators";
import { buildSeriesDocument, buildObservation, buildEnvelope } from "@/lib/api/documents";
import { ALL_SERIES_IDS, isVintage, VINTAGE_META } from "@/lib/api/vintages";
import type { SeriesDocument } from "@/lib/api/types";

export const dynamic = "force-static";
export const dynamicParams = false; // only the known ids; anything else 404s

export function generateStaticParams() {
  return ALL_SERIES_IDS.map((id) => ({ id }));
}

async function vintageDocument(id: string): Promise<SeriesDocument> {
  const meta = VINTAGE_META[id]!;
  const data = await parseCSV(path.join(process.cwd(), "data", `${id}.csv`));
  const observations = data.map((p) => buildObservation(p, meta.date_convention));
  for (const o of observations) {
    if (o.value !== null && !Number.isFinite(o.value)) {
      throw new Error(`api: non-finite value in vintage ${id} at ${o.date}`);
    }
  }
  return {
    ...buildEnvelope(),
    id,
    title: meta.title,
    unit: meta.unit,
    frequency: meta.frequency,
    category: meta.category,
    source: meta.source,
    calculation: meta.calculation,
    baseline: meta.baseline,
    date_convention: meta.date_convention,
    vintages: [],
    observations,
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isVintage(id)) return Response.json(await vintageDocument(id));
  if (id in INDICATOR_REGISTRY) {
    return Response.json(buildSeriesDocument(await loadIndicatorData(id as keyof typeof INDICATOR_REGISTRY)));
  }
  return new Response("Not found", { status: 404 });
}
```

- [ ] **Step 3: Verify prerender and content**

Run: `npm run build 2>&1 | grep -E "api/v1|error" | head`
Expected: the route table lists `○ /api/v1`, `○ /api/v1/series`, and `● /api/v1/series/[id]` (SSG, 7 params). No errors.

Then confirm real output was baked:

Run: `find .next/server/app/api/v1 -name "*.body" | head; cat .next/server/app/api/v1/series/ppi.body 2>/dev/null | head -c 200`
Expected: `.body` files exist for `series/ppi` … `series/phi-classic`; the ppi body is JSON containing `"id":"ppi"` and `"date_convention":"release-lag"`.

- [ ] **Step 4: Commit**

```bash
git add "app/api/v1/route.ts" "app/api/v1/series/route.ts" "app/api/v1/series/[id]/route.ts"
git commit -m "feat(api): index, series-list, and series-by-id route handlers (#6)"
```

---

### Task 6: CSV passthrough handler

**Type:** implementation
**Depends-on:** 2

**Files:**
- Create: `app/api/v1/series/[id]/csv/route.ts`

**Interfaces:**
- Consumes: `ALL_SERIES_IDS` (Task 2); reads `data/{id}.csv` from disk.
- Produces: prerendered `/api/v1/series/{id}/csv` (text/csv), 7 ids.

**Parallelization rationale:** the raw-CSV passthrough neither builds a document nor touches the JSON types — it streams the file verbatim — so it shares no code with the JSON handlers and only needs the id list; keeping it a separate handler lets it land independently. A good engineer separates a byte-passthrough from the structured serializer.

- [ ] **Step 1: Create the handler**

```ts
// app/api/v1/series/[id]/csv/route.ts
import { promises as fs } from "fs";
import path from "path";
import { ALL_SERIES_IDS } from "@/lib/api/vintages";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_SERIES_IDS.map((id) => ({ id }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ALL_SERIES_IDS.includes(id)) return new Response("Not found", { status: 404 });
  const csv = await fs.readFile(path.join(process.cwd(), "data", `${id}.csv`), "utf-8");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8" } });
}
```

- [ ] **Step 2: Verify prerender**

Run: `npm run build 2>&1 | grep -E "series/\[id\]/csv|error"`
Expected: `● /api/v1/series/[id]/csv` appears (SSG). No errors.

Run: `head -c 60 .next/server/app/api/v1/series/ppi/csv.body 2>/dev/null`
Expected: the first line of `data/ppi.csv` (`date,value,notes,pulse,hours`).

- [ ] **Step 3: Commit**

```bash
git add "app/api/v1/series/[id]/csv/route.ts"
git commit -m "feat(api): raw CSV passthrough per series (#6)"
```

---

### Task 7: Schema route handler

**Type:** implementation
**Depends-on:** 3

**Files:**
- Create: `app/api/v1/schema/[name]/route.ts`

**Interfaces:**
- Consumes: `SCHEMA_NAMES`, `getSchema` (Task 3).
- Produces: prerendered `/api/v1/schema/{name}` (application/json) for each schema.

**Parallelization rationale:** serving the published schemas depends only on the schema module, not on the builders or the id list, so it is independent of the data route handlers. A good engineer exposes the contract document alongside the data.

- [ ] **Step 1: Create the handler**

```ts
// app/api/v1/schema/[name]/route.ts
import { SCHEMA_NAMES, getSchema } from "@/lib/api/schema";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SCHEMA_NAMES.map((name) => ({ name }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const schema = getSchema(name);
  if (!schema) return new Response("Not found", { status: 404 });
  return Response.json(schema);
}
```

- [ ] **Step 2: Verify prerender**

Run: `npm run build 2>&1 | grep -E "schema/\[name\]|error"`
Expected: `● /api/v1/schema/[name]` (SSG). No errors.

Run: `cat .next/server/app/api/v1/schema/series.body 2>/dev/null | head -c 80`
Expected: JSON beginning with the series schema (`"$schema"`, `"title":"MIKE series document"`).

- [ ] **Step 3: Commit**

```bash
git add "app/api/v1/schema/[name]/route.ts"
git commit -m "feat(api): serve published JSON Schemas (#6)"
```

---

### Task 8: CORS headers and the alternate-link discovery hint

**Type:** implementation
**Depends-on:** none

**Files:**
- Create: `public/_headers`
- Modify: `app/(site)/series/[id]/page.tsx`

**Interfaces:**
- Produces: `Access-Control-Allow-Origin: *` on `/api/*`; a `<link rel="alternate" type="application/json" href="/api/v1/series/{id}">` on each series page.

**Parallelization rationale:** CORS is a static Cloudflare `_headers` file and the discovery link is a `<head>` tag on the series page — neither touches the API code, so this can land independently of every route handler. A good engineer configures cross-origin access and machine-discovery hints as their own change.

- [ ] **Step 1: Create the headers file**

```
# public/_headers
# CORS for the machine-readable API — agents fetch these cross-origin (#6).
/api/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET
```

- [ ] **Step 2: Add the alternate link to the series page**

`app/(site)/series/[id]/page.tsx` is a server component with an exported `generateMetadata` or a default metadata export. Add an `alternates` entry so each series page advertises its JSON. Locate the `export default async function` for the page; immediately above it, add (or extend) a `generateMetadata`:

```tsx
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    alternates: {
      types: { "application/json": `/api/v1/series/${id}` },
    },
  };
}
```

If a `generateMetadata` already exists, add the `alternates` field to its returned object instead of creating a second one. `PageProps` is the existing props type in that file (`{ params: Promise<{ id: string }> }`); reuse it.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|error"`
Expected: tsc clean; `✓ Compiled successfully`.

Run: `npm run dev` in the background, then `curl -s http://localhost:3000/series/ppi | grep -o 'type="application/json"[^>]*'`
Expected: a `<link>` whose `href` is `/api/v1/series/ppi`.

- [ ] **Step 4: Commit**

```bash
git add public/_headers "app/(site)/series/[id]/page.tsx"
git commit -m "feat(api): CORS on /api/* + alternate-link discovery on series pages (#6)"
```

---

### Task 9: llms.txt orientation file

**Type:** implementation
**Depends-on:** 1

**Files:**
- Create: `app/llms.txt/route.ts`

**Interfaces:**
- Consumes: `loadAllIndicators` from `lib/indicators.ts`; `API_ENVELOPE` (Task 1).
- Produces: prerendered `/llms.txt` (text/plain) orienting an LLM to the API.

**Parallelization rationale:** the plaintext orientation is a standalone document at the site root — a different route namespace from `/api/v1` — and only needs the series list, so it does not collide with the API handlers. A good engineer ships the human/LLM-readable orientation as its own artifact.

- [ ] **Step 1: Create the handler**

A route folder literally named `llms.txt` maps to `/llms.txt`; Next allows a dot in a segment name. It returns text/plain.

```ts
// app/llms.txt/route.ts
import { loadAllIndicators } from "@/lib/indicators";
import { API_ENVELOPE } from "@/lib/api/types";

export const dynamic = "force-static";

export async function GET() {
  const indicators = await loadAllIndicators();
  const lines = [
    "# MIKE Economic Data",
    "",
    "Read-only JSON API for personal economic indicators, generated at build time",
    "from the same source as the site. Licensed CC0-1.0.",
    "",
    "## Endpoints (base: https://mike.quarterly.systems)",
    "- /api/v1              discovery index",
    "- /api/v1/series       all indicators, current values",
    "- /api/v1/series/{id}  full series: metadata + every observation + notes",
    "- /api/v1/series/{id}/csv   raw CSV",
    "- /api/v1/schema/{name}     JSON Schema (series, series-list, index)",
    "",
    "## Conventions",
    "- Every observation carries `date` (publication) and `period` (month measured).",
    "  Compare series on `period`, never `date` — series use different date conventions.",
    "- `estimated: true` marks an interpolated value, not a measurement.",
    "- Retired series are preserved as vintages, linked from the series they replaced.",
    "",
    "## Series",
    ...indicators.map((i) => `- ${i.id}: ${i.title} — ${i.unit}  →  /api/v1/series/${i.id}`),
    "",
    `Docs: ${API_ENVELOPE.docs}`,
  ];
  return new Response(lines.join("\n") + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
```

- [ ] **Step 2: Verify prerender**

Run: `npm run build 2>&1 | grep -E "llms.txt|error"`
Expected: `○ /llms.txt` prerendered. No errors.

Run: `cat .next/server/app/llms.txt.body 2>/dev/null | head -20`
Expected: the orientation text, listing all six series with their `/api/v1/series/{id}` links.

- [ ] **Step 3: Commit**

```bash
git add "app/llms.txt/route.ts"
git commit -m "feat(api): /llms.txt orientation for LLM consumers (#6)"
```

---

### Task 10: Full-build integration gate

**Type:** gate
**Depends-on:** 4, 5, 6, 7, 8, 9

**Files:**
- Test: `lib/api/integration.test.ts`

**Interfaces:**
- Consumes: every builder and the loaders.

This gate proves the whole surface builds and the output matches the site. Its suite is `npm run test:tz` plus a clean `npm run build`.

- [ ] **Step 1: Write the cross-surface test**

```ts
// lib/api/integration.test.ts
import { test, expect } from "bun:test";
import { loadAllIndicators, loadIndicatorData } from "@/lib/indicators";
import { buildSeriesList, buildSeriesDocument } from "./documents";
import { registryCoverageGap } from "./documents";

test("the series list covers every registry indicator", async () => {
  const list = buildSeriesList(await loadAllIndicators());
  expect(registryCoverageGap(list.series.map((s) => s.id))).toEqual([]);
});

test("every series document's values match the loaded indicator (API cannot drift from the site)", async () => {
  for (const i of await loadAllIndicators()) {
    const doc = buildSeriesDocument(i);
    expect(`${i.id}:${doc.observations.length}`).toBe(`${i.id}:${i.data.length}`);
    expect(`${i.id}:${doc.observations.at(-1)!.value}`).toBe(`${i.id}:${i.currentValue}`);
    // notes pass through byte-for-byte (STANDARDS §7)
    i.data.forEach((p, idx) => {
      expect(`${i.id}[${idx}]:${doc.observations[idx]!.notes ?? ""}`).toBe(`${i.id}[${idx}]:${p.notes ?? ""}`);
    });
  }
});

test("PHI's last observation is the corrected June value on the site (106.0), proving no drift", async () => {
  const doc = buildSeriesDocument(await loadIndicatorData("phi"));
  const june = doc.observations.find((o) => o.date === "2026-06-01");
  expect(june!.value).toBe(106.0);
});
```

- [ ] **Step 2: Run the suite across timezones**

Run: `npm run test:tz 2>&1 | grep -E "^ [0-9]+ (pass|fail)"`
Expected: all pass, 0 fail, in each timezone.

- [ ] **Step 3: Full build, assert every API asset prerendered**

Run: `npm run build 2>&1 | grep -E "Compiled|/api/v1|/llms.txt|error"`
Expected: `✓ Compiled successfully`; the route table lists `/api/v1`, `/api/v1/series`, `/api/v1/series/[id]`, `/api/v1/series/[id]/csv`, `/api/v1/schema/[name]`, and `/llms.txt`.

Run: `find .next/server/app/api -name "*.body" | wc -l`
Expected: at least 16 (`index` + `series` + 7×`series/{id}` + 7×`csv` + 3×`schema` — counts vary, but must be non-zero and include `series/phi-classic.body`).

- [ ] **Step 4: Confirm the lockfile is untouched (deploy safety)**

Run: `git diff --quiet HEAD -- package-lock.json && echo CLEAN; npm ci --dry-run >/dev/null 2>&1 && echo "npm ci in sync"`
Expected: `CLEAN` and `npm ci in sync` — no dependency drift, so the Cloudflare `npm ci` step will not fail.

---

## Acceptance

**Acceptance:** waived — operator reviews every diff inline; correctness is pinned by the builder unit tests (period math, estimated flag, note pass-through, NaN guard, vintage linkage), the cross-surface integration tests (registry coverage, no-drift against the loaded indicators including PHI's corrected 106.0), and the full-build gate that asserts every endpoint prerenders. The API is generated from the same load path as the site, so "matches the site" is a build-time identity, not a claim to re-verify by hand. Real Cloudflare deploy (route-handler prerender served with CORS) is confirmed post-merge against production, the same way every deploy this session was verified.

### Coverage summary (spec → task)

| #6 acceptance criterion | Task |
|---|---|
| `/api/v1/series/ppi` returns every observation, untruncated notes | 4, 5, 10 |
| Adding a registry indicator surfaces it with no other edit | 2, 4 (registry-derived), 10 (coverage test) |
| Every document validates against its published schema; build fails if not | 3, 4 (required-fields cross-check + throwing guards fail prerender) |
| `phi-classic` reachable as a declared vintage of `phi` | 2, 5 |
| API values match the rendered site for all six series | 4, 10 (no-drift test) |
| CORS allows cross-origin reads | 8 |
| `STANDARDS.md` matches what ships | envelope/§2, dates/§3, vintages/§4, values+estimated/§6, notes/§7 all enforced in 1–4 |
| Discovery: `llms.txt` + `<link rel=alternate>` | 8, 9 |
