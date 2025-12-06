import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  generateAdSuiteWithNanoBananaPro,
  type CompanyContext as LLMCompanyContext,
  type GenerateAdSuiteInput,
  type PatternSummary,
  type ProductContext as LLMProductContext,
  type TrendSummary
} from "@/lib/llm";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { CompanyProfile, CreativePattern, ProductProfile, TrendTopic } from "@/types/db";
import { hydrateCompanyProfile } from "@/lib/companyProfile";

const schema = z.object({
  campaignName: z.string().min(1),
  goal: z.string().min(1),
  platform: z.enum(["tiktok", "meta", "youtube"]),
  tone: z.string().min(1),
  format: z.literal("static_image"),
  productId: z.string().uuid(),
  userId: z.string().uuid()
});

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleSupabaseClient();
  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, productId, ...payload } = parsed.data;

  // 1) Fetch company + product context
  const { data: companyRow, error: companyError } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }
  const companyProfile = hydrateCompanyProfile(companyRow as any);
  if (!companyProfile) {
    return NextResponse.json({ error: "Company profile not found. Save it first." }, { status: 400 });
  }

  const { data: productProfile, error: productError } = await supabase
    .from("product_profiles")
    .select("*")
    .eq("id", productId)
    .maybeSingle<ProductProfile>();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }
  if (!productProfile || productProfile.user_id !== userId) {
    return NextResponse.json({ error: "Product not found for this user." }, { status: 404 });
  }

  const companyContext = buildCompanyContext(companyProfile);
  const productContext = buildProductContext(productProfile, companyProfile);

  // 2) Upsert project
  const { data: existingProject, error: findError } = await supabase
    .from("ad_projects")
    .select("*")
    .eq("user_id", userId)
    .eq("name", payload.campaignName)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  let projectId: string;
  if (existingProject) {
    const { data: updated, error: updateError } = await supabase
      .from("ad_projects")
      .update({
        product: productContext.name,
        audience: productContext.audience,
        goal: payload.goal,
        platform_preference: payload.platform,
        brand_colors: companyContext.brandColors,
        product_image_urls: productContext.imageUrls
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
        user_id: userId,
        company_name: companyContext.name,
        name: payload.campaignName,
        product: productContext.name,
        audience: productContext.audience,
        goal: payload.goal,
        platform_preference: payload.platform,
        brand_colors: companyContext.brandColors,
        product_image_urls: productContext.imageUrls
      })
      .select("id")
      .maybeSingle();
    if (insertError || !inserted) {
      return NextResponse.json({ error: insertError?.message || "Project insert failed" }, { status: 500 });
    }
    projectId = inserted.id;
  }

  // 3) Fetch personalized trends + patterns
  let trendRows: TrendTopic[] | null = null;

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
    campaignName: payload.campaignName,
    goal: payload.goal,
    platform: payload.platform,
    tone: payload.tone,
    format: payload.format,
    company: companyContext,
    product: productContext,
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
        brief: {
          campaignName: payload.campaignName,
          goal: payload.goal,
          platform: payload.platform,
          tone: payload.tone,
          format: payload.format,
          company: companyContext,
          product: productContext,
          trends,
          patterns
        },
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

function buildCompanyContext(profile: CompanyProfile): LLMCompanyContext {
  return {
    name: profile.company_name,
    description: profile.company_description ?? "",
    tagline: profile.tagline,
    mission: profile.mission_statement,
    brandVoice: profile.brand_voice,
    brandColors: profile.brand_colors ?? [],
    targetMarkets: profile.target_markets ?? [],
    targetedKeywords: profile.targeted_keywords ?? [],
    guidelineUrl: profile.brand_guidelines_url
  };
}

function buildProductContext(product: ProductProfile, company: CompanyProfile): LLMProductContext {
  return {
    id: product.id,
    name: product.name,
    summary: product.summary ?? "",
    audience: product.audience ?? company.target_markets?.join(", ") ?? "General audience",
    positioning: product.positioning,
    benefits: product.benefits ?? [],
    price: product.price,
    imageUrls: product.image_urls ?? []
  };
}
