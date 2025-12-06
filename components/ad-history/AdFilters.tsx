"use client";

import { m } from "framer-motion";
import { Search, Filter } from "lucide-react";

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
  selectedTone: string;
  onToneChange: (tone: string) => void;
  platforms: string[];
  tones: string[];
};

export function AdFilters({
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  selectedTone,
  onToneChange,
  platforms,
  tones
}: Props) {
  return (
    <m.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-cream border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
      <div className="relative rounded-3xl border-3 border-black bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-ink" />
          <p className="text-lg font-black text-ink">Filters</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-2xl border-3 border-black bg-white pl-12 pr-5 py-3 text-base font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-mustard/30"
            />
          </div>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="w-full rounded-2xl border-3 border-black bg-white px-5 py-3 text-base font-bold text-black focus:outline-none focus:ring-4 focus:ring-mustard/30 appearance-none"
          >
            <option value="">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </option>
            ))}
          </select>

          {/* Tone Filter */}
          <select
            value={selectedTone}
            onChange={(e) => onToneChange(e.target.value)}
            className="w-full rounded-2xl border-3 border-black bg-white px-5 py-3 text-base font-bold text-black focus:outline-none focus:ring-4 focus:ring-mustard/30 appearance-none"
          >
            <option value="">All Tones</option>
            {tones.map((tone) => (
              <option key={tone} value={tone}>
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </m.div>
  );
}
