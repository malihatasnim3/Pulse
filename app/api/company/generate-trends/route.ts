import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { fetchSerpNews, type SerpNewsResult } from "@/lib/trends/serp";
import { fetchGoogleTrendsForKeywords } from "@/lib/trends/googleTrends";
import type { CompanyProfile } from "@/types/db";
import { buildCompanyProfileUpsert, hydrateCompanyProfile } from "@/lib/companyProfile";

const schema = z.object({
  userId: z.string().uuid(),
  profile: z
    .object({
      company_name: z.string().min(1),
      tagline: z.string().min(1),
      mission_statement: z.string().min(1),
      company_description: z.string().min(1),
      brand_voice: z.string().min(1),
      targeted_keywords: z.array(z.string().min(1)).min(1),
      target_markets: z.array(z.string().min(1)).min(1),
      brand_colors: z.array(z.string()).optional().default([]),
      platform_preference: z.string().optional().default("tiktok")
    })
    .partial()
    .optional()
});

const QUERY_PLANNER_PROMPT = (profile: CompanyProfile & { targeted_keywords: string[]; target_markets: string[] }) => `You are a trend researcher helping a marketing AI.
Company: ${profile.company_name}
Description: ${profile.company_description}
Tagline: ${profile.tagline}
Mission: ${profile.mission_statement}
Brand voice: ${profile.brand_voice}
Target markets: ${(profile.target_markets || []).join(", ")}
Targeted keywords: ${(profile.targeted_keywords || []).join(", ")}

Return JSON with:
{
  "context": "1-2 sentence summary of the audience intent",
  "queries": ["short Google News search strings", ...]
}
Rules:
- Provide 3 to 5 queries.
- Keep each query under 7 words.
- Blend the targeted keywords with cultural hooks and audience motivations.
- Focus on recent or emerging cultural/commerce moments the brand should react to.`;

async function planQueries(profile: CompanyProfile & { targeted_keywords: string[]; target_markets: string[] }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = QUERY_PLANNER_PROMPT(profile);
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  });
  const text = response.response.text();
  try {
    const parsed = JSON.parse(text ?? "{}");
    const queries: string[] = Array.isArray(parsed?.queries)
      ? parsed.queries.map((q: any) => String(q)).filter(Boolean)
      : [];
    return {
      queries: queries.length > 0 ? queries.slice(0, 5) : profile.targeted_keywords.slice(0, 5),
      context: typeof parsed?.context === "string" ? parsed.context : profile.company_description || ""
    };
  } catch (err) {
    console.warn("[company/generate-trends] planner JSON parse failed", err);
    return {
      queries: profile.targeted_keywords.slice(0, 5),
      context: profile.company_description || ""
    };
  }
}

