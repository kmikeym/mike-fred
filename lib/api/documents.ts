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
      url: `/api/v1/series/${i.id}.json`,
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
      { rel: "series-list", href: "/api/v1/series.json" },
      { rel: "series", href: "/api/v1/series/{id}.json", templated: true },
      { rel: "series-csv", href: "/api/v1/series/{id}.csv", templated: true },
      { rel: "schema", href: "/api/v1/schema/{name}.json", templated: true },
      { rel: "llms", href: "/llms.txt" },
      { rel: "docs", href: API_ENVELOPE.docs },
    ],
  };
}

/** Guard for a future edit: the API must cover every registry series. */
export function registryCoverageGap(built: string[]): string[] {
  return Object.keys(INDICATOR_REGISTRY).filter((id) => !built.includes(id));
}
