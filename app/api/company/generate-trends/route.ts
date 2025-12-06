import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { fetchSerpNews } from "@/lib/trends/serp";
import type { CompanyProfile } from "@/types/db";

const schema = z.object({
  userId: z.string().uuid()
});

const QUERY_PLANNER_PROMPT = (profile: CompanyProfile & { targeted_keywords: string[] }) => `You are a trend researcher helping a marketing AI.
Company: ${profile.company_name}
Description: ${profile.company_description}
Product: ${profile.product}
Audience: ${profile.audience}
Goal: ${profile.goal}
Targeted keywords: ${(profile.targeted_keywords || []).join(", ")}

Return JSON with:
{
  "context": "1-2 sentence summary of the audience intent",
  "queries": ["short Google News search strings", ...]
}
Rules:
- Provide 3 to 5 queries.
- Keep each query under 7 words.
- Blend the targeted keywords with cultural hooks.
- Focus on recent or emerging cultural/commerce moments the brand should react to.`;

async function planQueries(profile: CompanyProfile & { targeted_keywords: string[] }) {
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
  if (!profile.product?.trim()) missing.push("product");
  if (!profile.audience?.trim()) missing.push("audience");
  if (!profile.goal?.trim()) missing.push("goal");
  if (!profile.company_description?.trim()) missing.push("company_description");
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
  const { userId } = parsed.data;

  const { data: profile, error: profileError } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: "No company profile found." }, { status: 404 });
  }

  const normalizedProfile = {
    ...profile,
    targeted_keywords: profile.targeted_keywords ?? []
  } as CompanyProfile & { targeted_keywords: string[] };

  const missingFields = validateProfile(normalizedProfile);
  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Complete profile fields before generating trends: ${missingFields.join(", ")}` },
      { status: 400 }
    );
  }

  const planned = await planQueries(normalizedProfile);
  const searchQueries = planned.queries.length > 0 ? planned.queries : normalizedProfile.targeted_keywords.slice(0, 5);
  if (searchQueries.length === 0) {
    return NextResponse.json({ error: "No keywords available to search." }, { status: 400 });
  }

  const serpResponses = await Promise.allSettled(searchQueries.map((query) => fetchSerpNews(query, 3)));
  const allNews = serpResponses.flatMap((result, idx) => {
    if (result.status !== "fulfilled") {
      console.warn("[company/generate-trends] serp query failed", searchQueries[idx], result.reason);
      return [];
    }
    return result.value.map((item) => ({ ...item, query: searchQueries[idx] }));
  });

  const seen = new Set<string>();
  const curated = allNews.filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (curated.length === 0) {
    return NextResponse.json({ error: "No trends discovered from SERP." }, { status: 502 });
  }

  await supabase.from("trend_topics").delete().contains("raw_data", { user_id: userId });

  const rows = curated.slice(0, 12).map((item) => ({
    name: item.title,
    platform: "serp_news",
    category: item.query,
    description: item.snippet,
    source: item.source || "SERP",
    score: null,
    velocity: null,
    raw_data: {
      link: item.link,
      date: item.date,
      thumbnail: item.thumbnail,
      query: item.query,
      planner_context: planned.context,
      user_id: userId
    },
    company_context: normalizedProfile.company_name
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("trend_topics")
    .insert(rows)
    .select("id");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: inserted?.length || 0, queries: searchQueries });
}
