import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  generateAdSuiteWithNanoBananaPro,
  type GenerateAdSuiteInput,
  type PatternSummary,
  type TrendSummary
} from "@/lib/llm";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { CreativePattern, TrendTopic } from "@/types/db";

const schema = z.object({
  companyName: z.string().min(1),
  name: z.string().min(1),
  product: z.string().min(1),
  audience: z.string().min(1),
  goal: z.string().min(1),
  platform: z.enum(["tiktok", "meta", "youtube"]),
  tone: z.string().min(1),
  format: z.literal("static_image"),
  brandColors: z.array(z.string()).default([]),
  productImageUrls: z.array(z.string()).default([]),
  userId: z.string().uuid().optional().nullable()
});

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleSupabaseClient();
  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId: maybeUserId, ...payload } = parsed.data;
  const userId = maybeUserId || null;

  // 1) Upsert project
  const { data: existingProject, error: findError } = await supabase
    .from("ad_projects")
    .select("*")
    .eq("name", payload.name)
    .eq("company_name", payload.companyName)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  let projectId: string;
  if (existingProject) {
    const { data: updated, error: updateError } = await supabase
      .from("ad_projects")
      .update({
        product: payload.product,
        audience: payload.audience,
        goal: payload.goal,
        platform_preference: payload.platform,
        brand_colors: payload.brandColors,
        product_image_urls: payload.productImageUrls
      })
      .eq("id", existingProject.id)
      .select("id")
      .maybeSingle();
    if (updateError || !updated) {
      return NextResponse.json({ error: updateError?.message || "Project update failed" }, { status: 500 });
    }
    projectId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("ad_projects")
      .insert({
        company_name: payload.companyName,
        name: payload.name,
        product: payload.product,
        audience: payload.audience,
        goal: payload.goal,
        platform_preference: payload.platform,
        brand_colors: payload.brandColors,
        product_image_urls: payload.productImageUrls
      })
      .select("id")
      .maybeSingle();
    if (insertError || !inserted) {
      return NextResponse.json({ error: insertError?.message || "Project insert failed" }, { status: 500 });
    }
    projectId = inserted.id;
  }

  // 2) Fetch personalized trends + patterns
  let trendRows: TrendTopic[] | null = null;

  if (userId) {
    const { data: personalTrends, error: personalError } = await supabase
      .from("trend_topics")
      .select("*")
      .contains("raw_data", { user_id: userId })
      .order("created_at", { ascending: false })
      .limit(12);
    if (personalError) {
      console.warn("[generate-ad] personal trends query failed", personalError);
    } else if (personalTrends && personalTrends.length > 0) {
      trendRows = personalTrends;
    }
  }

  if (!trendRows) {
    const { data: fallbackTrends } = await supabase
      .from("trend_topics")
      .select("*")
      .or(`platform.eq.${payload.platform},platform.is.null`)
      .order("created_at", { ascending: false })
      .limit(12);
    trendRows = fallbackTrends || [];
  }

  const { data: patternRows, error: patternError } = await supabase
    .from("creative_patterns")
    .select("*")
    .or(`platform.eq.${payload.platform},platform.is.null`)
    .order("created_at", { ascending: false })
    .limit(12);
  if (patternError) {
    console.warn("[generate-ad] creative pattern query failed", patternError);
  }

  const trends: TrendSummary[] =
    trendRows?.map((t) => ({
      name: t.name,
      platform: t.platform ?? payload.platform,
      category: t.category,
      description: t.description
    })) || [];

  const patterns: PatternSummary[] =
    (patternRows as CreativePattern[] | null | undefined)?.map((p) => ({
      name: p.name,
      platform: p.platform,
      description: p.description,
      example_usage: p.example_usage
    })) || [];

  const llmInput: GenerateAdSuiteInput = {
    ...payload,
    trends,
    patterns
  };

  try {
    // 3) Generate strategy + ads
    const aiResult = await generateAdSuiteWithNanoBananaPro(llmInput);

    // 4) Persist generation
    const { data: generation, error: genError } = await supabase
      .from("ad_generations")
      .insert({
        project_id: projectId,
        platform: payload.platform,
        tone: payload.tone,
        format: payload.format,
        brief: { ...payload, trends, patterns },
        strategy: aiResult.strategy,
        ads: aiResult.variants
      })
      .select("id")
      .maybeSingle();

    if (genError || !generation) {
      return NextResponse.json({ error: genError?.message || "Failed to persist generation" }, { status: 500 });
    }

    return NextResponse.json({
      projectId,
      strategy: aiResult.strategy,
      variants: aiResult.variants,
      generationId: generation.id
    });
  } catch (err: any) {
    console.error("[generate-ad] failed", err);
    return NextResponse.json({ error: err?.message || "Generation failed" }, { status: 500 });
  }
}
