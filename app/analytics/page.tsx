import { createServerSupabaseClient } from "@/lib/supabase";
import { AnalyticsClient } from "@/components/AnalyticsClient";

export default async function AnalyticsPage() {
  const supabase = createServerSupabaseClient();

  const { count: projectsCount = 0 } = await supabase.from("ad_projects").select("*", { count: "exact", head: true });
  const { count: generationsCount = 0 } = await supabase
    .from("ad_generations")
    .select("*", { count: "exact", head: true });

  const { data: platformRows } = await supabase.from("ad_generations").select("platform");
  const generationsByPlatform = (platformRows ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = row.platform || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <AnalyticsClient
      projectsCount={projectsCount || 0}
      generationsCount={generationsCount || 0}
      generationsByPlatform={generationsByPlatform}
    />
  );
}
