"use client";

import { m } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { GeneratedAdVariant } from "@/lib/llm";

type Props = {
  variant: GeneratedAdVariant;
  showPrompt?: boolean;
};

export function AdVariantCard({ variant, showPrompt = true }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <m.div
      className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {variant.image_url ? (
        <div className="relative mb-3 overflow-hidden rounded-xl border border-black/5">
          <Image
            src={variant.image_url}
            alt={variant.hook}
            width={800}
            height={800}
            className="h-auto w-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-dashed border-black/10 bg-black/5 p-6 text-sm text-black/50">
          Image pending from Nano Banana Pro...
        </div>
      )}

      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-tight text-black/60">
        <span>{variant.platform}</span>
        <span>Variant #{variant.variant_index}</span>
      </div>
      <p className="text-lg font-semibold text-ink">{variant.hook}</p>
      <p className="mt-1 text-sm text-black/70 whitespace-pre-line">{variant.body}</p>
      <p className="mt-3 inline-flex rounded-full bg-punch px-3 py-1 text-xs font-semibold text-white">
        {variant.cta}
      </p>

      <div className="mt-4 rounded-lg bg-black/5 p-3 text-sm text-black/80">
        <p className="font-medium">Why this works</p>
        <p className="mt-1 text-black/70">{variant.design_explanation}</p>
      </div>

      {showPrompt && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 text-xs font-semibold text-punch underline"
        >
          {open ? "Hide" : "Show"} nano banana prompt
        </button>
      )}

      {open && (
        <pre className="mt-2 whitespace-pre-wrap rounded-md bg-black/5 p-3 text-xs text-black/80">
          {variant.nano_visual_prompt}
        </pre>
      )}
    </m.div>
  );
}
