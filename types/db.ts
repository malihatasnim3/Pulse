export type AdProject = {
  id: string;
  user_id?: string | null;
  company_name: string | null;
  name: string;
  product: string | null;
  audience: string | null;
  goal: string | null;
  platform_preference: string | null;
  brand_colors: string[] | null;
  product_image_urls: string[] | null;
  created_at: string;
};

export type AdGeneration = {
  id: string;
  project_id: string;
  platform: string;
  tone: string | null;
  format: string | null;
  brief: unknown;
  strategy: unknown;
  ads: unknown;
  created_at: string;
  project?: AdProject;
};

export type TrendTopic = {
  id: number;
  user_id?: string | null;
  name: string;
  platform: string | null;
  category: string | null;
  description: string | null;
  source: string | null;
  score: number | null;
  velocity: number | null;
  raw_data: Record<string, unknown> | null;
  company_context?: string | null;
  created_at: string;
};

export type CreativePattern = {
  id: number;
  name: string;
  platform: string | null;
  description: string;
  example_usage: string | null;
  created_at: string;
};

export type CompanyProfile = {
  id?: string;
  user_id: string;
  company_name: string;
  company_description: string | null;
  tagline: string | null;
  mission_statement: string | null;
  brand_voice: string | null;
  brand_colors: string[] | null;
  targeted_keywords: string[] | null;
  target_markets: string[] | null;
  platform_preference: string | null;
  brand_guidelines_url: string | null;
  created_at?: string;
};

export type ProductProfile = {
  id: string;
  user_id: string;
  name: string;
  summary: string | null;
  audience: string | null;
  positioning: string | null;
  benefits: string[] | null;
  price: string | null;
  image_urls: string[] | null;
  status?: string | null;
  created_at: string;
};
