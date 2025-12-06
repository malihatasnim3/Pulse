const SERP_ENDPOINT = "https://serpapi.com/search.json";

export type SerpNewsResult = {
  title: string;
  snippet: string;
  link: string;
  source?: string;
  date?: string;
  thumbnail?: string;
};

export async function fetchSerpNews(query: string, limit = 3): Promise<SerpNewsResult[]> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    throw new Error("SERP_API_KEY is missing.");
  }

  const url = new URL(SERP_ENDPOINT);
  url.searchParams.set("engine", "google_news");
  url.searchParams.set("q", query);
  url.searchParams.set("gl", "us");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", String(Math.min(limit * 2, 10))); // fetch a few extras for dedupe

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`SERP API returned ${response.status}`);
  }
  const json = await response.json();
  const results: SerpNewsResult[] = Array.isArray(json?.news_results)
    ? json.news_results
        .slice(0, limit)
        .map((item: any) => ({
          title: String(item?.title ?? "Untitled"),
          snippet: String(item?.snippet ?? item?.title ?? ""),
          link: String(item?.link ?? ""),
          source: item?.source,
          date: item?.date,
          thumbnail: item?.thumbnail
        }))
    : [];
  return results.filter((item) => Boolean(item.title));
}
