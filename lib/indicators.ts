/**
 * MIKE Federal Reserve - Indicator Definitions and Utilities
 */

import type { IndicatorId, IndicatorMetadata, DataPoint, Indicator, TrendDirection } from "./types";
import { promises as fs } from "fs";
import path from "path";

// Indicator metadata registry
export const INDICATOR_REGISTRY: Record<IndicatorId, IndicatorMetadata> = {
  "ppi": {
    id: "ppi",
    title: "Personal Productivity Index (PPI)",
    shortTitle: "Productivity Index",
    description:
      "Normalized index of productive hours based on RescueTime data. Measures focus time, deep work sessions, and overall productive output.",
    unit: "Index (Q1 2025 = 100)",
    frequency: "monthly",
    category: "Productivity",
    source: "RescueTime API + Manual Adjustments",
    calculation: "Weighted average of productive hours, normalized to Q1 2025 baseline",
    color: "#667eea",
    lastUpdate: "2025-11-01",
    nextUpdate: "2025-12-01",
  },
  "knowledge-expansion": {
    id: "knowledge-expansion",
    title: "Knowledge Base Expansion",
    shortTitle: "Knowledge Growth",
    description:
      "Total number of notes, documents, and knowledge artifacts in Obsidian vault. Tracks learning velocity and information capture rate.",
    unit: "Notes",
    frequency: "monthly",
    category: "Learning",
    source: "Obsidian Vault Stats",
    calculation: "Total note count including daily notes, permanent notes, and reference materials",
    color: "#10b981",
    lastUpdate: "2025-11-01",
    nextUpdate: "2025-12-01",
  },
  "social-capital": {
    id: "social-capital",
    title: "Social Capital Index",
    shortTitle: "Social Capital",
    description:
      "Composite index of social media engagement, network growth, and community influence across platforms (Twitter, LinkedIn, GitHub, etc.).",
    unit: "Index",
    frequency: "monthly",
    category: "Social",
    source: "Multi-platform APIs + Engagement Metrics",
    calculation: "Weighted composite of followers, engagement rate, reach, and influence metrics",
    color: "#3b82f6",
    lastUpdate: "2025-11-01",
    nextUpdate: "2025-12-01",
  },
  "content-velocity": {
    id: "content-velocity",
    title: "Content Production Velocity",
    shortTitle: "Content Velocity",
    description:
      "Rate of content creation across all channels - blog posts, videos, tweets, newsletters, code commits, etc. Measured in standardized content units per week.",
    unit: "Units/Week",
    frequency: "monthly",
    category: "Content",
    source: "Multi-platform Content Tracking",
    calculation: "Weighted count of blog posts (3x), videos (5x), social posts (1x), normalized weekly",
    color: "#f59e0b",
    lastUpdate: "2025-11-01",
    nextUpdate: "2025-12-01",
  },
  "revenue": {
    id: "revenue",
    title: "Revenue Index",
    shortTitle: "Revenue",
    description:
      "Composite revenue index across all business entities - consulting, products, services, sponsorships. Normalized to Q1 2025 baseline.",
    unit: "Index (Q1 2025 = 100)",
    frequency: "monthly",
    category: "Financial",
    source: "Business Accounting Systems",
    calculation: "Total revenue across all streams, normalized to Q1 2025 baseline",
    color: "#DC143C",
    lastUpdate: "2025-11-01",
    nextUpdate: "2025-12-01",
  },
  "completion-rate": {
    id: "completion-rate",
    title: "Project Completion Rate",
    shortTitle: "Completion Rate",
    description:
      "Percentage of started projects that reach completion. Tracks delivery effectiveness and follow-through. Based on GitHub activity and task management data.",
    unit: "Percentage",
    frequency: "monthly",
    category: "Execution",
    source: "GitHub API + Task Management Systems",
    calculation: "Completed projects / (Completed + In Progress + Abandoned) × 100",
    color: "#8b5cf6",
    lastUpdate: "2025-11-01",
    nextUpdate: "2025-12-01",
  },
};

/**
 * Parse CSV data file
 */
async function parseCSV(filePath: string): Promise<DataPoint[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");

  const data: DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length >= 2) {
      data.push({
        date: values[0].trim(),
        value: parseFloat(values[1].trim()),
        notes: values[2]?.trim() || undefined,
      });
    }
  }

  return data;
}

/**
 * Calculate trend direction
 */
function calculateTrend(change: number): TrendDirection {
  if (change > 0.5) return "up";
  if (change < -0.5) return "down";
  return "neutral";
}

/**
 * Load indicator data from CSV file
 */
export async function loadIndicatorData(id: IndicatorId): Promise<Indicator> {
  const metadata = INDICATOR_REGISTRY[id];
  const csvPath = path.join(process.cwd(), "data", `${id}.csv`);

  const data = await parseCSV(csvPath);

  // Calculate current and previous values
  const currentValue = data[data.length - 1].value;
  const previousValue = data[data.length - 2]?.value || currentValue;
  const change = currentValue - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
  const trend = calculateTrend(changePercent);

  return {
    ...metadata,
    currentValue,
    previousValue,
    change,
    changePercent,
    trend,
    data,
  };
}

/**
 * Load all indicators
 */
export async function loadAllIndicators(): Promise<Indicator[]> {
  const ids = Object.keys(INDICATOR_REGISTRY) as IndicatorId[];
  const indicators = await Promise.all(ids.map(loadIndicatorData));
  return indicators;
}

/**
 * Format value with appropriate precision and unit
 */
export function formatValue(value: number, indicatorId: IndicatorId): string {
  const metadata = INDICATOR_REGISTRY[indicatorId];

  if (indicatorId === "knowledge-expansion") {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  if (indicatorId === "completion-rate") {
    return `${value.toFixed(1)}%`;
  }

  if (indicatorId === "content-velocity") {
    return value.toFixed(1);
  }

  return value.toFixed(1);
}

/**
 * Format change percentage for display
 */
export function formatChangePercent(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Get trend arrow icon
 */
export function getTrendArrow(trend: TrendDirection): string {
  switch (trend) {
    case "up":
      return "↑";
    case "down":
      return "↓";
    default:
      return "→";
  }
}
