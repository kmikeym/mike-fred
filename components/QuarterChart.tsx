import type { IndicatorMetadata } from "@/lib/types";

/**
 * The quarter's three monthly readings for one indicator, drawn under that
 * indicator's section so a reader does not have to leave the report to see the
 * shape the prose describes.
 *
 * The values come from the snapshot (`indicators.<id>.months`), frozen at
 * publication like everything else in the report, not from the live CSV: a
 * later restatement must not silently redraw a published figure (STANDARDS.md
 * §9). Server-rendered SVG so it prints and needs no client JS.
 *
 * Three points is too few for a trend line to mean much, so every point is
 * labeled and the line is only there to carry the eye. The 100 reference is
 * drawn when the series has a declared baseline.
 */

interface Month {
  date: string; // CSV row date (release month)
  period: string; // YYYY-MM the value measures
  value: number;
}

interface Props {
  months: Month[];
  meta: IndicatorMetadata;
  quarter: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function QuarterChart({ months, meta, quarter }: Props) {
  const W = 640, H = 150;
  const padL = 56, padR = 56, padT = 26, padB = 30;
  const values = months.map((m) => m.value);
  const lo0 = Math.min(...values, meta.baseline ?? Infinity);
  const hi0 = Math.max(...values, meta.baseline ?? -Infinity);
  // Pad the range so marks and labels never touch the frame; a flat series
  // still gets a visible band.
  const span = Math.max(hi0 - lo0, Math.abs(hi0) * 0.04, 1);
  const lo = lo0 - span * 0.25, hi = hi0 + span * 0.25;
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(months.length - 1, 1);
  const y = (v: number) => padT + ((hi - v) * (H - padT - padB)) / (hi - lo);
  // Label with the precision the data actually carries (SCI is published to two
  // decimals, LMV is whole points), not the registry's display precision, so the
  // chart reads the same numbers the prose quotes.
  const decimals = Math.min(2, Math.max(...values.map((v) => (String(v).split(".")[1] ?? "").length)));
  const fmt = (v: number) =>
    v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const line = months.map((m, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(m.value).toFixed(1)}`).join(" ");
  const label = (p: string) => MONTHS[Number(p.slice(5, 7)) - 1];

  return (
    <figure className="mb-5">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${meta.shortTitle}, ${quarter}: ${months.map((m) => `${label(m.period)} ${fmt(m.value)}`).join(", ")}`}
        className="w-full block"
      >
        {meta.baseline !== undefined && (
          <>
            <line x1={padL - 24} x2={W - padR + 24} y1={y(meta.baseline)} y2={y(meta.baseline)} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
            <text x={W - padR + 28} y={y(meta.baseline) + 4} fontSize="11" className="fill-gray-400">{meta.baseline}</text>
          </>
        )}
        <path d={line} fill="none" stroke={meta.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {months.map((m, i) => {
          const above = meta.baseline !== undefined && m.value < meta.baseline ? false : true;
          const ly = above ? y(m.value) - 12 : y(m.value) + 20;
          return (
            <g key={m.date}>
              <circle cx={x(i)} cy={y(m.value)} r="5" fill={meta.color} stroke="#ffffff" strokeWidth="2">
                <title>{`${label(m.period)}: ${fmt(m.value)} ${meta.unit}`}</title>
              </circle>
              <text x={x(i)} y={ly} textAnchor="middle" fontSize="13" fontWeight="600" className="fill-gray-900">{fmt(m.value)}</text>
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" className="fill-gray-500">{label(m.period)}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-xs text-gray-500 mt-1">
        {meta.shortTitle}, {label(months[0]!.period)} to {label(months[months.length - 1]!.period)}{" "}
        {months[0]!.period.slice(0, 4)}, by month measured. {meta.unit}.
      </figcaption>
    </figure>
  );
}
