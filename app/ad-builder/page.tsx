"use client";

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import { AdVariantCard } from "@/components/AdVariantCard";
import { Confetti } from "@/components/Confetti";
import type { GenerateAdSuiteResult } from "@/lib/llm";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type FormState = {
  companyName: string;
  name: string;
  product: string;
  audience: string;
  goal: string;
  platform: "tiktok" | "meta" | "youtube";
  tone: string;
  format: "static_image";
  brandColors: string;
  productImageUrls: string[];
};

const defaultForm: FormState = {
  companyName: "Acme Labs",
  name: "Summer Pulse",
  product: "A portable cold brew maker with smart chill timer.",
  audience: "Young professionals who love coffee and design-forward gadgets",
  goal: "Drive preorders and email signups",
  platform: "tiktok",
  tone: "friendly",
  format: "static_image",
  brandColors: "#FF4E68, #111827",
  productImageUrls: []
};

export default function AdBuilderPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateAdSuiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const brandColorArray = useMemo(
    () =>
      form.brandColors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    [form.brandColors]
  );

  useEffect(() => {
    const maybePrefillFromProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user) return;
      const { data: profile, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error || !profile) {
        if (error && error.code !== "PGRST116") {
          setProfileStatus("Could not load company profile.");
        }
        return;
      }
      setForm((s) => ({
        ...s,
        companyName: profile.company_name || s.companyName,
        product: profile.product || s.product,
        audience: profile.audience || s.audience,
        goal: profile.goal || s.goal,
        platform: (profile.platform_preference as FormState["platform"]) || s.platform,
        brandColors: (profile.brand_colors || []).join(", ") || s.brandColors
      }));
      setProfileStatus("Loaded saved company profile.");
    };
    maybePrefillFromProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setCelebrate(false);

    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          brandColors: brandColorArray,
          productImageUrls: form.productImageUrls
        })
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
            <Field
              label="Company name"
              value={form.companyName}
              onChange={(v) => setForm((s) => ({ ...s, companyName: v }))}
            />
            <Field label="Project name" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} />
            <TextArea
              label="Product description"
              value={form.product}
              onChange={(v) => setForm((s) => ({ ...s, product: v }))}
            />
            <TextArea
              label="Target audience"
              value={form.audience}
              onChange={(v) => setForm((s) => ({ ...s, audience: v }))}
            />
            <Field label="Goal" value={form.goal} onChange={(v) => setForm((s) => ({ ...s, goal: v }))} />

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

            <Field
              label="Brand colors (comma separated hex)"
              value={form.brandColors}
              onChange={(v) => setForm((s) => ({ ...s, brandColors: v }))}
              placeholder="#FF4E68, #111827"
            />

            <ProductImageUploader
              value={form.productImageUrls}
              onChange={(urls) => setForm((s) => ({ ...s, productImageUrls: urls }))}
            />

            {profileStatus && <p className="text-sm font-bold text-black/60">{profileStatus}</p>}

            <m.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              {loading ? "Summoning..." : "Lock My Choice In"}
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

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-2 text-base font-bold text-ink">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </label>
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
