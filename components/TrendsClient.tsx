"use client";

import { useState, useMemo } from "react";
import { m } from "framer-motion";
import type { CreativePattern, TrendTopic } from "@/types/db";

type Props = {
  trends: TrendTopic[];
  patterns: CreativePattern[];
};

export function TrendsClient({ trends, patterns }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const filteredTrends = useMemo(() => {
    if (selectedPlatform === "all") return trends;
    return trends.filter((t) => t.platform.toLowerCase() === selectedPlatform.toLowerCase());
  }, [trends, selectedPlatform]);

  const platforms = useMemo(() => {
    const allPlatforms = new Set(trends.map((t) => t.platform.toLowerCase()));
    return ["all", ...Array.from(allPlatforms)];
  }, [trends]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-20">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center rounded-full bg-forest px-6 py-2 text-white shadow-pill border-3 border-black">
            <span className="text-lg font-bold">Live Radar</span>
          </div>
        </div>
        <h1 className="text-5xl font-black text-ink tracking-tight">Trends Radar</h1>
        <p className="mt-3 text-xl font-bold text-black/60">Fresh topics + creative patterns feeding the ad brain.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPlatform(p)}
            className={`rounded-xl border-3 border-black px-6 py-2 text-sm font-bold uppercase tracking-wide shadow-hard-sm transition-all hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
              selectedPlatform === p ? "bg-punch text-white" : "bg-white text-black"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {filteredTrends.length === 0 && (
        <div className="rounded-3xl border-3 border-dashed border-black/20 bg-black/5 p-8 text-center text-xl font-bold text-black/40">
          No trends found for this filter.
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredTrends.map((trend, idx) => (
          <m.div
            key={`${trend.platform}-${trend.id}-${idx}`}
            className="relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-punch border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
            <div className="relative h-full rounded-3xl border-3 border-black bg-white p-6 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  {trend.platform}
                </span>
                <span className="font-black text-black/40 text-xs uppercase tracking-wide">{trend.category || "general"}</span>
              </div>
              
              <p className="text-2xl font-black leading-tight text-ink mb-2">{trend.name}</p>
              <p className="text-base font-medium text-black/80 flex-grow">
                {trend.description && trend.description.length > 140
                  ? `${trend.description.slice(0, 140)}...`
                  : trend.description || "Trending now"}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {trend.source && (
                  <span className="rounded-lg border-2 border-black bg-cream px-3 py-1 text-xs font-bold text-black">
                    Source: {trend.source}
                  </span>
                )}
                {trend.score && (
                  <span className="rounded-lg border-2 border-black bg-mustard px-3 py-1 text-xs font-bold text-black">
                    Score {trend.score}
                  </span>
                )}
              </div>
            </div>
          </m.div>
        ))}
      </div>

      <div className="relative group mt-12">
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-[2.5rem] bg-black border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
        <div className="relative rounded-[2.5rem] border-3 border-black bg-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-full border-3 border-black bg-mustard px-5 py-2 text-lg font-bold text-black shadow-hard-sm">Patterns</div>
            <p className="text-xl font-bold text-black/60">Reusable creative shapes the LLM leans on.</p>
          </div>
          
          {patterns.length === 0 && (
            <p className="text-lg font-bold text-black/40">No creative patterns yet. Seed `creative_patterns` in Supabase.</p>
          )}
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {patterns.map((pattern, idx) => (
              <m.div
                key={`${pattern.id}-${idx}`}
                className="rounded-2xl border-3 border-black bg-cream p-5 hover:bg-white transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs uppercase tracking-wide text-black/40">{pattern.platform || "any"}</span>
                </div>
                <p className="text-xl font-black text-ink mb-1">{pattern.name}</p>
                <p className="text-sm font-bold text-black/70">{pattern.description}</p>
                {pattern.example_usage && (
                  <div className="mt-3 rounded-xl border-2 border-black/10 bg-black/5 p-3">
                    <p className="text-xs font-bold text-black/60">e.g. {pattern.example_usage}</p>
                  </div>
                )}
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
