"use client";

import { useState } from "react";
import { useSupabaseAuth } from "@/components/SupabaseAuthClient";
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { supabase, session, loading } = useSupabaseAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setSuccess(true);
      setStatus("Account created! Check your email to confirm, then sign in.");
    } catch (err: any) {
      setStatus(err?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-punch" />
      </div>
    );
  }

  if (session) {
    router.push("/trends");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-6 bg-gradient-to-br from-punch/10 via-white to-success/10" style={{marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw', marginTop: '-2.5rem'}}>
      <div className="w-full max-w-7xl px-4">
        <div className="grid lg:grid-cols-[1fr,500px] gap-16 items-start">
          {/* Left Side - Benefits */}
          <div className="space-y-8 lg:pr-16 lg:py-8">
            <div>
              <h1 className="text-5xl font-bold text-ink mb-4">
                Join Pulse Today
              </h1>
              <p className="text-xl text-black/70">
                Start creating trend-aware ads in minutes
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-lg">Real-Time Trend Tracking</h3>
                  <p className="text-black/60">
                    Monitor TikTok, Reddit, YouTube, and Google Trends automatically
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-punch flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-lg">AI Ad Generation</h3>
                  <p className="text-black/60">
                    Create multiple ad variants optimized for current trends
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-mustard flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-ink" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-lg">Performance Analytics</h3>
                  <p className="text-black/60">
                    Track what works and optimize your campaigns
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="card-pop p-8 bg-white">
            {success ? (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-ink mb-2">Check Your Email!</h2>
                  <p className="text-black/60">
                    We've sent a confirmation link to <span className="font-semibold text-ink">{email}</span>
                  </p>
                </div>
                <div className="pt-4">
                  <Link
                    href="/signin"
                    className="inline-flex items-center gap-2 text-punch font-bold hover:underline"
                  >
                    Go to Sign In
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-ink mb-2">Create Account</h2>
                  <p className="text-black/60">Get started with your free account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-ink uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field input-field-icon"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-ink uppercase tracking-wide">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field input-field-icon"
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {status && !success && (
                    <div className="rounded-xl border-3 border-punch bg-punch/10 p-4 text-sm font-semibold text-punch">
                      {status}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy || loading}
                    className="btn-primary group"
                  >
                    {busy ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="inline-block ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-black/50 text-center">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>

                <div className="mt-6 pt-6 border-t-3 border-black/5 text-center">
                  <p className="text-black/60">
                    Already have an account?{" "}
                    <Link
                      href="/signin"
                      className="font-bold text-punch hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href="/landing"
                    className="text-sm text-black/40 hover:text-black/60 font-semibold"
                  >
                    ← Back to home
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
