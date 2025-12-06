import { NextResponse } from "next/server";
import { fetchGoogleTrendsForKeywords } from "@/lib/trends/googleTrends";
import { fetchYouTubeTrendingTopics } from "@/lib/trends/youtube";
import { fetchRedditTopics } from "@/lib/trends/reddit";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { fetchPytrendsTopics } from "@/lib/trends/pytrends";

export async function POST() {
  const supabase = createServiceRoleSupabaseClient();

  const usePytrends = process.env.USE_PYTRENDS === "1";

  const [googleTopics, youtubeTopics, redditTopics] = await Promise.all([
    usePytrends
      ? fetchPytrendsTopics(["ai", "fitness", "beauty", "gaming", "finance"])
      : fetchGoogleTrendsForKeywords(["ai", "fitness", "beauty", "gaming", "finance"]),
    fetchYouTubeTrendingTopics(),
    fetchRedditTopics(["marketing", "design", "technology"])
  ]);

  // Merge and dedupe on name+platform to avoid ON CONFLICT double-hit
  const deduped: Record<string, any> = {};
  [...googleTopics, ...youtubeTopics, ...redditTopics].forEach((t) => {
    if (!t.name) return;
    const key = `${t.name}-${t.platform || "any"}`;
    if (!deduped[key]) {
      deduped[key] = t;
    }
  });
  const topics = Object.values(deduped);

  if (topics.length === 0) {
    return NextResponse.json({ inserted: 0, message: "No trends fetched" }, { status: 200 });
  }

  const { error } = await supabase.from("trend_topics").upsert(topics, { onConflict: "name,platform" });
  if (error) {
    console.error("Trend upsert failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: topics.length });
}
