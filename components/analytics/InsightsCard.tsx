"use client";

import { m } from "framer-motion";
import { Sparkles } from "lucide-react";

type Props = {
  insights: string;
  delay?: number;
};

export function InsightsCard({ insights, delay = 0 }: Props) {
  return (
    <m.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-punch border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
      <div className="relative rounded-3xl border-3 border-black bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-punch" />
          <p className="text-lg font-black text-ink">AI Insights</p>
        </div>
        <p className="text-base font-medium text-black/80 leading-relaxed">{insights}</p>
      </div>
    </m.div>
  );
}
