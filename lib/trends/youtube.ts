import { google } from "googleapis";
import { NormalizedTrendTopic } from "./types";

export async function fetchYouTubeTrendingTopics(): Promise<NormalizedTrendTopic[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY is missing; skipping YouTube trends.");
    return [];
  }

  const youtube = google.youtube("v3");
  const topics: NormalizedTrendTopic[] = [];

  try {
    const res = await youtube.videos.list({
      key: apiKey,
      chart: "mostPopular",
      part: ["snippet", "statistics"],
      maxResults: 15,
      regionCode: "US"
    });

    const items = res.data.items || [];
    for (const item of items) {
      const snippet = item.snippet;
      const stats = item.statistics;
      if (!snippet) continue;
      const title = snippet.title || "YouTube trending";
      const views = stats?.viewCount ? Number(stats.viewCount) : undefined;
      topics.push({
        name: title,
        platform: "youtube",
        category: snippet.categoryId || null,
        description: snippet.description || snippet.tags?.slice(0, 3).join(", ") || null,
        source: "youtube_api",
        score: views ?? null,
        velocity: stats?.likeCount ? Number(stats.likeCount) : null,
        raw_data: item
      });
    }
  } catch (err) {
    console.error("YouTube trending fetch failed", err);
  }

  return topics;
}
