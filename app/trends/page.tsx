import type { CreativePattern } from "@/types/db";
import { TrendsClient } from "@/components/TrendsClient";
import { createServerSupabaseClient } from "@/lib/supabase";
import { TrendsClient } from "@/components/trends/TrendsClient";
import type { CreativePattern, TrendTopic } from "@/types/db";

export default async function TrendsPage() {
  const supabase = createServerSupabaseClient();

  const { data: patterns, error: patternsError } = await supabase
    .from("creative_patterns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (patternsError) {
    console.error("[/trends] creative_patterns query failed", patternsError);
  }
  console.log("[/trends] fetched patterns", {
    patterns: patterns?.length || 0
  });

  return <TrendsClient trends={[]} patterns={(patterns as CreativePattern[]) || []} />;
}
