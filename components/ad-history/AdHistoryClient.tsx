"use client";

import { useState, useMemo } from "react";
import { m } from "framer-motion";
import { AdFilters } from "./AdFilters";
import { AdCard } from "./AdCard";
import { AdDetailsModal } from "./AdDetailsModal";
import type { AdGeneration, AdProject } from "@/types/db";

type AdVariant = {
  variant_index?: number;
  hook?: string;
  body?: string;
  cta?: string;
  image_url?: string;
  dominant_color?: string;
  nano_visual_prompt?: string;
  design_explanation?: string;
};

type Strategy = {
  positioning?: string;
  angle?: string;
  key_messages?: string[];
  suggested_layout?: string;
  color_rationale?: string;
};

type Props = {
  generations: (AdGeneration & { project?: AdProject | null })[];
};

const ITEMS_PER_PAGE = 20;

export function AdHistoryClient({ generations }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedAd, setSelectedAd] = useState<(AdGeneration & { project?: AdProject | null }) | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Extract unique platforms and tones
  const platforms = useMemo(() => {
    return [...new Set(generations.map((g) => g.platform).filter(Boolean))].sort();
  }, [generations]);

  const tones = useMemo(() => {
    return [...new Set(generations.map((g) => g.tone).filter(Boolean))].sort();
  }, [generations]);

  // Filter generations
  const filteredGenerations = useMemo(() => {
    return generations.filter((gen) => {
      const projectName = gen.project?.name || "";
      const productName = gen.project?.product || "";

      const matchesSearch =
        !searchQuery ||
        projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        productName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlatform = !selectedPlatform || gen.platform === selectedPlatform;
      const matchesTone = !selectedTone || gen.tone === selectedTone;

      return matchesSearch && matchesPlatform && matchesTone;
    });
  }, [generations, searchQuery, selectedPlatform, selectedTone]);

  const visibleGenerations = filteredGenerations.slice(0, visibleCount);
  const hasMore = visibleCount < filteredGenerations.length;

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-10 pb-20">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-ink tracking-tight">Ad History</h1>
          <p className="mt-3 text-xl font-bold text-black/60">
            Browse all your generated ads across projects and campaigns.
          </p>
        </div>

        {/* Filters */}
        <AdFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPlatform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          selectedTone={selectedTone}
          onToneChange={setSelectedTone}
          platforms={platforms}
          tones={tones}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-black/60">
            {filteredGenerations.length === 0
              ? "No ads found"
              : `${filteredGenerations.length} ${filteredGenerations.length === 1 ? "ad" : "ads"} found`}
          </p>
          {(searchQuery || selectedPlatform || selectedTone) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedPlatform("");
                setSelectedTone("");
              }}
              className="text-sm font-bold text-punch hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Ad Grid */}
        {visibleGenerations.length === 0 ? (
          <m.div
            className="relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-black border-3 border-black" />
            <div className="relative rounded-3xl border-3 border-black bg-cream p-12 text-center">
              <p className="text-2xl font-black text-ink">No ads yet</p>
              <p className="mt-2 text-lg font-medium text-black/60">
                Start creating ads in the Ad Builder to see them here.
              </p>
            </div>
          </m.div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {visibleGenerations.map((gen, index) => {
              const ads = Array.isArray(gen.ads) ? (gen.ads as AdVariant[]) : [];
              const projectName = gen.project?.name || "Untitled Project";
              const productName = gen.project?.product || "Unknown Product";

              return (
                <AdCard
                  key={gen.id}
                  id={gen.id}
                  projectName={projectName}
                  productName={productName}
                  platform={gen.platform}
                  tone={gen.tone || "unknown"}
                  createdAt={gen.created_at}
                  ads={ads}
                  delay={index * 0.05}
                  onClick={() => setSelectedAd(gen)}
                />
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center">
            <m.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              className="rounded-full border-3 border-black bg-mustard px-8 py-4 text-lg font-bold text-ink shadow-hard hover:-translate-y-1 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Load More ({filteredGenerations.length - visibleCount} remaining)
            </m.button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedAd && (
        <AdDetailsModal
          isOpen={!!selectedAd}
          onClose={() => setSelectedAd(null)}
          projectName={selectedAd.project?.name || "Untitled Project"}
          productName={selectedAd.project?.product || "Unknown Product"}
          platform={selectedAd.platform}
          tone={selectedAd.tone || "unknown"}
          createdAt={selectedAd.created_at}
          ads={Array.isArray(selectedAd.ads) ? (selectedAd.ads as AdVariant[]) : []}
          strategy={(selectedAd.strategy as Strategy) || {}}
        />
      )}
    </>
  );
}
