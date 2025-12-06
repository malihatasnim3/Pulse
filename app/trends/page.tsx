import { createServerSupabaseClient } from "@/lib/supabase";
import { TrendsClient } from "@/components/trends/TrendsClient";
import type { CreativePattern, TrendTopic } from "@/types/db";

export default async function TrendsPage() {
  const supabase = createServerSupabaseClient();

  const { data: trends, error: trendsError } = await supabase
    .from("trend_topics")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: patterns, error: patternsError } = await supabase
    .from("creative_patterns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (trendsError) {
    console.error("[/trends] trend_topics query failed", trendsError);
  }
  if (patternsError) {
    console.error("[/trends] creative_patterns query failed", patternsError);
  }
  console.log("[/trends] fetched", {
    trends: trends?.length || 0,
    patterns: patterns?.length || 0
  });

  return <TrendsClient trends={(trends as TrendTopic[]) || []} patterns={(patterns as CreativePattern[]) || []} />;
}
