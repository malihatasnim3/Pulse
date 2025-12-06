"use client";

import { useState } from "react";
import { useSupabaseAuth } from "@/components/SupabaseAuthClient";
import { Loader2, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { supabase, session, loading } = useSupabaseAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus("Welcome back!");
      setTimeout(() => router.push("/trends"), 500);
    } catch (err: any) {
      setStatus(err?.message || "Sign in failed");
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
    <div className="min-h-screen flex items-center justify-center py-12 px-6 bg-gradient-to-br from-cream via-white to-mustard/20" style={{marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw', marginTop: '-2.5rem'}}>
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-punch/10 px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-punch" />
            <span className="text-sm font-bold text-punch">Welcome Back</span>
          </div>
          <h1 className="text-5xl font-bold text-ink mb-2">Sign In</h1>
          <p className="text-black/60">Continue building viral ads</p>
        </div>

        <div className="card-pop p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {status && (
              <div className={`rounded-xl border-3 p-4 text-sm font-semibold ${
                status.includes("Welcome")
                  ? "bg-success/10 border-success text-success"
                  : "bg-punch/10 border-punch text-punch"
              }`}>
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
                  Sign In
                  <ArrowRight className="inline-block ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-3 border-black/5 text-center">
            <p className="text-black/60">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-punch hover:underline"
              >
                Sign up free
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
        </div>
      </div>
    </div>
  );
}
