"use client";

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import type { DataPoint } from "@/lib/types";
import { formatDateShort } from "@/lib/utils";

export interface TrendLine {
  key: string;    // the numeric field on each data point, e.g. "ma3"
  label: string;  // legend/tooltip label, e.g. "3-month trend"
  color: string;
  dash?: string;  // strokeDasharray, e.g. "5 4" for the 6-month line
}

interface IndicatorChartProps {
  data: DataPoint[];
  color: string;
  unit: string;
  trends?: TrendLine[];
  baseline?: number;
}

export default function IndicatorChart({ data, color, unit, trends, baseline }: IndicatorChartProps) {
  // Format data for Recharts
  const chartData = data.map((point) => ({
    ...point,
    displayDate: formatDateShort(point.date),
    hours: typeof point.hours === "number" ? point.hours : undefined,
  }));

  // Zoom the left y-axis to the data range (with padding) instead of anchoring at 0,
  // so tight-band series like Social Capital (100–101) show their variation.
  const values = chartData.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;
  const pad = range === 0 ? Math.max(1, Math.abs(dataMax) * 0.05) : range * 0.15;
  const yDomain: [number, number] = [dataMin - pad, dataMax + pad];

  // Secondary "volume" series (PPI total hours), drawn as bars on a right axis.
  // Scale the right axis to ~3x max so bars stay in the lower third under the line,
  // the way trade-volume sits beneath a stock-price line.
  const hourly = chartData.filter((d) => typeof d.hours === "number").map((d) => d.hours as number);
  const hasHours = hourly.length > 0;
  const hoursDomain: [number, number] = [0, hasHours ? Math.max(...hourly) * 3 : 1];

  // When a smoothed trend is on, the raw series steps back so the trend reads as
  // the signal rather than competing with it.
  const hasTrends = (trends?.length ?? 0) > 0;
  const rawStrokeWidth = hasTrends ? 1.5 : 3;
  const rawDotRadius = hasTrends ? 2 : 4;

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          {typeof baseline === "number" && (
            <ReferenceLine
              yAxisId="left"
              y={baseline}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              label={{ value: `Baseline ${baseline}`, position: "insideTopLeft", fill: "#9ca3af", fontSize: 11 }}
            />
          )}
          <XAxis
            dataKey="displayDate"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            domain={yDomain}
            tickFormatter={(v: number) => v.toFixed(range < 5 ? 1 : 0)}
          />
          {hasHours && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
              domain={hoursDomain}
              tickFormatter={(v: number) => v.toFixed(0)}
              label={{ value: "Hours", angle: 90, position: "insideRight", fill: "#9ca3af", fontSize: 12 }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: "8px" }}
            formatter={(value: number, name: string) =>
              // Label each row by its own series name, so raw, 3-month and 6-month
              // are distinguishable when trends are on (they'd otherwise all read
              // as the unit). The raw line's name IS the unit, so it's unchanged.
              name === "Total Hours" ? [`${value.toFixed(0)} h`, name] : [value.toFixed(2), name]
            }
          />
          {hasHours && (
            <Bar
              yAxisId="right"
              dataKey="hours"
              name="Total Hours"
              fill={color}
              fillOpacity={0.22}
              radius={[3, 3, 0, 0]}
            />
          )}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="value"
            name={unit}
            stroke={color}
            strokeWidth={rawStrokeWidth}
            dot={{ fill: color, r: rawDotRadius }}
            activeDot={{ r: 6 }}
          />
          {trends?.map((t) => (
            <Line
              key={t.key}
              yAxisId="left"
              type="monotone"
              dataKey={t.key}
              name={t.label}
              stroke={t.color}
              strokeWidth={2}
              strokeDasharray={t.dash}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
