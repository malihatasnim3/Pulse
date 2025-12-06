"use client";

import type { CompanyProfile, ProductProfile } from "@/types/db";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdVariantCard } from "@/components/AdVariantCard";
import { Confetti } from "@/components/Confetti";
import type { GenerateAdSuiteResult } from "@/lib/llm";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { hydrateCompanyProfile } from "@/lib/companyProfile";
import { m } from "framer-motion";

type FormState = {
  goal: string;
  platform: "tiktok" | "meta" | "youtube";
  tone: string;
  format: "static_image";
};

const defaultForm: FormState = {
  goal: "Drive sales",
  platform: "tiktok",
  tone: "friendly",
  format: "static_image"
};

export default function AdBuilderPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateAdSuiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productStatus, setProductStatus] = useState<string | null>(null);
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  useEffect(() => {
    const maybePrefillFromProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user) return;
      setUserId(session.user.id);
      const [{ data: profileRow, error: profileError }, { data: productRows, error: productError }] = await Promise.all([
        supabase
          .from("company_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle(),
        supabase
          .from("product_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
      ]);

      if (profileError) {
        setProfileStatus(profileError.message);
      }
      const hydratedProfile = hydrateCompanyProfile(profileRow as any);
      if (hydratedProfile) {
        setProfileStatus("Company context loaded.");
      }
      setCompanyProfile(hydratedProfile);

      if (productError) {
        setProductStatus(productError.message);
      }
      setProducts(productRows ?? []);
      if (productRows && productRows.length > 0) {
        setSelectedProductId(productRows[0].id);
      }
    };
    maybePrefillFromProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCelebrate(false);

    if (!companyProfile) {
      setError("Add your company profile first so the AI knows your brand.");
      return;
    }

    if (!selectedProduct) {
      setError("Select a product to generate a campaign.");
      return;
    }

    setLoading(true);

    const campaignName = `${companyProfile.company_name} x ${selectedProduct.name}`.trim();
    const payload = {
      campaignName: campaignName || selectedProduct.name || companyProfile.company_name,
      goal: form.goal,
      platform: form.platform,
      tone: form.tone,
      format: form.format,
      productId: selectedProduct.id,
      userId
    };

    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to generate ad");
      }
      setResult({ strategy: json.strategy, variants: json.variants });
      setCelebrate(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setTimeout(() => setCelebrate(false), 2500);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-20">
      {/* Progress Bar */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full bg-black px-6 py-3 text-white shadow-pill">
          <span className="text-xl font-bold">2</span>
          <div className="mx-4 h-6 w-0.5 bg-white/30" />
          <span className="text-xl font-bold text-white/50">5</span>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-5xl font-black text-ink tracking-tight">Ad Builder</h1>
        <p className="mt-3 text-xl font-bold text-black/60">Drop a product, ride trends, and spin up Nano Banana Pro creatives.</p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="relative lg:col-span-3">
           {/* Background Blob for Form */}
           <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2.5rem] bg-mustard border-3 border-black" />
           
           <div className="relative space-y-6 rounded-[2.5rem] border-3 border-black bg-white p-8">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wide text-black/40">Setup</p>
              <p className="text-3xl font-black text-ink leading-tight">Select a product, aim, and tone.</p>
              <p className="text-base font-bold text-black/60">We pull the rest from your company + product profiles.</p>
            </div>

            {!companyProfile && (
              <Callout
                title="No company context yet"
                description="Finish the company profile so Gemini knows your mission, brand voice, and color guardrails."
                actionLabel="Open company profile"
                actionHref="/company"
              />
            )}

            {products.length === 0 && (
              <Callout
                title="Add a product"
                description="Drop at least one product with positioning, benefits, and image refs before spinning up ads."
                actionLabel="Manage products"
                actionHref="/products"
              />
            )}

            {products.length > 0 && (
              <Select
                label="Product"
                value={selectedProductId ?? ""}
                options={products.map((product) => ({ value: product.id, label: product.name }))}
                onChange={(v) => setSelectedProductId(v)}
              />
            )}

            <TextArea label="Goal" value={form.goal} onChange={(v) => setForm((s) => ({ ...s, goal: v }))} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Platform"
                value={form.platform}
                options={[
                  { value: "tiktok", label: "TikTok" },
                  { value: "meta", label: "Meta" },
                  { value: "youtube", label: "YouTube" }
                ]}
                onChange={(v) => setForm((s) => ({ ...s, platform: v as FormState["platform"] }))}
              />
              <Select
                label="Tone"
                value={form.tone}
                options={[
                  { value: "friendly", label: "Friendly" },
                  { value: "authority", label: "Authority" },
                  { value: "funny", label: "Funny" },
                  { value: "dramatic", label: "Dramatic" }
                ]}
                onChange={(v) => setForm((s) => ({ ...s, tone: v }))}
              />
            </div>

            {profileStatus && <InlineStatus message={profileStatus} />}
            {productStatus && <InlineStatus message={productStatus} />}

            <m.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !companyProfile || !selectedProduct}
              className="btn-primary flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              {loading ? "Summoning..." : !companyProfile || !selectedProduct ? "Context required" : "Generate ads"}
            </m.button>

            {error && <p className="text-lg font-bold text-punch">{error}</p>}
          </div>
        </form>

        <div className="space-y-8 lg:col-span-2">
          {/* How it works card */}
          <div className="relative group">
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-black border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
            <div className="relative rounded-3xl border-3 border-black bg-cream p-6">
              <p className="font-black text-xl text-ink">How it works</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-base font-bold text-black/70">
                <li>Pulls live trends and creative patterns</li>
                <li>Gemini picks strategy and angles</li>
                <li>Nano Banana Pro renders static ad images</li>
                <li>Supabase stores project, copy, and outputs</li>
              </ul>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-forest border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
            <div className="relative rounded-3xl border-3 border-black bg-white p-6">
              <p className="text-sm font-black uppercase tracking-wide text-black/40">Company context</p>
              {companyProfile ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-black text-ink">{companyProfile.company_name}</p>
                    <p className="text-base font-bold text-black/60">{companyProfile.tagline || companyProfile.mission_statement || "No tagline yet."}</p>
                  </div>
                  <p className="text-sm font-medium text-black/70">{companyProfile.company_description || "Add a short description in the company tab so the AI knows what you sell."}</p>
                  <dl className="space-y-2 text-sm font-bold text-black/70">
                    <div>
                      <dt className="uppercase text-xs text-black/40">Brand voice</dt>
                      <dd>{companyProfile.brand_voice || "-"}</dd>
                    </div>
                    <div>
                      <dt className="uppercase text-xs text-black/40">Target markets</dt>
                      <dd>{companyProfile.target_markets?.length ? companyProfile.target_markets.join(", ") : "Add markets"}</dd>
                    </div>
                    <div>
                      <dt className="uppercase text-xs text-black/40">Keywords</dt>
                      <dd>{companyProfile.targeted_keywords?.length ? companyProfile.targeted_keywords.join(", ") : "No keywords set"}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    {companyProfile.brand_colors?.length ? (
                      companyProfile.brand_colors.map((hex) => <ColorSwatch key={hex} value={hex} />)
                    ) : (
                      <p className="text-xs font-bold uppercase tracking-wide text-black/40">Add brand colors for stronger art direction.</p>
                    )}
                  </div>
                  {companyProfile.brand_guidelines_url && (
                    <Link
                      href={companyProfile.brand_guidelines_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-black text-ink underline"
                    >
                      View brand guidelines
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-lg font-black text-ink">No profile yet</p>
                  <p className="text-sm font-bold text-black/60">Your ads borrow tone, mission, and guardrails from the company profile.</p>
                  <Link
                    href="/company"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black text-ink transition hover:-translate-y-0.5"
                  >
                    Build company profile
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-punch border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
            <div className="relative rounded-3xl border-3 border-black bg-white p-6">
              <p className="text-sm font-black uppercase tracking-wide text-black/40">Product context</p>
              {selectedProduct ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-black text-ink">{selectedProduct.name}</p>
                    <p className="text-sm font-bold text-black/60">{selectedProduct.positioning || selectedProduct.audience || "No positioning yet."}</p>
                  </div>
                  <p className="text-sm font-medium text-black/70">{selectedProduct.summary || "Add a summary inside the Products tab."}</p>
                  <dl className="space-y-2 text-sm font-bold text-black/70">
                    <div>
                      <dt className="uppercase text-xs text-black/40">Audience</dt>
                      <dd>{selectedProduct.audience || "-"}</dd>
                    </div>
                    <div>
                      <dt className="uppercase text-xs text-black/40">Benefits</dt>
                      <dd>
                        {selectedProduct.benefits?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.benefits.map((benefit) => (
                              <span key={benefit} className="rounded-full border-2 border-black bg-cream px-3 py-1 text-xs font-black">
                                {benefit}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "Add benefit bullets"
                        )}
                      </dd>
                    </div>
                    {selectedProduct.price && (
                      <div>
                        <dt className="uppercase text-xs text-black/40">Price</dt>
                        <dd>{selectedProduct.price}</dd>
                      </div>
                    )}
                  </dl>
                  {selectedProduct.image_urls?.length ? (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.image_urls.slice(0, 3).map((url) => (
                        <div key={url} className="h-20 overflow-hidden rounded-2xl border-2 border-black bg-cream">
                          <img src={url} alt={selectedProduct.name} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold uppercase tracking-wide text-black/40">Add product imagery to help Nano Banana Pro.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-lg font-black text-ink">Select a product</p>
                  <p className="text-sm font-bold text-black/60">Pick any saved product to inject positioning, benefits, and images.</p>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black text-ink transition hover:-translate-y-0.5"
                  >
                    Manage products
                  </Link>
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="relative group">
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-punch border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
              <div className="relative space-y-4 rounded-3xl border-3 border-black bg-white p-6">
                <p className="text-sm font-black uppercase tracking-wide text-black/40">Strategy</p>
                <p className="text-2xl font-black text-ink leading-tight">{result.strategy.positioning}</p>
                <p className="text-base font-medium text-black/80">{result.strategy.angle}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.strategy.key_messages.map((msg) => (
                    <div key={msg} className="rounded-lg border-2 border-black bg-cream px-3 py-2 text-sm font-bold">
                      {msg}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm text-black/80">
                  <p className="font-black">Layout</p>
                  <p>{result.strategy.suggested_layout}</p>
                </div>
                <div className="mt-2 text-sm text-black/80">
                  <p className="font-black">Color rationale</p>
                  <p>{result.strategy.color_rationale}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full border-3 border-black bg-forest px-4 py-1 text-sm font-bold text-white shadow-hard-sm">Variants</div>
            <p className="text-lg font-bold text-black/60">Static ads generated by Nano Banana Pro</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {result.variants.map((variant) => (
              <AdVariantCard key={variant.variant_index} variant={variant} />
            ))}
          </div>
        </div>
      )}

      {celebrate && <Confetti />}
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-2 text-base font-bold text-ink">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field min-h-[120px]"
        rows={3}
      />
    </label>
  );
}

function InlineStatus({ message }: { message: string }) {
  return <p className="text-sm font-bold text-black/60">{message}</p>;
}

function Callout({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-3xl border-3 border-black bg-cream p-5">
      <p className="text-lg font-black text-ink">{title}</p>
      <p className="mt-1 text-sm font-bold text-black/60">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black text-ink transition hover:-translate-y-0.5"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function ColorSwatch({ value }: { value: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full border-2 border-black bg-cream px-3 py-1 text-xs font-black uppercase tracking-wide">
      <span className="h-4 w-4 rounded-full border border-black" style={{ backgroundColor: value }} />
      {value}
    </span>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-2 text-base font-bold text-ink">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field appearance-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
