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
      "Tracks real productivity performance using RescueTime's Productivity Pulse metric. Values above 100 indicate higher productivity than the 2025 average baseline. The index measures time spent in productive vs distracting activities, with scores ranging from 0 (100% distracting) to 100+ (highly focused work). Based on actual computer usage data, not self-reported estimates.",
    unit: "Index (2025 avg = 100)",
    frequency: "monthly",
    category: "Productivity",
    source: "RescueTime Productivity Pulse",
    calculation: "RescueTime Productivity Pulse score, normalized to 2025 average baseline (99.1)",
    color: "#667eea",
    lastUpdate: "2025-10-01",
    nextUpdate: "2025-11-01",
  },
  "knowledge-expansion": {
    id: "knowledge-expansion",
    title: "Knowledge Base Expansion Rate (KBER)",
    shortTitle: "Knowledge Base",
    description:
      "Cumulative total of all notes in Obsidian vault. Tracks the absolute size of the knowledge base over time, reflecting continuous learning and knowledge capture. Each note represents a discrete unit of captured information, idea, or insight.",
    unit: "Total Notes",
    frequency: "monthly",
    category: "Learning",
    source: "Obsidian Vault Manual Count",
    calculation: "Total count of all markdown files in vault (daily notes, permanent notes, reference materials, MOCs)",
    color: "#10b981",
    lastUpdate: "2025-10-01",
    nextUpdate: "2025-11-01",
  },
  "social-capital": {
    id: "social-capital",
    title: "Social Capital Index",
    shortTitle: "Social Capital",
    description:
      "Tracks total audience reach across all digital platforms. Measures the aggregate size of connected audiences who can receive content, updates, and communications. Higher values indicate broader potential reach and distribution capability.",
    unit: "Index (Oct 2025 = 100)",
    frequency: "monthly",
    category: "Social",
    source: "Multi-platform subscriber counts via platform APIs",
    calculation: "Weighted composite index of subscriber/follower counts across 11 platforms. High-value platforms (KmikeyM accounts 35%, Substack 30%) receive majority weighting, with primary social platforms (LinkedIn, X, Instagram) and medium-priority platforms (YouTube, Bluesky) contributing smaller weights. Baseline: October 2025 = 100.",
    color: "#3b82f6",
    lastUpdate: "2025-10-01",
    nextUpdate: "2025-11-01",
  },
  "phi": {
    id: "phi",
    title: "Personal Health Index (PHI)",
    shortTitle: "Health Index",
    description:
      "Composite health metric tracking physical wellness across three key dimensions - sleep quality, physical activity, and weight management. Measured as a weighted average with sleep optimization receiving highest priority, followed by exercise consistency and weight targets.",
    unit: "Index",
    frequency: "monthly",
    category: "Health & Wellness",
    source: "Personal tracking apps and devices",
    calculation: "Weighted composite of sleep quality (40%), physical activity frequency (35%), and weight management (25%). Sleep scored against 8-hour baseline, workouts against 30/month target, weight against 175lb target. Higher scores indicate better health optimization.",
    color: "#f59e0b",
    lastUpdate: "2025-11-01",
    nextUpdate: "2025-12-01",
  },
  "revenue": {
    id: "revenue",
    title: "Personal Wealth Index (PWI)",
    shortTitle: "Wealth Index",
    description:
      "Tracks overall financial health by measuring total net worth over time. Represents the difference between all assets (cash, investments, property, etc.) and all liabilities (debts, loans, obligations). Positive growth indicates wealth accumulation.",
    unit: "Index",
    frequency: "monthly",
    category: "Financial",
    source: "Personal financial tracking/net worth calculations",
    calculation: "Total assets minus total liabilities, indexed to baseline period",
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
  const headers = lines[0]?.split(",") || [];

  const data: DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = line.split(",");
    if (values.length >= 2 && values[0] && values[1]) {
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
  const lastDataPoint = data[data.length - 1];
  if (!lastDataPoint) {
    throw new Error(`No data found for indicator ${id}`);
  }

  const currentValue = lastDataPoint.value;
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
