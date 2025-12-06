"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "./ChartCard";
import { InsightsCard } from "./InsightsCard";
import { StatCard } from "./StatCard";
import { m } from "framer-motion";

type Props = {
  totalAds: number;
  totalProducts: number;
  topPlatform: string;
  topTone: string;
  platformCounts: Record<string, number>;
  toneCounts: Record<string, number>;
  adsTimeline: Record<string, number>;
  trendingColors: Record<string, number>;
  recentAds: any[];
  insights: string;
};

const CHART_COLORS = ["#FF3B30", "#FFCC00", "#34C759", "#064E3B", "#1F1D2B"];

export function AnalyticsClient({
  totalAds,
  totalProducts,
  topPlatform,
  topTone,
  platformCounts,
  toneCounts,
  adsTimeline,
  trendingColors,
  recentAds,
  insights
}: Props) {
  const platformData = Object.entries(platformCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const toneData = Object.entries(toneCounts).map(([name, value], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  const timelineData = Object.entries(adsTimeline).map(([date, count]) => ({
    date,
    ads: count
  }));

  const colorData = Object.entries(trendingColors).map(([color, count]) => ({
    color,
    count,
    displayName: color.toUpperCase()
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-20">
      <div className="text-center">
        <h1 className="text-5xl font-black text-ink tracking-tight">Analytics</h1>
        <p className="mt-3 text-xl font-bold text-black/60">
          Track your ad generation patterns and creative trends.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Ads Generated" value={totalAds} delay={0} bgColor="mustard" />
        <StatCard label="Total Products Added" value={totalProducts} delay={0.1} bgColor="cream" />
        <StatCard label="Most Used Platform" value={topPlatform} delay={0.2} bgColor="forest" />
        <StatCard label="Most Used Tone" value={topTone} delay={0.3} bgColor="punch" />
      </div>

      {/* AI Insights */}
      <InsightsCard insights={insights} delay={0.4} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Ads per Platform */}
        <ChartCard title="Ads per Platform" delay={0.5} bgColor="cream">
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1D2B10" />
                <XAxis dataKey="name" tick={{ fill: "#1F1D2B", fontWeight: "bold", fontSize: 12 }} />
                <YAxis tick={{ fill: "#1F1D2B", fontWeight: "bold", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "3px solid #000",
                    borderRadius: "12px",
                    fontWeight: "bold"
                  }}
                />
                <Bar dataKey="value" fill="#FF3B30" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg font-bold text-black/40">No data yet</p>
            </div>
          )}
        </ChartCard>

        {/* Ads Over Time */}
        <ChartCard title="Ads Over Time" delay={0.6} bgColor="mustard">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1D2B10" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#1F1D2B", fontWeight: "bold", fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: "#1F1D2B", fontWeight: "bold", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "3px solid #000",
                    borderRadius: "12px",
                    fontWeight: "bold"
                  }}
                />
                <Line type="monotone" dataKey="ads" stroke="#064E3B" strokeWidth={3} dot={{ fill: "#064E3B", r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg font-bold text-black/40">No data yet</p>
            </div>
          )}
        </ChartCard>

        {/* Tone Distribution */}
        <ChartCard title="Tone Distribution" delay={0.7} bgColor="forest">
          {toneData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={toneData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#000"
                  strokeWidth={2}
                >
                  {toneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "3px solid #000",
                    borderRadius: "12px",
                    fontWeight: "bold"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg font-bold text-black/40">No data yet</p>
            </div>
          )}
        </ChartCard>

        {/* Trending Colors */}
        <ChartCard title="Trending Colors" delay={0.8} bgColor="punch">
          {colorData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={colorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1D2B10" />
                <XAxis dataKey="displayName" tick={{ fill: "#1F1D2B", fontWeight: "bold", fontSize: 10 }} />
                <YAxis tick={{ fill: "#1F1D2B", fontWeight: "bold", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "3px solid #000",
                    borderRadius: "12px",
                    fontWeight: "bold"
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {colorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg font-bold text-black/40">No data yet</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent Ads Table */}
      <m.div
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-black border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
        <div className="relative rounded-3xl border-3 border-black bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full border-3 border-black bg-forest px-4 py-1 text-sm font-bold text-white shadow-hard-sm">
              Recent
            </div>
            <p className="text-xl font-black text-ink">Latest 20 Ads</p>
          </div>

          {recentAds.length === 0 ? (
            <p className="text-lg font-bold text-black/40">No ads generated yet. Start creating!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-3 border-black">
                    <th className="text-left py-3 px-2 text-sm font-black uppercase tracking-wide text-black/60">
                      Image
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-black uppercase tracking-wide text-black/60">
                      Product
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-black uppercase tracking-wide text-black/60">
                      Platform
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-black uppercase tracking-wide text-black/60">
                      Tone
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-black uppercase tracking-wide text-black/60">
                      Color
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-black uppercase tracking-wide text-black/60">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentAds.map((ad, index) => {
                    const imageUrl = ad.ads?.[0]?.image_url || "";
                    const productName =
                      ad.ad_projects?.product_profiles?.name || ad.ad_projects?.product || "Unknown";
                    const dominantColor = ad.ads?.[0]?.dominant_color || "#CCCCCC";
                    const date = new Date(ad.created_at).toLocaleDateString();

                    return (
                      <m.tr
                        key={ad.id}
                        className="border-b border-black/10 hover:bg-cream/50 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + index * 0.02 }}
                      >
                        <td className="py-3 px-2">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt="Ad thumbnail"
                              className="w-12 h-12 rounded-lg border-2 border-black object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg border-2 border-black bg-black/5" />
                          )}
                        </td>
                        <td className="py-3 px-2 text-sm font-bold text-ink">{productName}</td>
                        <td className="py-3 px-2 text-sm font-medium text-black/70 capitalize">{ad.platform}</td>
                        <td className="py-3 px-2 text-sm font-medium text-black/70 capitalize">{ad.tone}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border-2 border-black"
                              style={{ backgroundColor: dominantColor }}
                            />
                            <span className="text-xs font-mono text-black/60">{dominantColor}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm font-medium text-black/60">{date}</td>
                      </m.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </m.div>
    </div>
  );
}
