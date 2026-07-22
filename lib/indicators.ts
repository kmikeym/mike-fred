/**
 * MIKE Federal Reserve - Indicator Definitions and Utilities
 */

import type { IndicatorId, IndicatorMetadata, DataPoint, Indicator, TrendDirection } from "./types";
import { promises as fs } from "fs";
import path from "path";

/**
 * The single source of truth for what each indicator IS.
 *
 * Everything describing a series lives here — title, units, provenance, and two
 * fields that are load-bearing rather than descriptive:
 *
 * - `dateConvention` — whether a row is dated by its release month or the month
 *   it measures. Read by the site *and* by `scripts/mike-fred-append-month.sh`
 *   (via `bun -e`), so the write path cannot drift from the read path.
 * - `valueSource` — whether this repo can compute the value. The append script
 *   refuses to derive one for an `external` series.
 *
 * Both are typed rather than documented in prose because prose drifted: the date
 * convention was stated in five places and was wrong in three of them (#12).
 * TypeScript now requires a new indicator to declare both, so a seventh series
 * cannot silently inherit the wrong one.
 *
 * Deliberately absent: `lastUpdate` and `nextUpdate`. Both are derived from the
 * data at load time. Hardcoding them is how PHI came to advertise an October
 * release date for weeks (#4). See STANDARDS.md §9.
 */
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
    dateConvention: "release-lag",
    valueSource: "derived",
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
    dateConvention: "release-lag",
    valueSource: "external",
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
    dateConvention: "release-lag",
    valueSource: "derived",
  },
  "phi": {
    id: "phi",
    title: "Personal Health Index (PHI)",
    shortTitle: "Health Index",
    description:
      "Data-driven composite of four health pillars from daily Apple Watch data, each graded against Mike's own 2023-2025 baseline (100 = normal for Mike). Recovery (HRV + resting heart rate), Sleep (duration + night-to-night consistency), Activity (energy, steps, exercise), and Fitness (VO2 max + cardio recovery). Rebuilt in 2026 as PHI 2.0; the legacy sleep/activity/weight index is preserved as PHI-Classic. See the methodology report.",
    unit: "Index (2023-2025 avg = 100)",
    frequency: "monthly",
    category: "Health & Wellness",
    source: "Apple Watch / Apple Health (via Health Auto Export)",
    calculation: "PHI = 0.30·Recovery + 0.25·Sleep + 0.25·Activity + 0.20·Fitness. Each metric's monthly mean is scored vs its 2023-2025 baseline (direction-corrected, capped 60-160); the index is re-based so the 2023-2025 mean = 100. Series starts 2023-01 (Apple Watch sleep-stage tracking availability). Full method: /reports/phi-2.0-methodology.",
    color: "#f59e0b",
    dateConvention: "data-month",
    valueSource: "external",
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
    dateConvention: "release-lag",
    valueSource: "external",
  },
  "completion-rate": {
    id: "completion-rate",
    title: "Longform Media Velocity",
    shortTitle: "Media Velocity",
    description:
      "Measures intellectual engagement through consumption of longform content - books and films. Tracks sustained attention span and cultural literacy development. Higher scores indicate consistent engagement with complex narratives and ideas.",
    unit: "Points",
    frequency: "monthly",
    category: "Learning & Growth",
    source: "Personal reading and viewing logs",
    calculation: "Combined scoring of books (2-5 points based on length) and movies (1 point each). Rewards sustained intellectual engagement with longform content across different media formats.",
    color: "#8b5cf6",
    dateConvention: "release-lag",
    valueSource: "external",
  },
};

const NUMERIC = /^-?\d+(\.\d+)?$/;

/**
 * Parse one indicator's CSV into data points.
 *
 * ## Why this isn't a one-line `split(",")`
 *
 * Notes are free prose and routinely contain commas ("3 books, 3 films";
 * "Based in Koreatown, LA."). The original parser took field 2 as the note,
 * which silently truncated every such note at its first comma — live on the
 * site, and worked around by a script that rewrote commas as semicolons,
 * corrupting the prose to fit the bug (#2).
 *
 * So the note is not a field, it is *everything between* the leading columns and
 * the trailing ones. The header tells us how many trailing columns there are:
 * `date,value,notes` for most series, `date,value,notes,pulse,hours` for ppi.
 * Those trailing columns are claimed from the right, which stays unambiguous
 * because a note never parses as a bare number.
 *
 * Empty counts as a trailing column, because an omitted optional value may be
 * written either as `...,80,` or `...,80` — the append script emits the former.
 *
 * Invariant, enforced by test: note text round-trips byte-for-byte from the CSV
 * (STANDARDS.md §7).
 */
