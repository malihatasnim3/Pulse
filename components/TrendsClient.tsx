"use client";

import { m } from "framer-motion";
import type { CreativePattern, TrendTopic } from "@/types/db";

type Props = {
  trends: TrendTopic[];
  patterns: CreativePattern[];
};

export function TrendsClient({ trends, patterns }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white shadow-pill">Live</div>
        <div>
          <h1 className="text-3xl font-semibold">Trends Radar</h1>
          <p className="text-sm text-black/60">Fresh topics + creative patterns feeding the ad brain.</p>
        </div>
      </div>

      {trends.length === 0 && (
        <div className="rounded-xl border border-black/10 bg-black/5 p-4 text-sm text-black/70">
          No trends found. Check Supabase table `trend_topics` or `/api/sync-trends` ingestion logs.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {trends.map((trend, idx) => (
          <m.div
            key={`${trend.platform}-${trend.id}-${idx}`}
            className="rounded-2xl border-2 border-black/5 bg-white p-4 shadow-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            whileHover={{ rotate: -1.5, y: -2 }}
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-tight text-black/50">
              <span>{trend.platform}</span>
              <span>{trend.category || "general"}</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-ink">{trend.name}</p>
            <p className="mt-1 text-sm text-black/70">{trend.description || "Trending now"}</p>
            <div className="mt-3 flex gap-2 text-xs font-semibold">
              {trend.source && (
                <span className="rounded-full bg-punch/10 px-3 py-1 text-punch">Source: {trend.source}</span>
              )}
              {trend.score && <span className="rounded-full bg-forest/10 px-3 py-1 text-forest">Score {trend.score}</span>}
            </div>
          </m.div>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-black/5 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-punch px-3 py-1 text-xs font-semibold text-white shadow-pill">Patterns</div>
          <p className="text-sm text-black/60">Reusable creative shapes the LLM leans on.</p>
        </div>
        {patterns.length === 0 && (
          <p className="mt-2 text-sm text-black/60">No creative patterns yet. Seed `creative_patterns` in Supabase.</p>
        )}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {patterns.map((pattern, idx) => (
            <m.div
              key={`${pattern.id}-${idx}`}
              className="rounded-xl border border-black/5 bg-black/5 p-3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-tight text-black/50">
                <span>{pattern.platform || "any"}</span>
              </div>
              <p className="mt-1 text-base font-semibold text-ink">{pattern.name}</p>
              <p className="mt-1 text-sm text-black/70">{pattern.description}</p>
              {pattern.example_usage && <p className="mt-2 text-xs text-black/60">e.g. {pattern.example_usage}</p>}
            </m.div>
          ))}
        </div>
      </div>
    </div>
  );
}
