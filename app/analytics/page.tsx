import { createServerSupabaseClient } from "@/lib/supabase";
import { generateAnalyticsInsights } from "@/lib/analytics-insights";
import { clusterColors, extractColorsFromAds } from "@/lib/color-utils";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";

export default async function AnalyticsPage() {
  const supabase = createServerSupabaseClient();

  // Fetch total ads generated
  const { count: totalAds = 0 } = await supabase
    .from("ad_generations")
    .select("*", { count: "exact", head: true });

  // Fetch total products
  const { count: totalProducts = 0 } = await supabase
    .from("product_profiles")
    .select("*", { count: "exact", head: true });

  // Fetch platform distribution
  const { data: platformRows } = await supabase.from("ad_generations").select("platform");
  const platformCounts = (platformRows ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = row.platform || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Fetch tone distribution
  const { data: toneRows } = await supabase.from("ad_generations").select("tone");
  const toneCounts = (toneRows ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = row.tone || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topTone = Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Fetch ads over time
  const { data: adsOverTime } = await supabase
    .from("ad_generations")
    .select("created_at")
    .order("created_at", { ascending: true });

  const adsTimeline = (adsOverTime ?? []).reduce<Record<string, number>>((acc, row) => {
    const date = new Date(row.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Fetch color data from ad_generations and ad_projects
  const { data: adGenerations } = await supabase
    .from("ad_generations")
    .select("ads, project_id");

  const projectIds = [...new Set((adGenerations ?? []).map((ag) => ag.project_id).filter(Boolean))];

  let brandColors: string[] = [];
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("ad_projects")
      .select("brand_colors")
      .in("id", projectIds);

    brandColors = (projects ?? [])
      .flatMap((p) => p.brand_colors || [])
      .filter(Boolean);
  }

  const adColors = extractColorsFromAds(adGenerations ?? []);
  const allColors = [...brandColors, ...adColors];
  const trendingColors = clusterColors(allColors, 5);

  // Fetch recent ads with joined data
  const { data: recentAds } = await supabase
    .from("ad_generations")
    .select(
      `
      id,
      platform,
      tone,
      ads,
      created_at,
      project_id,
      ad_projects (
        id,
        product,
        product_profiles (
          id,
          name,
          image_url
        )
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  // Generate AI insights
  const insights = await generateAnalyticsInsights({
    totalAds: totalAds || 0,
    totalProducts: totalProducts || 0,
    topPlatform,
    topTone,
    trendingColors: Object.keys(trendingColors).slice(0, 3)
  });

  return (
    <AnalyticsClient
      totalAds={totalAds || 0}
      totalProducts={totalProducts || 0}
      topPlatform={topPlatform}
      topTone={topTone}
      platformCounts={platformCounts}
      toneCounts={toneCounts}
      adsTimeline={adsTimeline}
      trendingColors={trendingColors}
      recentAds={recentAds || []}
      insights={insights}
    />
  );
}
