import { createServerSupabaseClient } from "@/lib/supabase";
import { AdHistoryClient } from "@/components/AdHistoryClient";
import type { AdGeneration, AdProject } from "@/types/db";

export default async function AdHistoryPage() {
  const supabase = createServerSupabaseClient();
  const { data: rows = [] } = await supabase
    .from("ad_generations")
    .select("*, ad_projects(*)")
    .order("created_at", { ascending: false })
    .limit(30);

  const generations: (AdGeneration & { project?: AdProject | null })[] = rows.map((row: any) => ({
    ...row,
    project: row.ad_projects || null
  }));

  return <AdHistoryClient generations={generations} />;
}
