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
  name: string;
  platform: string | null;
  category: string | null;
  description: string | null;
  source: string | null;
  score: number | null;
  velocity: number | null;
  raw_data: unknown;
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
  brand_colors: string[] | null;
  product: string | null;
  audience: string | null;
  goal: string | null;
  company_description: string | null;
  targeted_keywords: string[] | null;
  platform_preference: string | null;
  created_at?: string;
};
