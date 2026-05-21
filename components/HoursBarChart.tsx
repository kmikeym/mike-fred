"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DataPoint } from "@/lib/types";
import { formatDateShort } from "@/lib/utils";

interface HoursBarChartProps {
  data: DataPoint[];
  color: string;
}

export default function HoursBarChart({ data, color }: HoursBarChartProps) {
  // Only months that actually reported tracked hours.
  const chartData = data
    .filter((point) => typeof point.hours === "number")
    .map((point) => ({
      displayDate: formatDateShort(point.date),
      hours: point.hours as number,
    }));

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            tickFormatter={(v: number) => v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: "8px" }}
            formatter={(value: number) => [`${value.toFixed(0)} h`, "Total Hours"]}
          />
          <Bar dataKey="hours" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
