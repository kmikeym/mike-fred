/**
 * MIKE Federal Reserve - Type Definitions
 * Official economic indicator types and data schemas
 */

export type IndicatorId =
  | "ppi"
  | "knowledge-expansion"
  | "social-capital"
  | "phi"
  | "revenue"
  | "completion-rate";

export type TrendDirection = "up" | "down" | "neutral";

export interface DataPoint {
  date: string; // ISO 8601 date format (YYYY-MM-DD)
  value: number;
  notes?: string;
  hours?: number; // Total tracked hours (PPI only; column 5 of ppi.csv)
}

export interface IndicatorMetadata {
  id: IndicatorId;
  title: string;
  shortTitle: string;
  description: string;
  unit: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  category: string;
  source: string;
  calculation?: string;
  color: string; // Hex color for charts

  /**
   * Where a row's date sits relative to the month it measures.
   *
   * `release-lag` — the row is dated the month AFTER the data (the 2026-07-01
   *   PPI row reports June). Five of the six series.
   * `data-month` — the row is dated the month it measures (the 2026-06-01 PHI
   *   row IS June). PHI 2.0 only.
   *
   * This is typed data rather than prose because prose drifted: the convention
   * was stated in five places and was wrong in three of them. Both the site and
   * the monthly append script read this field. See STANDARDS.md §3 and #12.
   */
  dateConvention: "release-lag" | "data-month";

  /**
   * Whether this repository can compute the value, or must be handed one.
   *
   * `derived` — the formula lives here and is trivial (PPI `pulse × 1.25`,
   *   SCI `raw / 3041.9 × 100`).
   * `external` — computed elsewhere. PHI 2.0 needs per-day HRV, sleep stages
   *   and VO2 max plus 2023-2025 baselines from the Apple Health pipeline;
   *   no generator for it exists in this repo.
   *
   * The append script refuses to derive a value for an `external` series, which
   * is what stops the retired PHI-Classic formula being used for PHI 2.0.
   */
  valueSource: "derived" | "external";

  /**
   * Decimal places when the value is displayed.
   *
   * STANDARDS.md §6: rounding is stated in metadata, not applied silently. This
   * replaces a hardcoded `toFixed(1)` with one series special-cased by id.
   * KBER is a whole-number count (0); the index series carry one decimal.
   */
  precision: number;

  /**
   * The value the reference line marks — what "100" (or any anchor) means for
   * this series. Declared, not derived: a baseline is a fixed reference set once
   * (STANDARDS.md §8). Absent on series with no meaningful baseline (counts,
   * point totals), where no reference line is drawn.
   */
  baseline?: number;
}

export interface Indicator extends IndicatorMetadata {
  // Derived, never hardcoded (STANDARDS.md §9): lastUpdate comes from the data,
  // nextUpdate from lastUpdate + frequency.
  lastUpdate: string; // ISO 8601 date
  nextUpdate: string; // ISO 8601 date
  currentValue: number;
  previousValue: number;
  change: number; // Absolute change
  changePercent: number; // Percentage change
  trend: TrendDirection;
  data: DataPoint[];
}

export interface IndicatorSummary {
  id: IndicatorId;
  title: string;
  value: string; // Formatted value with unit
  unit: string;
  change: number;
  trend: TrendDirection;
  lastUpdate: string;
}

export interface EconomicOverview {
  overallPerformance: "strong-growth" | "moderate-growth" | "stable" | "declining";
  productivityTrend: number; // Overall productivity percentage change
  strategicOutlook: "positive" | "neutral" | "cautious";
  lastUpdated: string;
}

/**
 * A dated addendum appended to an already-published report.
 *
 * Published figures and prose are never edited; when a number is later restated
 * (a methodology rebuild, a baseline rebase) or an error is found, it is
 * disclosed by adding one of these. Rendered above the original text, newest
 * first. See issue #11.
 */
export interface ReportUpdate {
  date: string; // ISO 8601 date the update was made — not the report's publishedDate
  title: string;
  body: string;
  link?: { href: string; label: string };
}

export interface QuarterlyReport {
  id: string; // e.g., "q4-2025"
  quarter: string; // e.g., "Q4 2025"
  title: string;
  summary: string;
  publishedDate: string; // ISO 8601
  indicators: {
    id: IndicatorId;
    performance: string;
    analysis: string;
  }[];
  strategicOutlook: string;
  content?: string; // Markdown content for full report
}

export interface WidgetConfig {
  indicatorIds: IndicatorId[];
  theme: "light" | "dark";
  showTrends: boolean;
  refreshInterval: number; // milliseconds
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface IndicatorsListResponse {
  indicators: IndicatorSummary[];
  overview: EconomicOverview;
}

export interface IndicatorDetailResponse {
  indicator: Indicator;
}
