"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DataPoint } from "@/lib/types";
import { formatDateShort } from "@/lib/utils";

interface IndicatorChartProps {
  data: DataPoint[];
  color: string;
  unit: string;
}

export default function IndicatorChart({ data, color, unit }: IndicatorChartProps) {
  // Format data for Recharts
  const chartData = data.map((point) => ({
    date: point.date,
    displayDate: formatDateShort(point.date),
    value: point.value,
  }));

  // Zoom the y-axis to the data range (with padding) instead of anchoring at 0,
  // so tight-band series like Social Capital (100–101) show their variation.
  const values = chartData.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;
  const pad = range === 0 ? Math.max(1, Math.abs(dataMax) * 0.05) : range * 0.15;
  const yDomain: [number, number] = [dataMin - pad, dataMax + pad];

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayDate"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            domain={yDomain}
            tickFormatter={(v: number) => v.toFixed(range < 5 ? 1 : 0)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: "8px" }}
            formatter={(value: number) => [value.toFixed(2), unit]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
