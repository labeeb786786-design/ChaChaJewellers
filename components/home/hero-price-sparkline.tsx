"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";

import { formatGBP } from "@/lib/gold";

/**
 * Compact 30-day gold trajectory shown inside the hero market widget.
 *
 * Placeholder data only — driven by the mocked 24k gram history (no 22k figure
 * is passed in or derived here). Swap the source in lib/gold.ts for a live
 * metals feed when a backend exists.
 */
export function HeroPriceSparkline({
  points,
}: {
  points: { date: string; value: number }[];
}) {
  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
          <defs>
            <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2c565" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#e2c565" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
          <Tooltip
            cursor={{ stroke: "rgba(226,197,101,0.4)", strokeWidth: 1 }}
            contentStyle={{
              background: "#13110e",
              border: "1px solid rgba(201,162,39,0.4)",
              borderRadius: 8,
              color: "#faf6ee",
              fontSize: 12,
              padding: "4px 8px",
            }}
            labelStyle={{ color: "#e2c565", fontSize: 11 }}
            formatter={(value) => [formatGBP(Number(value)), "24k / g"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#e2c565"
            strokeWidth={2}
            fill="url(#heroSparkFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
