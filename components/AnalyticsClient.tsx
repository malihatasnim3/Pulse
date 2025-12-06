"use client";

import { m } from "framer-motion";

type Props = {
  projectsCount: number;
  generationsCount: number;
  generationsByPlatform: Record<string, number>;
};

export function AnalyticsClient({ projectsCount, generationsCount, generationsByPlatform }: Props) {
  const platforms = Object.entries(generationsByPlatform);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white shadow-pill">Insights</div>
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="text-sm text-black/60">Simple counts to see how the lab is performing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Projects" value={projectsCount} delay={0} />
        <StatCard label="Generations" value={generationsCount} delay={0.05} />
        <StatCard label="Avg variants / gen" value={generationsCount > 0 ? "3-5" : "—"} delay={0.1} />
      </div>

      <div className="rounded-2xl border-2 border-black/5 bg-white p-4 shadow-card">
        <p className="text-sm font-semibold text-ink">Generations by platform</p>
        <div className="mt-3 space-y-3">
          {platforms.length === 0 && <p className="text-sm text-black/60">No generations yet.</p>}
          {platforms.map(([platform, count], idx) => (
            <m.div key={platform} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
              <div className="flex items-center justify-between text-sm font-medium text-ink">
                <span className="capitalize">{platform}</span>
                <span>{count}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-black/5">
                <div
                  className="h-2 rounded-full bg-punch"
                  style={{ width: `${Math.min(100, count * 12)}%` }}
                />
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, delay }: { label: string; value: number | string; delay: number }) {
  return (
    <m.div
      className="rounded-2xl border-2 border-black/5 bg-white p-4 shadow-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <p className="text-xs uppercase tracking-tight text-black/50">{label}</p>
      <p className="text-3xl font-semibold text-ink">{value}</p>
    </m.div>
  );
}
