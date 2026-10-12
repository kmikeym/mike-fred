import { INDICATOR_REGISTRY } from "@/lib/indicators";
import type { IndicatorId } from "@/lib/types";

/**
 * Year-over-year comparison: one small card per indicator, two bars, the
 * prior-year quarter faded and the current quarter solid.
 *
 * Server-rendered SVG, replacing a Recharts client component (2026-10-12). Two
 * reasons. The client chart rendered blank anywhere JS did not run, including
 * print and the offline review copy of the Q3 2026 report. And it carried its
 * own six-entry color table that disagreed with the indicator registry on
 * every row (wealth was green here and crimson everywhere else), so the same
 * series wore different colors on the same page. Colors now come from the
 * registry, the single source the cards, the section charts and the series
 * pages all read.
 */

export interface YoYIndicator {
  id: string;
  label: string;
  previous: number;
  current: number;
  changePercent: number;
  unit: string;
}

interface YoYChartProps {
  indicators: YoYIndicator[];
  previousQuarter: string;
  currentQuarter: string;
}

const fmt = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: Number.isInteger(v) ? 0 : 2 });

function Bars({ ind, color, previousQuarter, currentQuarter }: { ind: YoYIndicator; color: string; previousQuarter: string; currentQuarter: string }) {
  const W = 240, H = 150, padT = 22, padB = 24, baseY = H - padB;
  // Bars grow from zero. A negative value (pre-rebase PWI) hangs below the
  // baseline rather than being clamped, so the chart does not lie about sign.
  const hi = Math.max(ind.previous, ind.current, 0);
  const lo = Math.min(ind.previous, ind.current, 0);
  const span = hi - lo || 1;
  const y = (v: number) => padT + ((hi - v) * (baseY - padT)) / span;
  const zero = y(0);
  const bar = (v: number, x: number, fill: string, opacity: number) => {
    const top = Math.min(y(v), zero), h = Math.abs(y(v) - zero);
    return <rect x={x} y={top} width={64} height={Math.max(h, 1)} rx={4} fill={fill} fillOpacity={opacity} />;
  };
  const cols = [
    { v: ind.previous, x: 36, label: previousQuarter, opacity: 0.45 },
    { v: ind.current, x: 140, label: currentQuarter, opacity: 1 },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${ind.label}: ${previousQuarter} ${fmt(ind.previous)}, ${currentQuarter} ${fmt(ind.current)}`} className="w-full block">
      <line x1={16} x2={W - 16} y1={zero} y2={zero} stroke="#d1d5db" strokeWidth="1" />
      {cols.map((c) => (
        <g key={c.label}>
          {bar(c.v, c.x, color, c.opacity)}
          <text x={c.x + 32} y={(c.v >= 0 ? Math.min(y(c.v), zero) : Math.max(y(c.v), zero) + 14) - (c.v >= 0 ? 6 : 0)} textAnchor="middle" fontSize="12" fontWeight="600" className="fill-gray-800">
            {fmt(c.v)}
          </text>
          <text x={c.x + 32} y={H - 6} textAnchor="middle" fontSize="11" className="fill-gray-500">{c.label}</text>
        </g>
      ))}
    </svg>
  );
}

export default function YoYChart({ indicators, previousQuarter, currentQuarter }: YoYChartProps) {
  return (
    <div className="my-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        {previousQuarter} vs {currentQuarter}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indicators.map((ind) => {
          const color = INDICATOR_REGISTRY[ind.id as IndicatorId]?.color ?? "#6b7280";
          const up = ind.changePercent > 0;
          return (
            <div key={ind.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm print:border-black">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">{ind.label}</h3>
                <span className={`text-sm font-bold ${up ? "text-green-600" : "text-red-600"}`}>
                  {up ? "+" : ""}
                  {ind.changePercent.toFixed(1)}%
                </span>
              </div>
              <Bars ind={ind} color={color} previousQuarter={previousQuarter} currentQuarter={currentQuarter} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
