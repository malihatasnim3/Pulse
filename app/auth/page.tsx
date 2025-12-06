"use client";

import { useState } from "react";
import { useSupabaseAuth } from "@/components/SupabaseAuthClient";
import { Loader2, LogOut } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const { supabase, session, loading } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus("Signed in.");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setStatus("Check your email to confirm your account, then sign in.");
      }
    } catch (err: any) {
      setStatus(err?.message || "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl bg-white/90 p-6 shadow-card ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-tight text-black/50">Auth</p>
          <h1 className="text-2xl font-semibold text-ink">Sign in to Pulse</h1>
        </div>
        <Link href="/company" className="text-sm font-semibold text-punch underline">
          Company profile →
        </Link>
      </div>

      {session && (
        <div className="rounded-lg border border-black/5 bg-black/5 p-3 text-sm text-black/70">
          <p className="font-semibold">Signed in as</p>
          <p>{session.user.email}</p>
          <button
            onClick={signOut}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/80 px-3 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2 text-sm font-medium text-ink">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-inner focus:border-punch focus:outline-none"
            required
          />
        </label>
        <label className="block space-y-2 text-sm font-medium text-ink">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-inner focus:border-punch focus:outline-none"
            required
          />
        </label>

        <div className="flex items-center gap-3 text-xs font-semibold text-ink">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "signin"}
              onChange={() => setMode("signin")}
              className="accent-punch"
            />
            Sign in
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "signup"}
              onChange={() => setMode("signup")}
              className="accent-punch"
            />
            Sign up
          </label>
        </div>

        <button
          type="submit"
          disabled={busy || loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-punch px-4 py-3 text-sm font-semibold text-white shadow-pill hover:brightness-105 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        {status && <p className="text-sm text-black/70">{status}</p>}
      </form>
    </div>
  );
}
