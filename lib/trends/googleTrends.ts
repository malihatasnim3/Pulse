import googleTrends from "google-trends-api";
import { NormalizedTrendTopic } from "./types";

export async function fetchGoogleTrendsForKeywords(keywords: string[]): Promise<NormalizedTrendTopic[]> {
  const results: NormalizedTrendTopic[] = [];

  try {
    const dailyRaw = await googleTrends.dailyTrends({ geo: "US" });
    const parsed = JSON.parse(dailyRaw || "{}");
    const stories: any[] = parsed?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

    stories.slice(0, 10).forEach((story: any) => {
      const title = story?.title?.query;
      const related = story?.relatedQueries || [];
      const score = story?.formattedTraffic ? parseInt((story.formattedTraffic || "0").replace(/\D/g, ""), 10) : undefined;
      results.push({
        name: title,
        platform: "google",
        category: story?.title?.category || null,
        description: related?.[0]?.query || story?.snippet || null,
        source: "google_trends",
        score: Number.isFinite(score) ? score : null,
        velocity: null,
        raw_data: story
      });
    });
  } catch (err) {
    console.error("Failed to fetch Google Trends", err);
  }

  // Optional: interest over time for provided keywords to enrich velocity.
  for (const keyword of keywords.slice(0, 5)) {
    try {
      const interest = await googleTrends.interestOverTime({ keyword, geo: "US", endTime: new Date() });
      const parsed = JSON.parse(interest || "{}");
      const timeline: any[] = parsed?.default?.timelineData || [];
      const latest = timeline.at(-1);
      const velocity = latest?.value?.[0] ?? null;
      results.push({
        name: keyword,
        platform: "google",
        category: null,
        description: `Rising search interest for ${keyword}`,
        source: "google_trends",
        score: velocity,
        velocity,
        raw_data: timeline
      });
    } catch (err) {
      console.error(`interestOverTime failed for ${keyword}`, err);
    }
  }

  return results;
}
