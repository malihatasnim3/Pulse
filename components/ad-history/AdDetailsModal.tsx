"use client";

import { AnimatePresence, m } from "framer-motion";

import { AdVariantCard } from "@/components/AdVariantCard";
import type { GeneratedAdVariant } from "@/lib/llm";
import { X } from "lucide-react";

type Strategy = {
  positioning?: string;
  angle?: string;
  key_messages?: string[];
  suggested_layout?: string;
  color_rationale?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  productName: string;
  platform: string;
  tone: string;
  createdAt: string;
  ads: GeneratedAdVariant[];
  strategy?: Strategy;
};

export function AdDetailsModal({
  isOpen,
  onClose,
  projectName,
  productName,
  platform,
  tone,
  createdAt,
  ads,
  strategy
}: Props) {
  const date = new Date(createdAt).toLocaleString();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <m.div
            className="fixed inset-4 md:inset-10 lg:inset-20 z-50 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative h-full">
              {/* Shadow */}
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-black border-3 border-black" />

              {/* Content */}
              <div className="relative h-full rounded-3xl border-3 border-black bg-white overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b-3 border-black bg-cream">
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-wide text-black/40">{productName}</p>
                    <h2 className="text-3xl font-black text-ink mt-1">{projectName}</h2>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-bold capitalize">
                        {platform}
                      </div>
                      <div className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-bold capitalize">
                        {tone}
                      </div>
                      <div className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-medium text-black/60">
                        {date}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full border-3 border-black bg-white p-2 hover:bg-punch hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Strategy */}
                  {strategy?.positioning && (
                    <div className="relative group">
                      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-punch border-3 border-black" />
                      <div className="relative space-y-4 rounded-3xl border-3 border-black bg-white p-6">
                        <p className="text-sm font-black uppercase tracking-wide text-black/40">Strategy</p>
                        <p className="text-2xl font-black text-ink leading-tight">{strategy.positioning}</p>
                        {strategy.angle && <p className="text-base font-medium text-black/80">{strategy.angle}</p>}
                        {strategy.key_messages && strategy.key_messages.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {strategy.key_messages.map((msg, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg border-2 border-black bg-cream px-3 py-2 text-sm font-bold"
                              >
                                {msg}
                              </div>
                            ))}
                          </div>
                        )}
                        {strategy.suggested_layout && (
                          <div className="mt-2 text-sm text-black/80">
                            <p className="font-black">Layout</p>
                            <p>{strategy.suggested_layout}</p>
                          </div>
                        )}
                        {strategy.color_rationale && (
                          <div className="mt-2 text-sm text-black/80">
                            <p className="font-black">Color rationale</p>
                            <p>{strategy.color_rationale}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Variants */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-full border-3 border-black bg-forest px-4 py-1 text-sm font-bold text-white shadow-hard-sm">
                        Variants
                      </div>
                      <p className="text-lg font-bold text-black/60">{ads.length} static ads generated</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {ads.map((variant, idx) => (
                        <AdVariantCard key={idx} variant={variant} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
