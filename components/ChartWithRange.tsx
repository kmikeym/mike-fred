"use client";

import { useState } from "react";
import IndicatorChart, { type TrendLine } from "@/components/IndicatorChart";
import { windowByMonths, trailingAverage } from "@/lib/utils";
import type { DataPoint } from "@/lib/types";

const RANGES: { label: string; months: number }[] = [
  { label: "ALL", months: Infinity },
  { label: "1Y", months: 12 },
  { label: "6M", months: 6 },
  { label: "3M", months: 3 },
];

// Trailing-average overlays. 3-month is on by default; 6-month is opt-in. Windows
// are computed over the FULL series, then the range clips the view — so a 6-month
// trend stays correct even when the range is narrowed below six months (#1).
const TREND_DEFS: (TrendLine & { months: number; defaultOn: boolean })[] = [
  { key: "ma3", label: "3-month trend", months: 3, color: "#f59e0b", defaultOn: true },
  { key: "ma6", label: "6-month trend", months: 6, color: "#6b7280", dash: "5 4", defaultOn: false },
];

export default function ChartWithRange({
  title, data, color, unit, enableTrends = false, baseline,
}: {
  title: string;
  data: DataPoint[];
  color: string;
  unit: string;
  enableTrends?: boolean;
  baseline?: number;
}) {
  const [range, setRange] = useState("ALL");
  const [activeTrends, setActiveTrends] = useState<string[]>(
    enableTrends ? TREND_DEFS.filter((t) => t.defaultOn).map((t) => t.key) : [],
  );

  const months = RANGES.find((r) => r.label === range)?.months ?? Infinity;

  // Attach every trend value to each point (computed over the full series), then
  // window. Nothing is stored — this derives from the raw values at render time.
  const values = data.map((p) => p.value);
  const withTrends = data.map((p, i) => {
    const point: DataPoint & { [key: string]: number | null | string | undefined } = { ...p };
    if (enableTrends) {
      for (const t of TREND_DEFS) point[t.key] = trailingAverage(values, t.months)[i]!;
    }
    return point;
  });
  const filtered = windowByMonths(withTrends, months);

  const shownTrends: TrendLine[] = enableTrends
    ? TREND_DEFS.filter((t) => activeTrends.includes(t.key)).map(({ key, label, color, dash }) => ({ key, label, color, dash }))
    : [];

  const toggleTrend = (key: string) =>
    setActiveTrends((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex space-x-2 text-sm">
          {RANGES.map((r) => {
            // Hide ranges that don't shorten the available data (e.g. 1Y when <12 pts)
            if (r.months !== Infinity && data.length <= r.months) return null;
            const active = r.label === range;
            return (
              <button
                key={r.label}
                onClick={() => setRange(r.label)}
                className={
                  active
                    ? "px-3 py-1 rounded-md bg-primary text-white font-medium"
                    : "px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100"
                }
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {enableTrends && (
        <div className="flex items-center space-x-2 text-sm mb-4">
          <span className="text-gray-500">Trend*:</span>
          {TREND_DEFS.map((t) => {
            const on = activeTrends.includes(t.key);
            return (
              <button
                key={t.key}
                onClick={() => toggleTrend(t.key)}
                className={
                  on
                    ? "px-3 py-1 rounded-md font-medium text-white"
                    : "px-3 py-1 rounded-md text-gray-600 border border-gray-300 hover:bg-gray-100"
                }
                style={on ? { backgroundColor: t.color } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <IndicatorChart data={filtered} color={color} unit={unit} trends={shownTrends} baseline={baseline} />

      {enableTrends && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          <strong>* Trend lines are trailing simple moving averages.</strong> Each point is the mean of
          that month and the months before it — the 3-month trend at July 2026 averages the May, June and
          July rows, which under MIKE&apos;s release lag are April, May and June actuals. A trend summarises
          the run <em>ending</em> at each point, never data from after it, so the 3-month line begins at the
          third point and the 6-month at the sixth.
        </p>
      )}
    </>
  );
}
