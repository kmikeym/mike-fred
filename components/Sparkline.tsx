"use client";

import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
  data: Array<{ date: string; value: number; notes?: string }>;
  color: string;
  minHeight?: number;
}

export default function Sparkline({ data, color, minHeight = 50 }: SparklineProps) {
  // Don't render if insufficient data (need at least 3 points for meaningful trend)
  if (!data || data.length < 3) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={minHeight}>
      <AreaChart
        data={data}
        margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
      >
        <YAxis hide={true} domain={["dataMin", "dataMax"]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.1}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
