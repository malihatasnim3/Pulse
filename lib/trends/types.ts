export type NormalizedTrendTopic = {
  name: string;
  platform: "google" | "youtube" | "reddit" | "meta" | "tiktok" | string;
  category?: string | null;
  description?: string | null;
  source: string;
  score?: number | null;
  velocity?: number | null;
  raw_data?: unknown;
};
