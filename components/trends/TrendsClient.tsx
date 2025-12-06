"use client";

import type { CreativePattern, TrendTopic } from "@/types/db";
import { Sparkles, TrendingUp } from "lucide-react";

import { m } from "framer-motion";
import { useState } from "react";

type Props = {
  trends: TrendTopic[];
  patterns: CreativePattern[];
};

export function TrendsClient({ trends, patterns }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const platforms = [
    "all",
    ...new Set(trends.map((t) => t.platform).filter((value): value is string => Boolean(value)))
  ];
  const categories = [
    "all",
    ...new Set(trends.map((t) => t.category).filter((value): value is string => Boolean(value)))
  ];

  const filteredTrends = trends.filter((trend) => {
    const matchesPlatform = selectedPlatform === "all" || trend.platform === selectedPlatform;
    const matchesCategory = selectedCategory === "all" || trend.category === selectedCategory;
    return matchesPlatform && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-black text-ink tracking-tight">Trends Radar</h1>
        <p className="mt-3 text-xl font-bold text-black/60">
          Live cultural moments and creative patterns powering your ads.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 justify-center">
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`rounded-full border-3 border-black px-6 py-2 text-sm font-bold transition-all ${
              selectedPlatform === platform
                ? "bg-punch text-white shadow-hard-sm"
                : "bg-white text-ink hover:bg-cream"
            }`}
          >
            {platform === "all" ? "All Platforms" : platform.charAt(0).toUpperCase() + platform.slice(1)}
          </button>
        ))}
      </div>

      {/* Trends Grid */}
      {filteredTrends.length === 0 ? (
        <m.div
          className="relative group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-black border-3 border-black" />
          <div className="relative rounded-3xl border-3 border-black bg-cream p-12 text-center">
            <p className="text-2xl font-black text-ink">No trends yet</p>
            <p className="mt-2 text-lg font-medium text-black/60">
              Generate personalized trends from the Company page.
            </p>
          </div>
        </m.div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrends.map((trend, index) => (
            <m.div
              key={trend.id}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-forest border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
              <div className="relative rounded-3xl border-3 border-black bg-white p-6">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="h-5 w-5 text-forest" />
                  <div className="flex gap-2">
                    {trend.score && (
                      <div className="rounded-full border-2 border-black bg-mustard px-3 py-1 text-xs font-black">
                        {trend.score}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm font-black uppercase tracking-wide text-black/40">
                  {trend.platform || "General"}
                </p>
                <h3 className="mt-2 text-xl font-black text-ink leading-tight">{trend.name}</h3>
                <p className="mt-3 text-sm font-medium text-black/70 line-clamp-3">
                  {trend.description || "Trending topic"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {trend.category && (
                    <div className="rounded-lg border-2 border-black bg-cream px-3 py-1 text-xs font-bold">
                      {trend.category}
                    </div>
                  )}
                  {trend.source && (
                    <div className="rounded-lg border-2 border-black bg-cream px-3 py-1 text-xs font-bold">
                      {trend.source}
                    </div>
                  )}
                </div>

                {trend.velocity && (
                  <div className="mt-3 pt-3 border-t-2 border-black/10">
                    <p className="text-xs font-bold text-black/60">
                      Velocity: <span className="text-punch">{trend.velocity}</span>
                    </p>
                  </div>
                )}

                <div className="mt-3 text-xs font-medium text-black/40">
                  {new Date(trend.created_at).toLocaleDateString()}
                </div>
              </div>
            </m.div>
          ))}
        </div>
      )}

      {/* Creative Patterns */}
      {patterns.length > 0 && (
        <m.div
          className="relative group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-punch border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
          <div className="relative rounded-3xl border-3 border-black bg-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-punch" />
              <div>
                <h2 className="text-2xl font-black text-ink">Creative Patterns</h2>
                <p className="text-base font-bold text-black/60">Reusable creative frameworks</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {patterns.map((pattern, index) => (
                <m.div
                  key={pattern.id}
                  className="rounded-2xl border-2 border-black bg-cream p-5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <p className="text-xs font-black uppercase tracking-wide text-black/40">
                    {pattern.platform || "Universal"}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-ink">{pattern.name}</h3>
                  <p className="mt-2 text-sm font-medium text-black/70">{pattern.description}</p>
                  {pattern.example_usage && (
                    <p className="mt-3 text-xs font-bold text-black/60">
                      Example: {pattern.example_usage}
                    </p>
                  )}
                </m.div>
              ))}
            </div>
          </div>
        </m.div>
      )}
    </div>
  );
}
