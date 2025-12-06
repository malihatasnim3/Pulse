"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save, AlertCircle, RefreshCcw, Sparkles, Upload, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { CompanyProfile, TrendTopic } from "@/types/db";
import { buildCompanyProfileUpsert, hydrateCompanyProfile } from "@/lib/companyProfile";

const defaultProfile: CompanyProfileForm = {
  company_name: "",
  tagline: "",
  mission_statement: "",
  company_description: "",
  brand_voice: "Conversational",
  brand_colors: "#FF4E68, #111827",
  target_markets: [],
  targeted_keywords: [],
  brand_guidelines_url: null,
  platform_preference: "tiktok"
};

type CompanyProfileForm = {
  company_name: string;
  tagline: string;
  mission_statement: string;
  company_description: string;
  brand_voice: string;
  brand_colors: string;
  targeted_keywords: string[];
  target_markets: string[];
  brand_guidelines_url: string | null;
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
  const [guidelineUploading, setGuidelineUploading] = useState(false);

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
        const hydrated = hydrateCompanyProfile(data);
        if (hydrated) {
          setProfile({
            company_name: hydrated.company_name ?? "",
            tagline: hydrated.tagline ?? "",
            mission_statement: hydrated.mission_statement ?? "",
            company_description: hydrated.company_description ?? "",
            brand_voice: hydrated.brand_voice ?? "Conversational",
            brand_colors: (hydrated.brand_colors || []).join(", "),
            target_markets: hydrated.target_markets ?? [],
            targeted_keywords: hydrated.targeted_keywords ?? [],
            brand_guidelines_url: hydrated.brand_guidelines_url ?? null,
            platform_preference: hydrated.platform_preference ?? "tiktok"
          });
        }
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
    const upsertPayload = buildCompanyProfileUpsert(session.user.id, {
      company_name: profile.company_name,
      tagline: profile.tagline,
      mission_statement: profile.mission_statement,
      company_description: profile.company_description,
      brand_voice: profile.brand_voice,
      brand_colors: brandColors,
      targeted_keywords: profile.targeted_keywords,
      target_markets: profile.target_markets,
      brand_guidelines_url: profile.brand_guidelines_url,
      platform_preference: profile.platform_preference
    });
    const { error } = await supabase.from("company_profiles").upsert(upsertPayload);
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
      const brandColors = profile.brand_colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const response = await fetch("/api/company/generate-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          profile: {
            company_name: profile.company_name,
            tagline: profile.tagline,
            mission_statement: profile.mission_statement,
            company_description: profile.company_description,
            brand_voice: profile.brand_voice,
            targeted_keywords: profile.targeted_keywords,
            target_markets: profile.target_markets,
            brand_colors: brandColors,
            platform_preference: profile.platform_preference
          }
        })
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
          <Field label="Tagline" value={profile.tagline} onChange={(v) => setProfile((p) => ({ ...p, tagline: v }))} />
          <TextareaField
            label="Mission statement"
            value={profile.mission_statement}
            onChange={(v) => setProfile((p) => ({ ...p, mission_statement: v }))}
          />
          <TextareaField
            label="Company description"
            value={profile.company_description}
            onChange={(v) => setProfile((p) => ({ ...p, company_description: v }))}
          />
          <Field
            label="Brand voice"
            value={profile.brand_voice}
            onChange={(v) => setProfile((p) => ({ ...p, brand_voice: v }))}
          />
          <TagInput
            label="Target markets"
            values={profile.target_markets}
            onChange={(values) => setProfile((p) => ({ ...p, target_markets: values }))}
            placeholder="Add each market focus"
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
          <GuidelinesUploader
            url={profile.brand_guidelines_url}
            uploading={guidelineUploading}
            onUpload={async (file) => {
              if (!file || !userId) return;
              setGuidelineUploading(true);
              try {
                const path = `guidelines/${userId}-${Date.now()}-${file.name}`.replace(/\s+/g, "-").toLowerCase();
                const { error } = await supabase.storage.from("brand-guidelines").upload(path, file, {
                  contentType: file.type,
                  upsert: true
                });
                if (error) throw error;
                const { data } = supabase.storage.from("brand-guidelines").getPublicUrl(path);
                setProfile((prev) => ({ ...prev, brand_guidelines_url: data?.publicUrl ?? null }));
                setStatus("Brand guidelines uploaded.");
              } catch (err: any) {
                setStatus(err.message || "Upload failed");
              } finally {
                setGuidelineUploading(false);
              }
            }}
            onRemove={async () => {
              setProfile((prev) => ({ ...prev, brand_guidelines_url: null }));
            }}
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
  if (!profile.tagline.trim()) missing.push("tagline");
  if (!profile.mission_statement.trim()) missing.push("mission");
  if (!profile.company_description.trim()) missing.push("description");
  if (!profile.target_markets || profile.target_markets.length === 0) missing.push("target markets");
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

function GuidelinesUploader({
  url,
  uploading,
  onUpload,
  onRemove
}: {
  url: string | null;
  uploading: boolean;
  onUpload: (file: File | null) => Promise<void> | void;
  onRemove: () => Promise<void> | void;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-inner">
      <p className="text-sm font-medium text-ink">Brand guidelines</p>
      <p className="text-xs text-black/60">Upload a PDF or deck that explains your brand voice, layouts, or design guardrails.</p>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-pill">
        <Upload className="h-4 w-4" />
        <span>{uploading ? "Uploading..." : "Upload Guidelines"}</span>
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.key,.doc,.docx,.txt"
          className="hidden"
          disabled={uploading}
          onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
        />
      </label>
      {url ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs text-black/80">
          <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-punch underline">
            View current guidelines
          </a>
          <button
            type="button"
            onClick={() => onRemove()}
            className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/70 hover:bg-black/5"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-black/50">No file uploaded yet.</p>
      )}
    </div>
  );
}
