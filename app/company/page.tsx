"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { CompanyProfile } from "@/types/db";

const defaultProfile: CompanyProfileForm = {
  company_name: "",
  brand_colors: "#FF4E68, #111827",
  product: "",
  audience: "",
  goal: "",
  platform_preference: "tiktok"
};

type CompanyProfileForm = {
  company_name: string;
  brand_colors: string;
  product: string;
  audience: string;
  goal: string;
  platform_preference: string;
};

export default function CompanyPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [profile, setProfile] = useState<CompanyProfileForm>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
          platform_preference: data.platform_preference ?? "tiktok"
        });
      }
      setLoading(false);
    };
    load();
  }, [supabase]);

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
      platform_preference: profile.platform_preference
    });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Saved. The Ad Builder will auto-fill from this profile.");
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-white/90 p-6 shadow-card ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-tight text-black/50">Company</p>
          <h1 className="text-2xl font-semibold text-ink">Company profile</h1>
          <p className="text-sm text-black/60">Saved data will prefill the ad builder.</p>
        </div>
        <Link href="/auth" className="text-sm font-semibold text-punch underline">
          Auth →
        </Link>
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
