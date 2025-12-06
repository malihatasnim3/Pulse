"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save, AlertCircle, RefreshCcw, Sparkles } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { CompanyProfile, TrendTopic } from "@/types/db";

const defaultProfile: CompanyProfileForm = {
  company_name: "",
  brand_colors: "#FF4E68, #111827",
  product: "",
  audience: "",
  goal: "",
  company_description: "",
  targeted_keywords: [],
  platform_preference: "tiktok"
};

type CompanyProfileForm = {
  company_name: string;
  brand_colors: string;
  product: string;
  audience: string;
  goal: string;
  company_description: string;
  targeted_keywords: string[];
  platform_preference: string;
};

export default function CompanyPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [profile, setProfile] = useState<CompanyProfileForm>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [generatingTrends, setGeneratingTrends] = useState(false);
  const [trendStatus, setTrendStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.user) {
        setStatus("Please sign in first.");
        setLoading(false);
        return;
      }
      setUserEmail(session.user.email || null);
      setUserId(session.user.id);
      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") {
        setStatus(error.message);
      } else if (data) {
        setProfile({
          company_name: data.company_name ?? "",
          brand_colors: (data.brand_colors || []).join(", "),
          product: data.product ?? "",
          audience: data.audience ?? "",
          goal: data.goal ?? "",
          company_description: data.company_description ?? "",
          targeted_keywords: data.targeted_keywords ?? [],
          platform_preference: data.platform_preference ?? "tiktok"
        });
      }
      setLoading(false);
    };
    load();
  }, [supabase]);

  const fetchTrends = useCallback(async () => {
    if (!userId) return;
    setTrendsLoading(true);
    setTrendStatus(null);
    const { data, error } = await supabase
      .from("trend_topics")
      .select("*")
      .contains("raw_data", { user_id: userId })
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) {
      setTrendStatus(error.message);
    } else {
      setTrends(data ?? []);
      if (!data || data.length === 0) {
        setTrendStatus("No personalized trends yet.");
      }
    }
    setTrendsLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (!userId) return;
    fetchTrends();
  }, [userId, fetchTrends]);

  const saveProfile = async () => {
    setSaving(true);
    setStatus(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session?.user) {
      setStatus("Please sign in first.");
      setSaving(false);
      return;
    }
    const brandColors = profile.brand_colors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const { error } = await supabase.from("company_profiles").upsert({
      user_id: session.user.id,
      company_name: profile.company_name,
      brand_colors: brandColors,
      product: profile.product,
      audience: profile.audience,
      goal: profile.goal,
      company_description: profile.company_description,
      targeted_keywords: profile.targeted_keywords,
      platform_preference: profile.platform_preference
    });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Saved. The Ad Builder will auto-fill from this profile.");
    }
    setSaving(false);
  };

  const missingFields = useMemo(() => computeMissingFields(profile), [profile]);
  const profileComplete = missingFields.length === 0;

  const handleGenerateTrends = async () => {
    if (!userId) {
      setTrendStatus("Please sign in to generate trends.");
      return;
    }
    if (!profileComplete) {
      setTrendStatus("Complete your profile to unlock personalized trends.");
      return;
    }
    setGeneratingTrends(true);
    setTrendStatus("Personalizing cultural moments...");
    try {
      const response = await fetch("/api/company/generate-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Trend generation failed.");
      }
      await fetchTrends();
      setTrendStatus(`Generated ${data?.inserted ?? 0} new trends from ${data?.queries?.length ?? 0} searches.`);
    } catch (err: any) {
      setTrendStatus(err.message || "Trend generation failed.");
    } finally {
      setGeneratingTrends(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-white/90 p-6 shadow-card ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-tight text-black/50">Company</p>
          <h1 className="text-2xl font-semibold text-ink">Company profile</h1>
          <p className="text-sm text-black/60">Saved data will prefill the ad builder.</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-black/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile...
        </div>
      )}

      {!loading && status && (
        <div className="flex items-center gap-2 rounded-lg bg-black/5 p-3 text-sm text-black/70">
          <AlertCircle className="h-4 w-4 text-punch" />
          <span>{status}</span>
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          <Field
            label="Company name"
            value={profile.company_name}
            onChange={(v) => setProfile((p) => ({ ...p, company_name: v }))}
          />
          <Field
            label="Product"
            value={profile.product}
            onChange={(v) => setProfile((p) => ({ ...p, product: v }))}
          />
          <Field
            label="Audience"
            value={profile.audience}
            onChange={(v) => setProfile((p) => ({ ...p, audience: v }))}
          />
          <Field label="Goal" value={profile.goal} onChange={(v) => setProfile((p) => ({ ...p, goal: v }))} />
          <TextareaField
            label="Company description"
            value={profile.company_description}
            onChange={(v) => setProfile((p) => ({ ...p, company_description: v }))}
          />
          <TagInput
            label="Targeted keywords"
            values={profile.targeted_keywords}
            onChange={(keywords) => setProfile((p) => ({ ...p, targeted_keywords: keywords }))}
            placeholder="Press Enter to add each keyword"
          />
          <Field
            label="Brand colors (comma separated hex)"
            value={profile.brand_colors}
            onChange={(v) => setProfile((p) => ({ ...p, brand_colors: v }))}
          />
          <Select
            label="Preferred platform"
            value={profile.platform_preference}
            onChange={(v) => setProfile((p) => ({ ...p, platform_preference: v }))}
            options={[
              { value: "tiktok", label: "TikTok" },
              { value: "meta", label: "Meta" },
              { value: "youtube", label: "YouTube" }
            ]}
          />
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-punch px-4 py-3 text-sm font-semibold text-white shadow-pill hover:brightness-105 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </button>
          {userEmail && <p className="text-xs text-black/60">Signed in as {userEmail}</p>}

          <section className="mt-8 space-y-4 rounded-2xl border border-black/10 bg-gradient-to-br from-white to-slate-50 p-5 shadow-inner">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-tight text-black/50">Personalized research</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Live cultural trends</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateTrends}
                    disabled={!profileComplete || generatingTrends}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {generatingTrends ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate trends
                  </button>
                  <button
                    type="button"
                    onClick={fetchTrends}
                    disabled={trendsLoading || generatingTrends}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black/70 shadow-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {trendsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {!profileComplete && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
                <p className="font-semibold">Complete your profile to unlock personalized research.</p>
                <p className="mt-1 text-xs">Missing: {missingFields.join(", ")}</p>
              </div>
            )}

            {trendStatus && (
              <div className="flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-xs text-black/70">
                <AlertCircle className="h-3.5 w-3.5 text-punch" />
                <span>{trendStatus}</span>
              </div>
            )}

            <div className="space-y-3">
              {trendsLoading ? (
                <div className="flex items-center gap-2 text-sm text-black/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching your latest trend signals...
                </div>
              ) : trends.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {trends.map((trend) => (
                    <article key={trend.id} className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-card">
                      <p className="text-xs uppercase tracking-tight text-black/40">{trend.category || trend.platform}</p>
                      <h3 className="mt-1 text-sm font-semibold text-ink">{trend.name}</h3>
                      <p className="mt-2 text-xs text-black/60">
                        {trend.description ?? "No description available."}
                      </p>
                      <div className="mt-3 text-[11px] text-black/40">
                        <span>Source: {trend.source ?? trend.platform ?? "SERP"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-black/50">No personalized trends yet. Generate to see live culture cues.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-ink">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-inner focus:border-punch focus:outline-none"
      />
    </label>
  );
}

function computeMissingFields(profile: CompanyProfileForm) {
  const missing: string[] = [];
  if (!profile.company_name.trim()) missing.push("company name");
  if (!profile.product.trim()) missing.push("product");
  if (!profile.audience.trim()) missing.push("audience");
  if (!profile.goal.trim()) missing.push("goal");
  if (!profile.company_description.trim()) missing.push("description");
  if (!profile.targeted_keywords || profile.targeted_keywords.length === 0) missing.push("keywords");
  return missing;
}

function TextareaField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-ink">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-inner focus:border-punch focus:outline-none min-h-[120px]"
      />
    </label>
  );
}

function TagInput({
  label,
  values,
  onChange,
  placeholder
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addKeyword = () => {
    const clean = inputValue.trim();
    if (!clean) return;
    if (values.some((keyword) => keyword.toLowerCase() === clean.toLowerCase())) {
      setInputValue("");
      return;
    }
    onChange([...values, clean]);
    setInputValue("");
  };

  const removeKeyword = (index: number) => {
    onChange(values.filter((_, idx) => idx !== index));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addKeyword();
    }
  };

  return (
    <div className="space-y-2 text-sm font-medium text-ink">
      <span className="block">{label}</span>
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-inner space-y-3">
        <div className="flex flex-wrap gap-2">
          {values.length === 0 && (
            <span className="text-xs font-normal text-black/40">No keywords added yet.</span>
          )}
          {values.map((keyword, index) => (
            <span
              key={`${keyword}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-punch/10 px-3 py-1 text-xs font-semibold text-punch border border-punch/20"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                className="text-base leading-none text-punch/70 hover:text-punch"
                aria-label={`Remove ${keyword}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-normal text-ink focus:border-punch focus:outline-none"
        />
      </div>
    </div>
  );
}
function Select({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
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
