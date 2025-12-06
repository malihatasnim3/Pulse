import { NormalizedTrendTopic } from "./types";

export async function fetchRedditTopics(subreddits: string[]): Promise<NormalizedTrendTopic[]> {
  const topics: NormalizedTrendTopic[] = [];
  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/top.json?t=day&limit=20`, {
        headers: { "User-Agent": "pulse-trend-fetcher/1.0" },
        cache: "no-store"
      });
      const json = await res.json();
      const children: any[] = json?.data?.children || [];
      children.forEach((child) => {
        const data = child.data;
        topics.push({
          name: data?.title,
          platform: "reddit",
          category: sub,
          description: data?.selftext?.slice(0, 140) || null,
          source: "reddit_api",
          score: data?.ups ?? null,
          velocity: data?.upvote_ratio ? Number(data.upvote_ratio) : null,
          raw_data: data
        });
      });
    } catch (err) {
      console.error(`Reddit fetch failed for /r/${sub}`, err);
    }
  }
  return topics;
}
