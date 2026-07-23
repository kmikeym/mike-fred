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
