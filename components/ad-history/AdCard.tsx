"use client";

import { m } from "framer-motion";
import { Calendar, Palette } from "lucide-react";

type AdVariant = {
  variant_index?: number;
  hook?: string;
  body?: string;
  cta?: string;
  image_url?: string;
  dominant_color?: string;
};

type Props = {
  id: string;
  projectName: string;
  productName: string;
  platform: string;
  tone: string;
  createdAt: string;
  ads: AdVariant[];
  delay?: number;
  onClick: () => void;
};

export function AdCard({
  id,
  projectName,
  productName,
  platform,
  tone,
  createdAt,
  ads,
  delay = 0,
  onClick
}: Props) {
  const firstAd = ads[0] || {};
  const thumbnail = firstAd.image_url || "";
  const dominantColor = firstAd.dominant_color || "#CCCCCC";
  const date = new Date(createdAt).toLocaleDateString();
  const variantCount = ads.length;

  return (
    <m.div
      className="relative group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
    >
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-mustard border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
      <div className="relative rounded-3xl border-3 border-black bg-white overflow-hidden">
        {/* Thumbnail */}
        <div className="relative h-48 bg-black/5">
          {thumbnail ? (
            <img src={thumbnail} alt={projectName} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg font-black text-black/20">No Image</p>
            </div>
          )}
          {/* Variant count badge */}
          <div className="absolute top-3 right-3 rounded-full border-2 border-black bg-white px-3 py-1 text-sm font-black text-ink shadow-hard-sm">
            {variantCount} {variantCount === 1 ? "variant" : "variants"}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Title and Product */}
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-black/40">{productName}</p>
            <p className="text-xl font-black text-ink mt-1">{projectName}</p>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg border-2 border-black bg-cream px-3 py-1 text-sm font-bold capitalize">
              {platform}
            </div>
            <div className="rounded-lg border-2 border-black bg-cream px-3 py-1 text-sm font-bold capitalize">
              {tone}
            </div>
          </div>

          {/* Color and Date */}
          <div className="flex items-center justify-between pt-2 border-t-2 border-black/10">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-black/40" />
              <div className="w-6 h-6 rounded border-2 border-black" style={{ backgroundColor: dominantColor }} />
              <span className="text-xs font-mono text-black/60">{dominantColor}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-black/60">
              <Calendar className="h-4 w-4" />
              {date}
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}
