"use client";

import type { CompanyProfile, CreativePattern, TrendTopic } from "@/types/db";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { hydrateCompanyProfile } from "@/lib/companyProfile";
import { m } from "framer-motion";

type Props = {
  trends: TrendTopic[];
  patterns: CreativePattern[];
};

export function TrendsClient({ trends, patterns }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [profileReady, setProfileReady] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [trendItems, setTrendItems] = useState<TrendTopic[]>(trends);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const loadTrends = useCallback(
    async (uid: string) => {
      setTrendsLoading(true);
      setTrendError(null);
      const { data, error } = await supabase
        .from("trend_topics")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!mountedRef.current) return;
      if (error) {
        if (isMissingUserColumn(error)) {
          const { data: legacyData, error: legacyError } = await supabase
            .from("trend_topics")
            .select("*")
            .contains("raw_data", { user_id: uid })
            .order("created_at", { ascending: false })
            .limit(30);
          if (!mountedRef.current) return;
          if (legacyError) {
            setTrendError(legacyError.message);
            setTrendItems([]);
          } else {
            setTrendItems((legacyData as TrendTopic[]) ?? []);
          }
        } else {
          setTrendError(error.message);
          setTrendItems([]);
        }
      } else {
        setTrendItems((data as TrendTopic[]) ?? []);
      }
      setTrendsLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    let cancelled = false;
    const checkProfile = async () => {
      setCheckingProfile(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const session = data.session;
        if (!session?.user) {
          if (!cancelled && mountedRef.current) {
            setUserId(null);
            setProfileReady(false);
            setTrendItems([]);
          }
          return;
        }

        if (!cancelled && mountedRef.current) {
          setUserId(session.user.id);
        }

        const { data: profileRow, error: profileError } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        let profileIsComplete = false;
        const profile = hydrateCompanyProfile(profileRow as any);
        if (!cancelled && mountedRef.current) {
          if (profileError) {
            console.warn("[trends] profile fetch failed", profileError);
            setProfileReady(false);
            setTrendError((prev) => prev ?? profileError.message);
          } else {
            profileIsComplete = profile ? isProfileComplete(profile) : false;
            setProfileReady(profileIsComplete);
          }
        }

        if (!cancelled && profileIsComplete) {
          await loadTrends(session.user.id);
        }
      } catch (err: any) {
        if (!cancelled && mountedRef.current) {
          setProfileReady(false);
          setTrendError(err?.message || "Unable to load company profile.");
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setCheckingProfile(false);
        }
      }
    };
    checkProfile();
    return () => {
      cancelled = true;
    };
  }, [supabase, loadTrends]);

  const needsProfile = profileReady === false && !checkingProfile;
  const showTrends = profileReady === true;
  const hasTrends = trendItems.length > 0;
  const canRefresh = Boolean(userId);
  const refreshTrends = useCallback(() => {
    if (userId) {
      loadTrends(userId);
    }
  }, [loadTrends, userId]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white shadow-pill">Live</div>
        <div>
          <h1 className="text-3xl font-semibold">Trends Radar</h1>
          <p className="text-sm text-black/60">Fresh topics + creative patterns feeding the ad brain.</p>
        </div>
      </div>

      {checkingProfile && (
        <div className="rounded-xl border border-black/10 bg-black/5 p-4 text-sm text-black/70">Checking your company profile...</div>
      )}

      {needsProfile && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Complete your company profile to unlock personalized trend tracking.</span>
          </div>
          <Link href="/company" className="rounded-full bg-amber-900 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Go to company page
          </Link>
        </div>
      )}

      {showTrends && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/80 p-4 text-sm text-black/70">
            <span>
              {trendsLoading
                ? "Pulling your personalized culture radar..."
                : hasTrends
                  ? `Showing ${trendItems.length} personalized signal${trendItems.length === 1 ? "" : "s"}.`
                  : "No personalized signals yet. Generate them from the Company page once your profile is saved."}
            </span>
            <button
              type="button"
              onClick={refreshTrends}
              disabled={!canRefresh || trendsLoading}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/70 shadow-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {trendsLoading ? "Refreshing..." : "Refresh trends"}
            </button>
          </div>

          {trendError && (
            <div className="flex items-center gap-2 rounded-xl border border-punch/30 bg-punch/5 px-3 py-2 text-xs text-punch">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{trendError}</span>
            </div>
          )}

          {trendsLoading && (
            <div className="rounded-xl border border-black/10 bg-black/5 p-4 text-sm text-black/70">
              Fetching your latest personalized signals...
            </div>
          )}

          {!trendsLoading && !trendError && !hasTrends && (
            <div className="rounded-xl border border-black/10 bg-black/5 p-4 text-sm text-black/70">
              No personalized trends yet. Generate them from the Company page once your profile is saved.
            </div>
          )}

          {hasTrends && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {trendItems.map((trend, idx) => (
                <m.div
                  key={`${trend.platform}-${trend.id}-${idx}`}
                  className="rounded-2xl border-2 border-black/5 bg-white p-4 shadow-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  whileHover={{ rotate: -1.5, y: -2 }}
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-tight text-black/50">
                    <span>{trend.platform}</span>
                    <span>{trend.category || "general"}</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-ink">{trend.name}</p>
                  <p className="mt-1 text-sm text-black/70">{trend.description || "Trending now"}</p>
                  <div className="mt-3 flex gap-2 text-xs font-semibold">
                    {trend.source && <span className="rounded-full bg-punch/10 px-3 py-1 text-punch">Source: {trend.source}</span>}
                    {trend.score && <span className="rounded-full bg-forest/10 px-3 py-1 text-forest">Score {trend.score}</span>}
                  </div>
                </m.div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border-2 border-black/5 bg-white p-4 shadow-card">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-punch px-3 py-1 text-xs font-semibold text-white shadow-pill">Patterns</div>
              <p className="text-sm text-black/60">Reusable creative shapes the LLM leans on.</p>
            </div>
            {patterns.length === 0 && (
              <p className="mt-2 text-sm text-black/60">No creative patterns yet. Seed `creative_patterns` in Supabase.</p>
            )}
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {patterns.map((pattern, idx) => (
                <m.div
                  key={`${pattern.id}-${idx}`}
                  className="rounded-xl border border-black/5 bg-black/5 p-3"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-tight text-black/50">
                    <span>{pattern.platform || "any"}</span>
                  </div>
                  <p className="mt-1 text-base font-semibold text-ink">{pattern.name}</p>
                  <p className="mt-1 text-sm text-black/70">{pattern.description}</p>
                  {pattern.example_usage && <p className="mt-2 text-xs text-black/60">e.g. {pattern.example_usage}</p>}
                </m.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function isProfileComplete(profile: CompanyProfile) {
  return Boolean(
    profile.company_name?.trim() &&
      profile.company_description?.trim() &&
      profile.tagline?.trim() &&
      profile.mission_statement?.trim() &&
      profile.targeted_keywords?.length &&
      profile.target_markets?.length
  );
}

function isMissingUserColumn(error: { message?: string } | null) {
  if (!error?.message) return false;
  const normalized = error.message.toLowerCase();
  return normalized.includes("user_id") && normalized.includes("column");
}

