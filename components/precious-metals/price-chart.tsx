"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { GoldPriceData } from "@/lib/gold";
import { formatGBP } from "@/lib/gold";

type Series = "gold24k" | "gold22k" | "silver";

const SERIES: { key: Series; label: string; color: string }[] = [
  { key: "gold24k", label: "Gold 24k", color: "#e2c565" },
  { key: "gold22k", label: "Gold 22k", color: "#c9a227" },
  { key: "silver", label: "Silver", color: "#9ca3af" },
];

export function PriceChart({ data }: { data: GoldPriceData }) {
  const [active, setActive] = useState<Series>("gold22k");
  const meta = SERIES.find((s) => s.key === active)!;

  const chartData = data.history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    value: h[active],
  }));

  return (
    <div className="rounded-2xl border border-cream/10 bg-charcoal-soft p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-cream">
            30-Day Trend
          </h3>
          <p className="text-sm text-cream/50">GBP per gram · illustrative</p>
        </div>
        <div className="flex gap-1.5 rounded-full border border-cream/10 bg-charcoal p-1">
          {SERIES.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors " +
                (active === s.key
                  ? "bg-gold text-charcoal"
                  : "text-cream/60 hover:text-cream")
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="metalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={meta.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(250,246,238,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(250,246,238,0.4)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fill: "rgba(250,246,238,0.4)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => `£${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: "#0d0d0f",
                border: "1px solid rgba(201,162,39,0.4)",
                borderRadius: 8,
                color: "#faf6ee",
                fontSize: 12,
              }}
              labelStyle={{ color: "#e2c565" }}
              formatter={(value) => [formatGBP(Number(value)), meta.label]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={meta.color}
              strokeWidth={2.5}
              fill="url(#metalFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
