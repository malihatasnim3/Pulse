import type { CompanyProfile } from "@/types/db";

export type CompanyProfileRow = {
  id?: string;
  user_id: string;
  company_name: string | null;
  brand_colors: string[] | null;
  product: string | null;
  audience?: string | null;
  goal?: string | null;
  platform_preference: string | null;
  created_at?: string;
  tagline?: string | null;
  mission_statement?: string | null;
  company_description?: string | null;
  brand_voice?: string | null;
  targeted_keywords?: string[] | null;
  target_markets?: string[] | null;
  brand_guidelines_url?: string | null;
};

type CompanyProfilePayload = {
  tagline?: string | null;
  mission_statement?: string | null;
  company_description?: string | null;
  brand_voice?: string | null;
  targeted_keywords?: string[];
  target_markets?: string[];
  brand_guidelines_url?: string | null;
};

export function hydrateCompanyProfile(row: CompanyProfileRow | null): CompanyProfile | null {
  if (!row) return null;
  const payload = parsePayload(row.product);
  return {
    id: row.id,
    user_id: row.user_id,
    company_name: row.company_name ?? "",
    company_description: coalesce(row.company_description, payload.company_description, ""),
    tagline: coalesce(row.tagline, payload.tagline, null),
    mission_statement: coalesce(row.mission_statement, payload.mission_statement, null),
    brand_voice: coalesce(row.brand_voice, payload.brand_voice, null),
    brand_colors: row.brand_colors ?? [],
    targeted_keywords: coalesce(row.targeted_keywords, payload.targeted_keywords, []),
    target_markets: coalesce(row.target_markets, payload.target_markets, []),
    platform_preference: row.platform_preference ?? "tiktok",
    brand_guidelines_url: coalesce(row.brand_guidelines_url, payload.brand_guidelines_url, null),
    created_at: row.created_at
  };
}

export function buildCompanyProfileUpsert(
  userId: string,
  input: {
    company_name: string;
    tagline: string;
    mission_statement: string;
    company_description: string;
    brand_voice: string;
    brand_colors: string[];
    targeted_keywords: string[];
    target_markets: string[];
    brand_guidelines_url: string | null;
    platform_preference: string;
  }
) {
  const payload: CompanyProfilePayload = {
    tagline: input.tagline,
    mission_statement: input.mission_statement,
    company_description: input.company_description,
    brand_voice: input.brand_voice,
    targeted_keywords: input.targeted_keywords,
    target_markets: input.target_markets,
    brand_guidelines_url: input.brand_guidelines_url
  };

  return {
    user_id: userId,
    company_name: input.company_name,
    brand_colors: input.brand_colors,
    platform_preference: input.platform_preference,
    product: JSON.stringify(payload),
    audience: input.target_markets.join(", ") || null,
    goal: input.mission_statement || null
  };
}

function parsePayload(raw: string | null): CompanyProfilePayload {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as CompanyProfilePayload;
    }
    return {};
  } catch {
    return {};
  }
}

function coalesce<T>(...values: Array<T | null | undefined>): T | null {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
}
