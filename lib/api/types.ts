/**
 * The fixed envelope fields (STANDARDS.md §2). generated_at and commit are per-build.
 *
 * `docs` must point at a URL that resolves. It pointed at /api for the whole life of
 * v1, and /api has never been a route — so a dead link shipped in every document and
 * at the foot of llms.txt, aimed squarely at the agents least able to recover from it
 * (#23, same class as #7). llms.txt is the honest target: it is live, on-origin so the
 * link test covers it, and it genuinely documents the endpoints and conventions. If a
 * human-readable /api page is ever built, retarget here.
 */
export const API_ENVELOPE = {
  schema_version: "1.0.0",
  license: "CC0-1.0",
  docs: "https://mike.quarterly.systems/llms.txt",
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
  /**
   * `templated` marks an RFC 6570 URI template — an href carrying `{id}`-style
   * placeholders that must be expanded, never fetched literally. Without the flag a
   * naive client cannot tell a template from a broken URL, and requests
   * /api/v1/series/{id}.json verbatim (#14, #23).
   */
  links: { rel: string; href: string; templated?: true }[];
}
