"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";

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

const COLORS: Record<string, string> = {
  revenue: "#10b981",
  ppi: "#3b82f6",
  "completion-rate": "#f97316",
  "knowledge-expansion": "#8b5cf6",
  "social-capital": "#ec4899",
  phi: "#ef4444",
};

export default function YoYChart({ indicators, previousQuarter, currentQuarter }: YoYChartProps) {
  return (
    <div className="my-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        {previousQuarter} vs {currentQuarter}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indicators.map((ind) => {
          const color = COLORS[ind.id] || "#6b7280";
          const data = [
            { period: previousQuarter, value: ind.previous, isCurrent: false },
            { period: currentQuarter, value: ind.current, isCurrent: true },
          ];
          const changePositive = ind.changePercent > 0;
          return (
            <div key={ind.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">{ind.label}</h3>
                <span className={`text-sm font-bold ${changePositive ? "text-green-600" : "text-red-600"}`}>
                  {changePositive ? "+" : ""}
                  {ind.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 4 }}>
                    <XAxis dataKey="period" stroke="#6b7280" style={{ fontSize: "11px" }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" style={{ fontSize: "11px" }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "12px",
                      }}
                      formatter={(v: number) => [v.toFixed(2), ind.unit || ind.label]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.map((entry, i) => (
                        <Cell key={i} fill={entry.isCurrent ? color : `${color}80`} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(v) => (typeof v === "number" ? v.toFixed(1) : "")}
                        style={{ fontSize: "11px", fontWeight: 600, fill: "#374151" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