export async function parseCSV(filePath: string): Promise<DataPoint[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0]?.split(",") || [];

  // Layouts are date,value,notes (most series) and date,value,notes,pulse,hours (ppi).
  // The header tells us how many numeric columns trail the note; everything between
  // column 2 and those trailing columns IS the note, commas included (STANDARDS.md §7).
  const trailingColumns = Math.max(0, headers.length - 3);

  const data: DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = line.split(",");
    if (values.length >= 2 && values[0] && values[1]) {
      // Claim trailing numeric-or-empty fields from the right. A note never parses as
      // a bare number, so this stays unambiguous even when the note contains commas.
      // Empty counts because an omitted optional column may be written either as a
      // trailing empty field (`...,80,`) or by stopping early (`...,80`).
      const trailing: string[] = [];
      let end = values.length;
      while (trailing.length < trailingColumns && end > 3) {
        const field = values[end - 1]!.trim();
        if (field !== "" && !NUMERIC.test(field)) break;
        trailing.unshift(field);
        end--;
      }

      const hoursRaw = trailing.length === trailingColumns ? trailing[trailingColumns - 1] : undefined;
      const hours = hoursRaw ? parseFloat(hoursRaw) : NaN;

      data.push({
        date: values[0].trim(),
        value: parseFloat(values[1].trim()),
        notes: values.slice(2, end).join(",").trim() || undefined,
        hours: Number.isNaN(hours) ? undefined : hours,
      });
    }
  }

  return data;
}

/**
 * Load PHI 2.0 and the preserved PHI-Classic vintage, merged by data-month for the
 * methodology overlap chart. PHI-Classic was published on a ~1-month release lag, so
 * its dates are shifted back one month to line up with PHI 2.0's data-month dating.
 */
export async function loadPhiOverlap(): Promise<{ date: string; phi2: number | null; classic: number | null }[]> {
  const dir = path.join(process.cwd(), "data");
  const phi2 = await parseCSV(path.join(dir, "phi.csv"));
  const classic = await parseCSV(path.join(dir, "phi-classic.csv"));
  const toDataMonth = (d: string) => {
    const [ys, ms] = d.slice(0, 7).split("-");
    const y = Number(ys), m = Number(ms);
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  };
  const map = new Map<string, { phi2: number | null; classic: number | null }>();
  for (const p of phi2) map.set(p.date.slice(0, 7), { phi2: p.value, classic: null });
  for (const p of classic) {
    const dm = toDataMonth(p.date);
    const cur = map.get(dm) || { phi2: null, classic: null };
    cur.classic = p.value;
    map.set(dm, cur);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));
}

const PERIOD_MONTHS: Record<IndicatorMetadata["frequency"], number> = {
  daily: 0,
  weekly: 0,
  monthly: 1,
  quarterly: 3,
};

const PERIOD_DAYS: Record<IndicatorMetadata["frequency"], number> = {
  daily: 1,
  weekly: 7,
  monthly: 0,
  quarterly: 0,
};

/**
 * When the next release of a series is due, derived from its last observation and
 * its publication frequency.
 *
 * All six MIKE stats are monthly; quarterly *reports* are a separate artifact and
 * are not indicators. Deriving this instead of hardcoding it is STANDARDS.md §9 —
 * the hand-typed version drifted and published a wrong date for PHI (issue #4).
 */
export function nextReleaseDate(
  lastDate: string,
  frequency: IndicatorMetadata["frequency"],
  convention: IndicatorMetadata["dateConvention"],
): string {
  // A release-lag row is published in the month it is dated, so the next one is a
  // period away. A data-month row is dated the month it measures and cannot exist
  // until that month closes — so its next *publication* is two periods out.
  const periods = convention === "data-month" ? 2 : 1;
  const [year, month, day] = lastDate.split("-").map(Number) as [number, number, number];
  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCMonth(next.getUTCMonth() + PERIOD_MONTHS[frequency] * periods);
  next.setUTCDate(next.getUTCDate() + PERIOD_DAYS[frequency] * periods);
  return next.toISOString().slice(0, 10);
}

/**
 * The row date a series uses for the release published in `releaseMonth` (YYYY-MM).
 *
 * Single source of truth for the monthly write path: the append script calls this
 * rather than assuming one convention for all six series (#12).
 *
 *   rowDateForRelease("ppi", "2026-08")  ->  "2026-08-01"   (August release, July data)
 *   rowDateForRelease("phi", "2026-08")  ->  "2026-07-01"   (same data, dated by month)
 */
