import { NormalizedTrendTopic } from "./types";

const SERPAPI_URL = "https://serpapi.com/search.json";

type SerpTrendingNow = {
  trending_searches?: {
    title?: string;
    link?: string;
    traffic_type?: string;
    articles?: Array<{ title?: string; source?: string }>;
  }[];
};

type SerpTimeseries = {
  interest_over_time_graph?: {
    timeline_data?: Array<{
      timestamp?: string;
      values?: Array<{ value?: number }>;
    }>;
  };
};

async function callSerpapi(params: Record<string, string>): Promise<any> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is missing");
  }
  const searchParams = new URLSearchParams({ api_key: apiKey, ...params });
  const url = `${SERPAPI_URL}?${searchParams.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`SerpAPI request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchGoogleTrendsForKeywords(keywords: string[]): Promise<NormalizedTrendTopic[]> {
  const results: NormalizedTrendTopic[] = [];

  // Trending now (US)
  try {
    const trending: SerpTrendingNow = await callSerpapi({
      engine: "google_trends_trending_now",
      hl: "en",
      geo: "US"
    });
    const items = trending.trending_searches || [];
    items.slice(0, 10).forEach((item, idx) => {
      results.push({
        name: item.title || "Trending search",
        platform: "google",
        category: item.traffic_type || null,
        description: item.articles?.[0]?.title || null,
        source: "serpapi_google_trends",
        score: null,
        velocity: null,
        raw_data: { rank: idx + 1, link: item.link }
      });
    });
  } catch (err) {
    console.error("[serpapi] trending_now failed", err);
  }

  // Interest over time per keyword
  const limitedKeywords = keywords.slice(0, 5);
  await Promise.all(
    limitedKeywords.map(async (kw) => {
      try {
        const timeseries: SerpTimeseries = await callSerpapi({
          engine: "google_trends",
          q: kw,
          data_type: "TIMESERIES",
          geo: "US"
        });
        const timeline = timeseries.interest_over_time_graph?.timeline_data || [];
        const latest = timeline.at(-1);
        const prev = timeline.at(-2);
        const current = latest?.values?.[0]?.value ?? null;
        const previous = prev?.values?.[0]?.value ?? null;
        const velocity =
          current !== null && previous !== null ? Number(current) - Number(previous) : current ?? null;
        results.push({
          name: kw,
          platform: "google",
          category: null,
          description: `Search interest for ${kw}`,
          source: "serpapi_google_trends",
          score: current !== null ? Number(current) : null,
          velocity: velocity !== null ? Number(velocity) : null,
          raw_data: latest
        });
      } catch (err) {
        console.error(`[serpapi] timeseries failed for ${kw}`, err);
      }
    })
  );

  return results;
}
