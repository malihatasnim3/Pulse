"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import type { AdGeneration, AdProject } from "@/types/db";
import { AdVariantCard } from "./AdVariantCard";

type Props = {
  generations: (AdGeneration & { project?: AdProject | null })[];
};

export function AdHistoryClient({ generations }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-punch px-3 py-1 text-xs font-semibold text-white shadow-pill">History</div>
        <div>
          <h1 className="text-3xl font-semibold">Ad History</h1>
          <p className="text-sm text-black/60">Everything we generated, tied to its project.</p>
        </div>
      </div>

      {generations.length === 0 && (
        <p className="text-sm text-black/60">No generations yet. Build your first ad in the builder.</p>
      )}

      <div className="space-y-3">
        {generations.map((gen) => (
          <HistoryRow key={gen.id} generation={gen} />
        ))}
      </div>
    </div>
  );
}

function HistoryRow({ generation }: { generation: AdGeneration & { project?: AdProject | null } }) {
  const [open, setOpen] = useState(false);
  const ads = Array.isArray(generation.ads) ? (generation.ads as any[]) : [];
  const strategy = (generation.strategy as any) || {};

  return (
    <m.div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-tight text-black/50">{generation.platform}</p>
          <p className="text-lg font-semibold text-ink">{generation.project?.name || "Untitled project"}</p>
          <p className="text-sm text-black/60">{new Date(generation.created_at).toLocaleString()}</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-black/5 px-3 py-2 text-xs font-semibold text-ink hover:bg-black/10"
        >
          {open ? "Hide" : "Open"} variants
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-3 overflow-hidden">
            {strategy.positioning && (
              <div className="rounded-lg bg-black/5 p-3 text-sm text-black/70">
                <p className="font-semibold text-ink">Strategy</p>
                <p>{strategy.positioning}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ads.map((variant, idx) => (
                <AdVariantCard key={idx} variant={variant} showPrompt={false} />
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
