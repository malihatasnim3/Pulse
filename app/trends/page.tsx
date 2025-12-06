import { createServerSupabaseClient } from "@/lib/supabase";
import { TrendsClient } from "@/components/TrendsClient";
import type { CreativePattern, TrendTopic } from "@/types/db";

export default async function TrendsPage() {
  const supabase = createServerSupabaseClient();

  const { data: trends } = await supabase
    .from("trend_topics")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: patterns } = await supabase
    .from("creative_patterns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return <TrendsClient trends={(trends as TrendTopic[]) || []} patterns={(patterns as CreativePattern[]) || []} />;
}
