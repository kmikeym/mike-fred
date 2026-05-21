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
  lastUpdate: string; // ISO 8601 date
  nextUpdate: string; // ISO 8601 date
}

export interface Indicator extends IndicatorMetadata {
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
