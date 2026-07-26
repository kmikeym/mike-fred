/**
 * Build the static machine-readable API into public/api/v1/ (issue #6).
 *
 * Runs at build time (before `next build`), reading data/*.csv through the same
 * lib/indicators.ts load path the site uses, and writing plain static files that
 * Cloudflare serves verbatim from public/. No route handlers, no edge runtime —
 * @cloudflare/next-on-pages rejects prerendered dynamic route handlers (they must
 * be edge, and edge has no filesystem to read the CSVs). A generator sidesteps
 * that entirely. Generated, never committed (public/api/ is gitignored).
 *
 * Run with bun: `bun scripts/build-api.ts` (wired into prebuild + pages:build).
 */
import { promises as fs } from "fs";
import path from "path";
import {
  loadAllIndicators,
  loadIndicatorData,
  parseCSV,
  INDICATOR_REGISTRY,
} from "../lib/indicators";
import {
  buildIndex,
  buildSeriesList,
  buildSeriesDocument,
  buildObservation,
  buildEnvelope,
} from "../lib/api/documents";
import { SCHEMAS } from "../lib/api/schema";
import { ALL_SERIES_IDS, isVintage, VINTAGE_META } from "../lib/api/vintages";
import type { IndicatorId } from "../lib/types";
import type { SeriesDocument } from "../lib/api/types";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "api", "v1");
const DATA = path.join(ROOT, "data");

async function writeJSON(rel: string, doc: unknown) {
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf-8");
}

/** A retired series (phi-classic): CSV + VINTAGE_META, no registry entry. */
async function vintageDocument(id: string): Promise<SeriesDocument> {
  const meta = VINTAGE_META[id]!;
  const data = await parseCSV(path.join(DATA, `${id}.csv`));
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

function llmsTxt(indicators: Awaited<ReturnType<typeof loadAllIndicators>>): string {
  return [
    "# MIKE Economic Data",
    "",
    "Read-only JSON API for personal economic indicators, generated at build time",
    "from the same source as the site. Licensed CC0-1.0.",
    "",
    "## Endpoints (base: https://mike.quarterly.systems)",
    "- /api/v1/index.json        discovery index",
    "- /api/v1/series.json       all indicators, current values",
    "- /api/v1/series/{id}.json  full series: metadata + every observation + notes",
    "- /api/v1/series/{id}.csv   raw CSV",
    "- /api/v1/schema/{name}.json  JSON Schema (envelope, series, series-list, index)",
    "",
    "## Conventions",
    "- Every observation carries `date` (publication) and `period` (month measured).",
    "  Compare series on `period`, never `date` — series use different date conventions.",
    "- `estimated: true` marks an interpolated value, not a measurement.",
    "- Retired series are preserved as vintages, linked from the series they replaced.",
    "",
    "## Series",
    ...indicators.map((i) => `- ${i.id}: ${i.title} — ${i.unit}  →  /api/v1/series/${i.id}.json`),
    "",
    // Was https://mike.quarterly.systems/api, which has never been a route (#23).
    // This file IS the API documentation, so pointing "Docs" back at it would be
    // circular; the repo README carries the human-facing endpoint table and the
    // source of every number here.
    `Source and docs: https://github.com/kmikeym/mike-fred`,
  ].join("\n") + "\n";
}

async function main() {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  const indicators = await loadAllIndicators();

  // Discovery + list
  await writeJSON("index.json", buildIndex());
  await writeJSON("series.json", buildSeriesList(indicators));

  // One document + CSV per series id (registry + vintages)
  for (const id of ALL_SERIES_IDS) {
    const doc = isVintage(id)
      ? await vintageDocument(id)
      : buildSeriesDocument(await loadIndicatorData(id as IndicatorId));
    await writeJSON(`series/${id}.json`, doc);

    const csv = await fs.readFile(path.join(DATA, `${id}.csv`), "utf-8");
    const csvOut = path.join(OUT, "series", `${id}.csv`);
    await fs.mkdir(path.dirname(csvOut), { recursive: true });
    await fs.writeFile(csvOut, csv, "utf-8");
  }

  // Schemas
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    await writeJSON(`schema/${name}.json`, schema);
  }

  // Registry-coverage guard: every current indicator must have a document.
  const missing = Object.keys(INDICATOR_REGISTRY).filter((id) => !ALL_SERIES_IDS.includes(id));
  if (missing.length) throw new Error(`api: registry ids not built: ${missing.join(", ")}`);

  // llms.txt at the site root
  await fs.writeFile(path.join(ROOT, "public", "llms.txt"), llmsTxt(indicators), "utf-8");

  const files = ALL_SERIES_IDS.length * 2 + Object.keys(SCHEMAS).length + 3;
  console.log(`api: wrote ${files} files to public/api/v1/ + public/llms.txt`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
