"use client";

import { m } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { GeneratedAdVariant } from "@/lib/llm";

type Props = {
  variant: GeneratedAdVariant;
  showPrompt?: boolean;
  trendNames?: string[];
};

export function AdVariantCard({ variant, showPrompt = true, trendNames }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <m.div
      className="relative group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Offset Background Blob */}
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-mustard border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />

      <div className="relative rounded-3xl border-3 border-black bg-white p-5">
        {variant.image_url ? (
          <div className="relative mb-4 overflow-hidden rounded-2xl border-3 border-black">
            <Image
              src={variant.image_url}
              alt={variant.hook}
              width={800}
              height={800}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border-3 border-dashed border-black/20 bg-black/5 p-8 text-center text-lg font-bold text-black/40">
            Image pending...
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {variant.platform}
          </span>
          <span className="font-bold text-black/40">#{variant.variant_index}</span>
        </div>
        
        <p className="text-2xl font-black leading-tight text-black">{variant.hook}</p>
        <p className="mt-2 text-base font-medium text-black/80 whitespace-pre-line">{variant.body}</p>
        
        <div className="mt-4 flex justify-start">
          <p className="inline-flex rounded-xl border-2 border-black bg-punch px-4 py-2 text-sm font-bold text-white shadow-hard-sm">
            {variant.cta}
          </p>
        </div>

        <div className="mt-5 rounded-xl border-2 border-black bg-cream p-4">
          <p className="font-black text-sm uppercase tracking-wide text-black/60">Why this works</p>
          <p className="mt-1 text-sm font-bold text-black">{variant.design_explanation}</p>
        </div>

        {trendNames && trendNames.length > 0 && (
          <div className="mt-3 rounded-xl border-2 border-black bg-white p-3 text-xs font-black text-black">
            Trends targeted: <span className="font-semibold">{trendNames.slice(0, 6).join(", ")}</span>
          </div>
        )}

        {showPrompt && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-4 text-xs font-bold uppercase tracking-wide text-black/40 hover:text-punch"
          >
            {open ? "Hide" : "Show"} prompt
          </button>
        )}

        {open && (
          <pre className="mt-2 whitespace-pre-wrap rounded-xl border-2 border-black bg-black p-4 text-xs font-mono text-white">
            {variant.nano_visual_prompt}
          </pre>
        )}
      </div>
    </m.div>
  );
}
