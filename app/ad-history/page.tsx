import { createServerSupabaseClient } from "@/lib/supabase";
import { AdHistoryClient } from "@/components/ad-history/AdHistoryClient";
import type { AdGeneration, AdProject } from "@/types/db";

export const revalidate = 0;

export default async function AdHistoryPage() {
  const supabase = createServerSupabaseClient();

  // Fetch ad_generations with joined ad_projects
  const { data: rows } = await supabase
    .from("ad_generations")
    .select("*, ad_projects(*)")
    .order("created_at", { ascending: false })
    .limit(30);

  // Transform data to match the client component
  const generations: (AdGeneration & { project?: AdProject | null })[] = (rows ?? []).map((row: any) => ({
    ...row,
    project: row.ad_projects || null
  }));

  return <AdHistoryClient generations={generations} />;
}
