import { GoogleGenerativeAI } from "@google/generative-ai";
import { Buffer } from "node:buffer";
import { createServiceRoleSupabaseClient } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TrendSummary = {
  name: string;
  platform: string;
  category: string | null;
  description: string | null;
};

export type PatternSummary = {
  name: string;
  platform: string | null;
  description: string;
  example_usage?: string | null;
};

export type GeneratedAdVariant = {
  variant_index: number;
  platform: string;
  hook: string;
  body: string;
  cta: string;
  nano_visual_prompt: string;
  design_explanation: string;
  image_url: string;
};

export type GenerateAdSuiteInput = {
  companyName: string;
  name: string;
  product: string;
  audience: string;
  goal: string;
  platform: string;
  tone: string;
  format: string;
  brandColors: string[];
  productImageUrls: string[];
  trends: TrendSummary[];
  patterns: PatternSummary[];
};

export type GenerateAdSuiteResult = {
  strategy: {
    positioning: string;
    angle: string;
    key_messages: string[];
    suggested_layout: string;
    color_rationale: string;
  };
  variants: GeneratedAdVariant[];
};

const SYSTEM_PROMPT = `You are an expert performance marketer AND senior ad art director.

You receive:
- Company and product info.
- Target audience and business goal.
- Target platform (TikTok / Meta / YouTube).
- Tone and format (static image).
- Brand color hints (hex).
- Optional product image URLs.
- A summary of current social trends and creative patterns derived from APIs (Google Trends, YouTube trending videos, Reddit top posts, etc.).

Your tasks:

1. STRATEGY
   - Decide on the core positioning and main angle.
   - List 2–4 key messages.
   - Propose a static layout concept (hero product, before/after, testimonial, etc.).
   - Explain why this layout and color approach fits:
     - the brand and product,
     - the target audience,
     - the provided trends and creative patterns.

2. VARIANTS
   - Create 3–5 static ad variants for the target platform and tone.
   - For each variant, produce:
     - hook: scroll-stopping main line.
     - body: 1–3 short lines of copy.
     - cta: explicit call-to-action aligned with the goal.
     - nano_visual_prompt: a single, dense sentence describing the final static ad for Nano Banana Pro:
       - subject (product + context),
       - composition (placement of product, text, background),
       - lighting and camera feel,
       - visual style,
       - explicit brand color usage,
       - relevant props/environment,
       - platform aspect ratio and safe zones.
     - design_explanation: why this variant should perform well:
       - which trends/patterns it uses,
       - why the colors/layout/content are chosen,
       - which psychological triggers or social proof elements are used.

Rules:
- Use the trend and pattern summaries actively; design ads that feel “of the moment”.
- Keep hooks sharp and non-fluffy.
- Make execution realistic for a solo creator/small brand.
- nano_visual_prompt MUST be a single sentence, no line breaks.
- Do not include trademarked third-party logos or real brand names unless the user explicitly includes them as their own brand.

Output:
- Respond as pure JSON ONLY:

{
  "strategy": {
    "positioning": string,
    "angle": string,
    "key_messages": string[],
    "suggested_layout": string,
    "color_rationale": string
  },
  "variants": [
    {
      "variant_index": number,
      "platform": string,
      "hook": string,
      "body": string,
      "cta": string,
      "nano_visual_prompt": string,
      "design_explanation": string
    }
  ]
}

No extra keys, no markdown, no comments.`;

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-3-pro-image-preview";

function buildUserPrompt(input: GenerateAdSuiteInput) {
  const trendLines =
    input.trends.length > 0
      ? input.trends.map((t) => `- ${t.name} (${t.platform}) :: ${t.description ?? "no description"}`).join("\n")
      : "No live trends available.";
  const patternLines =
    input.patterns.length > 0
      ? input.patterns.map((p) => `- ${p.name} (${p.platform ?? "any"}) :: ${p.description}`).join("\n")
      : "No creative patterns available.";

  return [
    `Company: ${input.companyName}`,
    `Project name: ${input.name}`,
    `Product: ${input.product}`,
    `Audience: ${input.audience}`,
    `Goal: ${input.goal}`,
    `Platform: ${input.platform}`,
    `Tone: ${input.tone}`,
    `Format: ${input.format}`,
    `Brand colors: ${input.brandColors.join(", ") || "none"}`,
    `Product images: ${input.productImageUrls.join(", ") || "none"}`,
    `Top trend topics:`,
    trendLines,
    `Creative patterns:`,
    patternLines,
    `Return JSON exactly as specified.`
  ].join("\n");
}

