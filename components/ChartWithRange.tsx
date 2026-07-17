"use client";

import { useState } from "react";
import IndicatorChart from "@/components/IndicatorChart";
import type { DataPoint } from "@/lib/types";

const RANGES: { label: string; months: number }[] = [
  { label: "ALL", months: Infinity },
  { label: "1Y", months: 12 },
  { label: "6M", months: 6 },
  { label: "3M", months: 3 },
];

export default function ChartWithRange({
  title, data, color, unit,
}: { title: string; data: DataPoint[]; color: string; unit: string }) {
  const [range, setRange] = useState("ALL");
  const months = RANGES.find((r) => r.label === range)?.months ?? Infinity;
  const filtered = months === Infinity ? data : data.slice(-months);

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
      <IndicatorChart data={filtered} color={color} unit={unit} />
    </>
  );
}