export function rowDateForRelease(id: IndicatorId, releaseMonth: string): string {
  const [year, month] = releaseMonth.split("-").map(Number) as [number, number];
  if (INDICATOR_REGISTRY[id].dateConvention === "release-lag") {
    return `${releaseMonth}-01`;
  }
  const d = new Date(Date.UTC(year, month - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
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
    lastUpdate: lastDataPoint.date,
    nextUpdate: nextReleaseDate(lastDataPoint.date, metadata.frequency, metadata.dateConvention),
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
 * Load the frozen indicator values for a published report.
 *
 * ## Why this exists
 *
 * A quarterly report is a *record*, not a dashboard. Its six indicator cards must
 * show what was true in that quarter — Q1 2025 shows PWI at its 2025 level, not
 * today's. Those values are frozen in `data/quarterly/<id>.json` when the report
 * is published, and this reads them back. Without it, opening an old report would
 * silently show current numbers, which is the same "gaslighting" problem the
 * annotate-only rule guards against (STANDARDS.md §9).
 *
 * ## What `null` means
 *
 * `null` is a real answer, not a failure: **render live values instead**. The
 * caller does `snapshotData || await loadAllIndicators()`. Exactly one document
 * relies on this — the PHI 2.0 methodology report, which is not a quarter. It has
 * narrative and highlights but no `indicators` key, and its cards *should* show
 * current values, because it describes the index as it stands now.
 *
 * ## The three states, and why they are separated
 *
 * | input                     | result | meaning                        |
 * |---------------------------|--------|--------------------------------|
 * | snapshot with `indicators`| frozen | show the historical quarter    |
 * | no `indicators` key       | `null` | deliberate — show live values  |
 * | missing file (ENOENT)     | `null` | no snapshot exists yet         |
 * | malformed / unreadable    | throws | fail the build, loudly         |
 *
 * These used to be two states, not four: reading `snapshot.indicators` on an
 * absent key threw a TypeError, which the same catch-all swallowed as malformed
 * JSON. So a one-character typo in a quarterly file made a 2025 report render
 * 2026 numbers — with a green build and no warning (#5). The "no indicators"
 * case is now an explicit check, which frees the catch to be strict.
 *
 * @param quarterId report id, matching the filename in `data/quarterly/`
 * @param dir       override the data directory (tests only)
 */
export async function loadQuarterlySnapshot(
  quarterId: string,
  dir?: string,
): Promise<Indicator[] | null> {
  const snapshotPath = path.join(dir ?? path.join(process.cwd(), "data", "quarterly"), `${quarterId}.json`);

  let snapshot: any;
  try {
    snapshot = JSON.parse(await fs.readFile(snapshotPath, "utf-8"));
  } catch (error: any) {
    // A missing file is expected — not every report has a snapshot. Anything
    // else (malformed JSON, unreadable file) is a real fault and must not be
    // downgraded into "just show live data".
    if (error?.code === "ENOENT") return null;
    throw new Error(`Failed to read quarterly snapshot ${quarterId}: ${error?.message ?? error}`, {
      cause: error,
    });
  }

  // Not every report is a quarter. A document without an `indicators` section is
  // asking for live values, which the caller supplies. This must be checked
  // before the loop below, or an absent key throws and looks like corruption.
  if (!snapshot.indicators) return null;

  {
    // Transform snapshot data into Indicator[] format
    const indicators: Indicator[] = [];

    for (const [indicatorId, indicatorData] of Object.entries(snapshot.indicators)) {
      const metadata = INDICATOR_REGISTRY[indicatorId as IndicatorId];
      if (!metadata) continue;

      const data = indicatorData as any;

      // A snapshot is a frozen historical quarter: it "last updated" at the close of
      // its own period, and its next release followed one period later.
      const asOf = snapshot.period.end as string;
      const schedule = {
        lastUpdate: asOf,
        nextUpdate: nextReleaseDate(asOf, metadata.frequency, metadata.dateConvention),
      };

      // For indicators with no data (null values), create a placeholder
      if (data.value === null) {
        indicators.push({
          ...metadata,
          ...schedule,
          currentValue: 0,
          previousValue: 0,
          change: 0,
          changePercent: 0,
          trend: "neutral" as TrendDirection,
          data: [],
        });
      } else {
        indicators.push({
          ...metadata,
          ...schedule,
          currentValue: data.value,
          previousValue: data.value - data.change,
          change: data.change,
          changePercent: data.changePercent,
          trend: data.trend as TrendDirection,
          data: [{ date: snapshot.period.end, value: data.value, notes: data.note }],
        });
      }
    }

    return indicators;
  }
}

/**
 * Shape a parsed quarterly snapshot into the narrative the report page renders.
 *
 * Kept pure and separate from file IO so it can be tested directly.
 *
 * `updates` are dated addenda appended to an already-published report (see #11).
 * Published figures are never edited; a restatement is disclosed by adding an
 * entry here. Note that q1/q2/q3-2025 carry no `narrative` block at all, so
 * updates must survive that shape — hence this returns null only when there is
 * neither narrative nor updates.
 */
export function buildNarrative(snapshot: any): any | null {
  const updates = [...(snapshot?.updates || [])].sort((a: any, b: any) =>
    String(b.date).localeCompare(String(a.date)),
  );

  if (!snapshot?.narrative && updates.length === 0) return null;

  return {
    executiveSummary: snapshot.narrative?.executiveSummary,
    sections: snapshot.narrative?.sections || [],
    outlook: snapshot.narrative?.outlook || null,
    highlights: snapshot.highlights || [],
    updates,
  };
}

/**
 * Load quarterly narrative data (executive summary, analysis sections, outlook)
 */
export async function loadQuarterlyNarrative(quarterId: string): Promise<any | null> {
  const snapshotPath = path.join(process.cwd(), "data", "quarterly", `${quarterId}.json`);

  try {
    const content = await fs.readFile(snapshotPath, "utf-8");
    return buildNarrative(JSON.parse(content));
  } catch {
    return null;
  }
}

/**
 * Format value with appropriate precision and unit
 */
export function formatValue(value: number, indicatorId: IndicatorId): string {
  const metadata = INDICATOR_REGISTRY[indicatorId];

  if (indicatorId === "knowledge-expansion") {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
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
