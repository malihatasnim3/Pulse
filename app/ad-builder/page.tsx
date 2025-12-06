"use client";

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import { AdVariantCard } from "@/components/AdVariantCard";
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
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-punch px-3 py-1 text-xs font-semibold text-white shadow-pill">Builder</div>
        <div>
          <h1 className="text-3xl font-semibold">Ad Builder</h1>
          <p className="text-sm text-black/60">Drop a product, ride trends, and spin up Nano Banana Pro creatives.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 rounded-2xl bg-white/80 p-6 shadow-card ring-1 ring-black/5 lg:grid-cols-5"
      >
        <div className="space-y-4 lg:col-span-3">
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

          {profileStatus && <p className="text-xs text-black/60">{profileStatus}</p>}

          <m.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-punch px-5 py-3 text-lg font-semibold text-white shadow-pill hover:brightness-105 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {loading ? "Summoning Nano Banana Pro..." : "Generate Ad Suite"}
          </m.button>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-black/5 bg-black/5 p-4 text-sm text-black/70">
            <p className="font-semibold text-ink">How it works</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Pulls live trends and creative patterns</li>
              <li>Gemini picks strategy and angles</li>
              <li>Nano Banana Pro renders static ad images</li>
              <li>Supabase stores project, copy, and outputs</li>
            </ul>
          </div>

          {result && (
            <div className="space-y-3 rounded-xl border border-black/5 bg-white p-4 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-tight text-black/60">Strategy</p>
              <p className="text-lg font-semibold text-ink">{result.strategy.positioning}</p>
              <p className="text-sm text-black/70">{result.strategy.angle}</p>
              <div className="mt-2 space-y-1 text-sm">
                {result.strategy.key_messages.map((msg) => (
                  <div key={msg} className="rounded-md bg-black/5 px-3 py-2">
                    {msg}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-black/70">
                <p className="font-medium">Layout</p>
                <p>{result.strategy.suggested_layout}</p>
              </div>
              <div className="mt-2 text-sm text-black/70">
                <p className="font-medium">Color rationale</p>
                <p>{result.strategy.color_rationale}</p>
              </div>
            </div>
          )}
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white">Variants</div>
            <p className="text-sm text-black/60">Static ads generated by Nano Banana Pro</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {result.variants.map((variant) => (
              <AdVariantCard key={variant.variant_index} variant={variant} />
            ))}
          </div>
        </div>
      )}

      {celebrate && <ConfettiOverlay />}
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
    <label className="block space-y-2 text-sm font-medium text-ink">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-inner focus:border-punch focus:outline-none"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-ink">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-inner focus:border-punch focus:outline-none"
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
    <label className="block space-y-2 text-sm font-medium text-ink">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-inner focus:border-punch focus:outline-none"
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

function ConfettiOverlay() {
  const pieces = Array.from({ length: 28 });
  const colors = ["#FF4E68", "#FFD166", "#4ade80", "#60a5fa", "#111827"];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((_, i) => {
        const delay = Math.random() * 0.4;
        const rotate = Math.random() * 180 - 90;
        const x = Math.random() * 100;
        return (
          <m.div
            key={i}
            className="absolute h-3 w-2 rounded-sm"
            style={{ left: `${x}%`, top: "-10%", background: colors[i % colors.length] }}
            initial={{ y: "-10%", rotate }}
            animate={{ y: "120vh", rotate: rotate + 180 }}
            transition={{ duration: 1.8, ease: "easeOut", delay }}
          />
        );
      })}
    </div>
  );
}