function validateProfile(profile: CompanyProfile) {
  const missing: string[] = [];
  if (!profile.company_name?.trim()) missing.push("company_name");
  if (!profile.company_description?.trim()) missing.push("company_description");
  if (!profile.tagline?.trim()) missing.push("tagline");
  if (!profile.mission_statement?.trim()) missing.push("mission_statement");
  if (!profile.target_markets || profile.target_markets.length === 0) missing.push("target_markets");
  if (!profile.targeted_keywords || profile.targeted_keywords.length === 0) missing.push("targeted_keywords");
  return missing;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { userId, profile: profilePayload } = parsed.data;

  const { data: profileRow, error: profileError } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  const hydrated = hydrateCompanyProfile(profileRow as any);
  let resolvedProfile: (CompanyProfile & { targeted_keywords: string[]; target_markets: string[] }) | null = hydrated
    ? {
        ...hydrated,
        targeted_keywords: hydrated.targeted_keywords ?? [],
        target_markets: hydrated.target_markets ?? []
      }
    : null;

  if (!resolvedProfile && profilePayload) {
    const fallbackProfile = {
      user_id: userId,
      company_name: profilePayload.company_name ?? "",
      tagline: profilePayload.tagline ?? "",
      mission_statement: profilePayload.mission_statement ?? "",
      brand_voice: profilePayload.brand_voice ?? "Conversational",
      company_description: profilePayload.company_description ?? "",
      targeted_keywords: profilePayload.targeted_keywords ?? [],
      target_markets: profilePayload.target_markets ?? [],
      brand_colors: profilePayload.brand_colors ?? [],
      platform_preference: profilePayload.platform_preference ?? "tiktok"
    } satisfies CompanyProfile & { targeted_keywords: string[]; target_markets: string[] };

    resolvedProfile = fallbackProfile;

    try {
      const upsertPayload = buildCompanyProfileUpsert(userId, {
        company_name: fallbackProfile.company_name,
        tagline: fallbackProfile.tagline,
        mission_statement: fallbackProfile.mission_statement,
        company_description: fallbackProfile.company_description,
        brand_voice: fallbackProfile.brand_voice ?? "Conversational",
        brand_colors: fallbackProfile.brand_colors ?? [],
        targeted_keywords: fallbackProfile.targeted_keywords ?? [],
        target_markets: fallbackProfile.target_markets ?? [],
        brand_guidelines_url: fallbackProfile.brand_guidelines_url ?? null,
        platform_preference: fallbackProfile.platform_preference ?? "tiktok"
      });
      await supabase.from("company_profiles").upsert(upsertPayload);
    } catch (err) {
      console.warn("[company/generate-trends] fallback upsert failed", err);
    }
  }

  if (!resolvedProfile) {
    return NextResponse.json({ error: "No company profile found." }, { status: 404 });
  }

  const missingFields = validateProfile(resolvedProfile);
  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Complete profile fields before generating trends: ${missingFields.join(", ")}` },
      { status: 400 }
    );
  }

  const planned = await planQueries(resolvedProfile);
  const keywordQueries = uniqueStrings(resolvedProfile.targeted_keywords || []).slice(0, 12);

  if (keywordQueries.length === 0) {
    return NextResponse.json({ error: "No keywords available to search." }, { status: 400 });
  }

  const {
    items: harvestedItems,
    usedKeywords,
    failedKeywords,
    keywordErrors
  } = await collectKeywordTrends(keywordQueries, resolvedProfile);

  let curated = dedupeAndRank(harvestedItems, 12);
  let usedFallback = false;

  if (curated.length === 0) {
    const fallbackItems = await collectGoogleTrendFallback(keywordQueries, resolvedProfile);
    curated = dedupeAndRank(fallbackItems, 12);
    usedFallback = curated.length > 0;
  }

  if (curated.length === 0) {
    return NextResponse.json(
      {
        error: "No trends discovered from SERP or Google Trends fallback.",
        keywords: keywordQueries,
        usedKeywords,
        failedKeywords,
        diagnostics: keywordErrors
      },
      { status: 502 }
    );
  }

  let userColumnAvailable = true;
  const { error: clearError } = await supabase.from("trend_topics").delete().eq("user_id", userId);
  if (clearError) {
    if (isMissingUserColumn(clearError)) {
      userColumnAvailable = false;
      const { error: legacyClearError } = await supabase
        .from("trend_topics")
        .delete()
        .contains("raw_data", { user_id: userId });
      if (legacyClearError) {
        return NextResponse.json({ error: legacyClearError.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }
  }

  const baseRows = curated.slice(0, 12).map((item) => ({
    name: item.title,
    platform: item.platformHint || "serp_news",
    category: item.query,
    description: item.snippet,
    source: item.source || "SERP",
    score: item.relevance,
    velocity: null,
    raw_data: {
      link: item.link,
      date: item.date,
      thumbnail: item.thumbnail,
      keyword: item.query,
      planner_context: planned.context,
      user_id: userId,
      relevance: item.relevance
    },
    company_context: resolvedProfile.company_name
  }));

  let rows = userColumnAvailable ? baseRows.map((row) => ({ ...row, user_id: userId })) : baseRows;

  let { data: inserted, error: insertError } = await supabase.from("trend_topics").insert(rows).select("id");

  if (insertError && userColumnAvailable && isMissingUserColumn(insertError)) {
    userColumnAvailable = false;
    rows = baseRows;
    ({ data: inserted, error: insertError } = await supabase.from("trend_topics").insert(rows).select("id"));
  }

  if (insertError && isMissingCompanyContextColumn(insertError)) {
    rows = rows.map((row) => {
      const clone: Record<string, any> = { ...row };
      delete clone.company_context;
      return clone;
    });
    ({ data: inserted, error: insertError } = await supabase.from("trend_topics").insert(rows).select("id"));
  }

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: inserted?.length || 0,
    keywords: keywordQueries,
    usedKeywords,
    failedKeywords,
    usedFallback
  });
}

type TrendCandidate = SerpNewsResult & {
  query: string;
  variant: string;
  relevance: number;
  platformHint?: string;
};
type KeywordError = {
  keyword: string;
  message: string;
};
async function collectKeywordTrends(
  keywords: string[],
  profile: CompanyProfile & { targeted_keywords: string[]; target_markets: string[] }
) {
  const items: TrendCandidate[] = [];
  const usedKeywords: string[] = [];
  const failedKeywords: string[] = [];
  const keywordErrors: KeywordError[] = [];

  for (const keyword of keywords) {
    try {
      const news = await fetchSerpNews(keyword, 5);
      if (news.length > 0) {
        usedKeywords.push(keyword);
        items.push(
          ...news.map((result) => ({
            ...result,
            query: keyword,
            variant: keyword,
            relevance: scoreSerpTrend(result, profile, keyword),
            platformHint: "serp_news"
          }))
        );
      } else {
        failedKeywords.push(keyword);
        keywordErrors.push({ keyword, message: "SERP returned no articles." });
      }
    } catch (err) {
      failedKeywords.push(keyword);
      keywordErrors.push({ keyword, message: (err as Error)?.message || "Unknown SERP error" });
      console.warn("[company/generate-trends] serp fetch failed", { keyword, err });
    }
  }

  return { items, usedKeywords, failedKeywords, keywordErrors };
}

async function collectGoogleTrendFallback(
  keywords: string[],
  profile: CompanyProfile & { targeted_keywords: string[]; target_markets: string[] }
): Promise<TrendCandidate[]> {
  try {
    const topics = await fetchGoogleTrendsForKeywords(keywords);
    return topics
      .filter((topic) => Boolean(topic.name))
      .map((topic) => {
        const title = topic.name ?? "Google trend";
        const description = topic.description ?? `Rising search interest for ${title}`;
        const matchedKeyword = matchKeyword(title, keywords);
        const pseudoResult: SerpNewsResult = {
          title,
          snippet: description,
          link: deriveLink(topic.raw_data),
          source: topic.source || "google_trends",
          date: new Date().toISOString()
        };
        return {
          ...pseudoResult,
          query: matchedKeyword ?? title,
          variant: "google_trends",
          platformHint: topic.platform || topic.source || "google_trends",
          relevance: scoreSerpTrend(pseudoResult, profile, matchedKeyword ?? title)
        } satisfies TrendCandidate;
      });
  } catch (err) {
    console.warn("[company/generate-trends] google trends fallback failed", err);
    return [];
  }
}

function matchKeyword(title: string, keywords: string[]) {
  const lowerTitle = title.toLowerCase();
  return keywords.find((keyword) => lowerTitle.includes(keyword.toLowerCase())) ?? null;
}

function deriveLink(raw: unknown) {
  if (!raw || typeof raw !== "object") return "";
  const maybe = raw as Record<string, any>;
  return (
    maybe?.articles?.[0]?.url ||
    maybe?.newsArticles?.[0]?.url ||
    maybe?.shareUrl ||
    ""
  );
}

function dedupeAndRank(items: TrendCandidate[], maxItems: number) {
  const seen = new Set<string>();
  return items
    .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
    .filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxItems);
}

function scoreSerpTrend(
  item: SerpNewsResult,
  profile: CompanyProfile & { targeted_keywords: string[]; target_markets: string[] },
  query: string
) {
  let score = 50;
  const haystack = `${item.title} ${item.snippet}`.toLowerCase();
  const keywords = profile.targeted_keywords || [];
  const markets = profile.target_markets || [];
  keywords.forEach((keyword) => {
    if (keyword && haystack.includes(keyword.toLowerCase())) score += 8;
  });
  markets.forEach((market) => {
    if (market && haystack.includes(market.toLowerCase())) score += 5;
  });
  if (query.toLowerCase().includes("trend")) score += 2;
  score += freshnessScore(item.date);
  return Math.min(100, Math.round(score));
}

function freshnessScore(dateInput?: string) {
  if (!dateInput) return 0;
  const normalized = dateInput.toLowerCase();
  const relativeMatch = normalized.match(/(\d+)\s+(minute|hour|day|week)/);
  if (relativeMatch) {
    const value = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    if (unit.startsWith("minute")) return 20;
    if (unit.startsWith("hour")) return value <= 6 ? 20 : 15;
    if (unit.startsWith("day")) return value <= 2 ? 15 : 8;
    if (unit.startsWith("week")) return value <= 1 ? 10 : 5;
  }
  const parsed = Date.parse(dateInput);
  if (!Number.isNaN(parsed)) {
    const hours = (Date.now() - parsed) / (1000 * 60 * 60);
    if (hours <= 12) return 18;
    if (hours <= 24) return 15;
    if (hours <= 72) return 10;
    if (hours <= 168) return 6;
  }
  return 0;
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function isMissingUserColumn(error: { message?: string } | null) {
  return isMissingColumn(error, "user_id");
}

function isMissingCompanyContextColumn(error: { message?: string } | null) {
  return isMissingColumn(error, "company_context");
}

function isMissingColumn(error: { message?: string } | null, column: string) {
  if (!error?.message) return false;
  const normalized = error.message.toLowerCase();
  return normalized.includes(column.toLowerCase()) && normalized.includes("column");
}

