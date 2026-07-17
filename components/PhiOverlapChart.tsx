"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";

export interface OverlapPoint {
  date: string;     // data-month, YYYY-MM
  phi2: number | null;
  classic: number | null;
}

export default function PhiOverlapChart({ data }: { data: OverlapPoint[] }) {
  return (
    <div className="my-6">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: "11px" }} tickLine={false} minTickGap={24} />
            <YAxis stroke="#6b7280" style={{ fontSize: "11px" }} tickLine={false} width={36} domain={["auto", "auto"]} />
            <ReferenceLine y={100} stroke="#9ca3af" strokeDasharray="4 4" label={{ value: "100 = normal", position: "insideTopLeft", fontSize: 10, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "6px 10px", fontSize: "12px" }}
              formatter={(v: number, name: string) => [v == null ? "—" : v.toFixed(1), name]}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line type="monotone" dataKey="phi2" name="PHI 2.0 (re-based, 100 = 2023–25 normal)" stroke="#f59e0b" strokeWidth={2.5} dot={false} connectNulls />
            <Line type="monotone" dataKey="classic" name="PHI-Classic (legacy, own scale)" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Both series rise together out of the late-2025 trough — the level gap is the re-basing, not a change in
        health. PHI-Classic is shown on its own legacy scale and aligned to data-month (it was published on a
        one-month release lag).
      </p>
    </div>
  );
}
