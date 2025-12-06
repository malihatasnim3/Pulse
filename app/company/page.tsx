"use client";

import { AlertCircle, Loader2, RefreshCcw, Save, Sparkles, Trash2, Upload } from "lucide-react";
import type { CompanyProfile, TrendTopic } from "@/types/db";
import { buildCompanyProfileUpsert, hydrateCompanyProfile } from "@/lib/companyProfile";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase";
import { m } from "framer-motion";

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
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      if (isMissingUserColumn(error)) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("trend_topics")
          .select("*")
          .contains("raw_data", { user_id: userId })
          .order("created_at", { ascending: false })
          .limit(12);
        if (legacyError) {
          setTrendStatus(legacyError.message);
        } else {
          setTrends(legacyData ?? []);
          if (!legacyData || legacyData.length === 0) {
            setTrendStatus("No personalized trends yet.");
          }
        }
      } else {
        setTrendStatus(error.message);
      }
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
      const usedKeywords = Array.isArray(data?.usedKeywords) ? data.usedKeywords.length : 0;
      const failedKeywords = Array.isArray(data?.failedKeywords) ? data.failedKeywords.length : 0;
      const totalKeywords = Array.isArray(data?.keywords) ? data.keywords.length : usedKeywords + failedKeywords;
      const fallbackNote = data?.usedFallback ? " (Google Trends fallback)" : "";
      setTrendStatus(
        `Generated ${data?.inserted ?? 0} new trends across ${totalKeywords} target keywords (${usedKeywords} hits, ${failedKeywords} misses)${fallbackNote}.`
      );
    } catch (err: any) {
      setTrendStatus(err.message || "Trend generation failed.");
    } finally {
      setGeneratingTrends(false);
    }
  };

  const brandColorArray = useMemo(
    () =>
      profile.brand_colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    [profile.brand_colors]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-black text-ink tracking-tight">Company Profile</h1>
        <p className="mt-3 text-xl font-bold text-black/60">
          Your brand identity powers the Ad Builder.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-lg font-bold text-black/60">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      )}

      {!loading && status && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-punch border-3 border-black" />
          <div className="relative flex items-center gap-3 rounded-3xl border-3 border-black bg-white p-5">
            <AlertCircle className="h-5 w-5 text-punch" />
            <span className="font-bold text-ink">{status}</span>
          </div>
        </m.div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProfile();
            }}
            className="relative lg:col-span-3"
          >
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2.5rem] bg-mustard border-3 border-black" />

            <div className="relative space-y-6 rounded-[2.5rem] border-3 border-black bg-white p-8">
              <Field
                label="Company name"
                value={profile.company_name}
                onChange={(v) => setProfile((p) => ({ ...p, company_name: v }))}
              />
              <Field label="Tagline" value={profile.tagline} onChange={(v) => setProfile((p) => ({ ...p, tagline: v }))} />
              <TextArea
                label="Mission statement"
                value={profile.mission_statement}
                onChange={(v) => setProfile((p) => ({ ...p, mission_statement: v }))}
              />
              <TextArea
                label="Company description"
                value={profile.company_description}
                onChange={(v) => setProfile((p) => ({ ...p, company_description: v }))}
              />
              <Field
                label="Brand voice"
                value={profile.brand_voice}
                onChange={(v) => setProfile((p) => ({ ...p, brand_voice: v }))}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <Field
                  label="Brand colors (comma separated hex)"
                  value={profile.brand_colors}
                  onChange={(v) => setProfile((p) => ({ ...p, brand_colors: v }))}
                  placeholder="#FF4E68, #111827"
                />
              </div>

              {/* Color Preview */}
              {brandColorArray.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {brandColorArray.map((color, idx) => (
                    <div
                      key={idx}
                      className="h-8 w-8 rounded-lg border-2 border-black"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              <TagInput
                label="Target markets"
                values={profile.target_markets}
                onChange={(values) => setProfile((p) => ({ ...p, target_markets: values }))}
                placeholder="Add market focus"
              />
              <TagInput
                label="Targeted keywords"
                values={profile.targeted_keywords}
                onChange={(keywords) => setProfile((p) => ({ ...p, targeted_keywords: keywords }))}
                placeholder="Press Enter to add keyword"
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

              <m.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                {saving ? "Saving..." : "Save Profile"}
              </m.button>

              {userEmail && <p className="text-sm font-bold text-black/60">Signed in as {userEmail}</p>}
            </div>
          </form>

          {/* Sidebar */}
          <div className="space-y-8 lg:col-span-2">
            {/* Profile Status */}
            <div className="relative group">
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-cream border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
              <div className="relative rounded-3xl border-3 border-black bg-white p-6">
                <p className="font-black text-xl text-ink">Profile Status</p>
                {profileComplete ? (
                  <div className="mt-4">
                    <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-success px-4 py-2 text-sm font-bold text-white">
                      ✓ Complete
                    </div>
                    <p className="mt-3 text-sm font-medium text-black/70">
                      Your profile is ready. The Ad Builder will use this data.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-mustard px-4 py-2 text-sm font-bold text-ink">
                      Incomplete
                    </div>
                    <p className="mt-3 text-sm font-medium text-black/70">Missing: {missingFields.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personalized Trends */}
            <div className="relative group">
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-forest border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
              <div className="relative rounded-3xl border-3 border-black bg-white p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-forest" />
                  <p className="font-black text-xl text-ink">Live Trends</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateTrends}
                    disabled={!profileComplete || generatingTrends}
                    className="flex-1 rounded-full border-3 border-black bg-forest px-4 py-3 text-sm font-bold text-white shadow-hard-sm disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-1 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    {generatingTrends ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Generate"}
                  </button>
                  <button
                    type="button"
                    onClick={fetchTrends}
                    disabled={trendsLoading || generatingTrends}
                    className="rounded-full border-3 border-black bg-white px-4 py-3 text-sm font-bold text-ink shadow-hard-sm disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-1 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    {trendsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  </button>
                </div>

                {!profileComplete && (
                  <div className="mt-4 rounded-xl border-2 border-black bg-amber-50 p-4 text-sm">
                    <p className="font-bold text-amber-900">Complete your profile first</p>
                  </div>
                )}

                {trendStatus && (
                  <div className="mt-4 rounded-xl border-2 border-black bg-black/5 p-3 text-xs font-bold text-black/70">
                    {trendStatus}
                  </div>
                )}

                {trends.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                    {trends.map((trend) => (
                      <div key={trend.id} className="rounded-xl border-2 border-black bg-cream p-3">
                        <p className="text-xs font-black uppercase text-black/40">{trend.platform}</p>
                        <p className="text-sm font-bold text-ink">{trend.name}</p>
                        <p className="text-xs text-black/60 mt-1 line-clamp-2">{trend.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="input-field min-h-[120px]" rows={3} />
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field appearance-none">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
    <div className="space-y-2 text-base font-bold text-ink">
      <span className="block">{label}</span>
      <div className="rounded-2xl border-3 border-black bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {values.length === 0 && <span className="text-sm font-medium text-black/40">No items added yet.</span>}
          {values.map((keyword, index) => (
            <span
              key={`${keyword}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-punch px-3 py-1 text-sm font-bold text-white border-2 border-black"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                className="text-lg leading-none text-white/80 hover:text-white"
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
          className="w-full rounded-xl border-3 border-black bg-white px-4 py-3 text-base font-bold text-ink focus:outline-none focus:ring-4 focus:ring-mustard/30"
        />
      </div>
    </div>
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
    <div className="rounded-2xl border-3 border-black bg-white p-5">
      <p className="text-base font-bold text-ink">Brand guidelines</p>
      <p className="text-sm font-medium text-black/60 mt-1">
        Upload a PDF or deck with your brand voice and design guardrails.
      </p>
      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border-3 border-black bg-ink px-5 py-3 text-sm font-bold text-white shadow-hard-sm hover:-translate-y-1 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
        <Upload className="h-5 w-5" />
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
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border-2 border-black bg-cream px-4 py-3 text-sm font-bold">
          <a href={url} target="_blank" rel="noreferrer" className="text-punch underline">
            View guidelines
          </a>
          <button
            type="button"
            onClick={() => onRemove()}
            className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold hover:bg-punch hover:text-white transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm font-medium text-black/50">No file uploaded yet.</p>
      )}
    </div>
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

function isMissingUserColumn(error: { message?: string } | null) {
  if (!error?.message) return false;
  const normalized = error.message.toLowerCase();
  return normalized.includes("user_id") && normalized.includes("column");
}
