"use client";

import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { TrendingUp, ArrowUpRight } from "lucide-react";

import goldData from "@/lib/data/gold-prices.json";
import { formatGBP } from "@/lib/gold";

/*
 * Live Gold & Silver Prices — compact homepage widget.
 * ⚠️ MOCK VALUES from lib/data/gold-prices.json. Not live.
 * TODO: replace lib/gold.ts source with a real metals API (needs an API key,
 * fetched server-side). See getGoldPrices() for the swap point.
 */

const chartData = goldData.history.map((h) => ({
  date: h.date,
  price: h.gold22k,
}));

const first = chartData[0]?.price ?? 0;
const last = chartData[chartData.length - 1]?.price ?? 0;
const pctChange = first ? ((last - first) / first) * 100 : 0;

function PriceTile({
  label,
  sub,
  value,
  highlight = false,
}: {
  label: string;
  sub: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-xl border border-gold/40 bg-gold/10 px-4 py-3"
          : "rounded-xl border border-border bg-card px-4 py-3"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-serif text-xl font-bold text-foreground">
        {formatGBP(value)}
      </p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

export function GoldPriceWidget() {
  return (
    <section className="bg-maroon py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
              Today&rsquo;s Market
            </p>
            <h2 className="font-serif text-3xl font-bold text-cream sm:text-4xl">
              Live gold &amp; silver prices
            </h2>
            <p className="mt-3 max-w-md text-cream/70">
              Reference prices per gram in GBP, updated for the South Asian gold
              market. Whether you&rsquo;re buying a bridal set or selling old
              gold, you&rsquo;ll always know where the market stands.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-sm font-medium text-gold-soft">
              <TrendingUp className="size-4" />
              22k up {pctChange.toFixed(1)}% over 30 days
            </div>
            <div className="mt-6">
              <Link
                href="/precious-metals"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold transition-colors hover:text-gold-soft"
              >
                View full price charts
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-cream/10 bg-charcoal p-5 shadow-xl sm:p-6">
            <div className="mb-4 grid grid-cols-3 gap-3">
              <PriceTile label="Gold 22k" sub="per gram" value={goldData.current.gold22k} highlight />
              <PriceTile label="Gold 24k" sub="per gram" value={goldData.current.gold24k} />
              <PriceTile label="Silver" sub="per gram" value={goldData.current.silver} />
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9a227" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#c9a227" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
                  <Tooltip
                    contentStyle={{
                      background: "#13110e",
                      border: "1px solid rgba(201,162,39,0.4)",
                      borderRadius: 8,
                      color: "#faf6ee",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#e2c565" }}
                    formatter={(value) => [formatGBP(Number(value)), "22k / g"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#e2c565"
                    strokeWidth={2}
                    fill="url(#goldFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-center text-[11px] text-cream/40">
              Indicative prices for illustration · as of 18 Jul 2026 · not a live
              feed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