function buildImagePrompt(variant: GeneratedAdVariant, input: GenerateAdSuiteInput) {
  const colors = input.brandColors.length > 0 ? `Brand colors: ${input.brandColors.join(", ")}.` : "Use clean neutral palette.";
  const platformContext =
    input.platform === "tiktok"
      ? "TikTok static ad 9:16, vertical, safe text zones."
      : input.platform === "youtube"
        ? "YouTube feed static promotion 16:9 or 1:1, bold clarity."
        : "Meta feed static ad 1:1 or 4:5, conversion focused.";
  const productVisuals =
    input.productImageUrls.length > 0
      ? `Incorporate product references inspired by: ${input.productImageUrls.join(", ")}`
      : "Invent product visuals consistent with brief.";

  return `${variant.nano_visual_prompt} ${colors} ${platformContext} ${productVisuals} Do not place any UI chrome or watermarks.`;
}

function parseJsonResponse(raw: string): GenerateAdSuiteResult {
  try {
    return JSON.parse(raw) as GenerateAdSuiteResult;
  } catch (err) {
    console.error("LLM JSON parse failed", err);
    throw new Error("Gemini did not return valid JSON.");
  }
}

async function ensureBucketExists(client: SupabaseClient, bucket: string) {
  const { data, error } = await client.storage.getBucket(bucket);
  if (data) return;
  const isNotFound = error && (error.status === 404 || error.statusCode === "404");
  const isForbidden = error && (error.status === 403 || error.statusCode === "403");
  if (isForbidden) {
    console.warn("[generateAdSuite] bucket lookup forbidden, assuming bucket exists", { bucket });
    return;
  }
  if (error && !isNotFound) {
    console.error("[generateAdSuite] bucket lookup failed", { bucket, error });
    if (isForbidden) {
      throw new Error(`Bucket ${bucket} is blocked by RLS. Create it manually in Supabase Storage or use a service_role key.`);
    }
    throw error;
  }
  const { error: createError } = await client.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024
  });
  if (createError && !String(createError.message).includes("already exists")) {
    console.error("[generateAdSuite] bucket create failed", { bucket, error: createError });
    console.warn(
      `[generateAdSuite] proceeding assuming bucket ${bucket} exists but creation blocked (RLS/permissions).`
    );
    return;
  }
  if (!createError) {
    console.log("[generateAdSuite] bucket created", { bucket });
  }
}

export async function generateAdSuiteWithNanoBananaPro(input: GenerateAdSuiteInput): Promise<GenerateAdSuiteResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const textModel = genAI.getGenerativeModel({
    model: TEXT_MODEL,
    systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] }
  });

  const userPrompt = buildUserPrompt(input);
  console.log("[generateAdSuite] starting text strategy", {
    project: input.name,
    platform: input.platform,
    tone: input.tone
  });
  const textResponse = await textModel.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { responseMimeType: "application/json" }
  });
  const textPayload = textResponse.response.text();
  const structured = parseJsonResponse(textPayload);
  console.log("[generateAdSuite] text strategy complete", {
    variants: structured.variants?.length || 0,
    positioning: structured.strategy?.positioning
  });

  const supabase = createServiceRoleSupabaseClient();
  await ensureBucketExists(supabase, "ad-outputs");
  const imageModel = genAI.getGenerativeModel({ model: IMAGE_MODEL });

  const variantsWithImages: GeneratedAdVariant[] = [];
  for (const variant of structured.variants) {
    let imageUrl = "";
    try {
      const imgPrompt = buildImagePrompt(variant, input);
      console.log("[generateAdSuite] sending Nano Banana prompt", {
        project: input.name,
        variant: variant.variant_index,
        promptPreview: imgPrompt.slice(0, 280)
      });
      // Gemini image models currently return inlineData without setting responseMimeType.
      const imageResp = await imageModel.generateContent({
        contents: [{ role: "user", parts: [{ text: imgPrompt }] }]
      });

      const part =
        imageResp.response.candidates
          ?.flatMap((c) => c.content?.parts || [])
          ?.find((p: any) => (p as any).inlineData)?.inlineData || null;

      if (!part?.data) {
        console.error("[generateAdSuite] image inlineData missing", {
          project: input.name,
          variant: variant.variant_index,
          parts: imageResp.response.candidates?.[0]?.content?.parts
        });
        throw new Error("Image data missing from Nano Banana response.");
      }

      const buffer = Buffer.from(part.data, "base64");
      const path = `nano-banana/${input.name}-${variant.variant_index}-${Date.now()}.png`
        .replace(/\s+/g, "-")
        .toLowerCase();

      console.log("[generateAdSuite] uploading Nano Banana image", { path });
      const { error } = await supabase.storage.from("ad-outputs").upload(path, buffer, {
        contentType: "image/png",
        upsert: true
      });
      if (error) throw error;

      const { data: publicUrl } = supabase.storage.from("ad-outputs").getPublicUrl(path);
      imageUrl = publicUrl.publicUrl;
      console.log("[generateAdSuite] image uploaded", { path, publicUrl: imageUrl });
    } catch (err) {
      console.error("Image generation/upload failed", {
        project: input.name,
        variant: variant.variant_index,
        error: err
      });
    }

    variantsWithImages.push({ ...variant, image_url: imageUrl || "" });
  }

  return { strategy: structured.strategy, variants: variantsWithImages };
}
