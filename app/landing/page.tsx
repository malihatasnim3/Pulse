"use client";

import Link from "next/link";
import { Zap, TrendingUp, Target, Sparkles, ArrowRight, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen -mt-10 -mx-6">
      {/* Top Navigation Bar with Sign In */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-6 py-3 text-base font-bold text-white border-2 border-white hover:bg-white/30 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-punch via-pink-500 to-mustard py-24 px-6">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="relative mx-auto max-w-full px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                AI-Powered Trend Analysis
              </div>

              <h1 className="text-6xl font-bold leading-tight">
                Ride the Wave of
                <span className="block text-mustard drop-shadow-lg">
                  Social Trends
                </span>
              </h1>

              <p className="text-xl text-white/90 font-medium max-w-xl">
                Turn viral moments into high-converting ads. Pulse analyzes trends from TikTok, Reddit, YouTube, and Google to create ads that connect.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-lg font-bold text-white shadow-hard-lg border-3 border-white transition-all hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>


              </div>
            </div>

            <div className="flex-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-white/20 backdrop-blur-sm rounded-3xl rotate-3"></div>
                <div className="relative bg-white rounded-3xl border-3 border-ink shadow-hard-lg p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-black/60 font-semibold">Live Trend</div>
                      <div className="text-lg font-bold text-ink">#VintageFashion +285%</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-punch flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-black/60 font-semibold">Ad Performance</div>
                      <div className="text-lg font-bold text-ink">3.2x CTR Boost</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-mustard flex items-center justify-center">
                      <Zap className="h-6 w-6 text-ink" />
                    </div>
                    <div>
                      <div className="text-sm text-black/60 font-semibold">AI Generation</div>
                      <div className="text-lg font-bold text-ink">Ready in 30 seconds</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-cream">
        <div className="mx-auto max-w-full px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-ink mb-4">
              Everything you need to create viral ads
            </h2>
            <p className="text-xl text-black/70">
              Powered by AI, backed by real-time trend data
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-pop p-8 space-y-4 hover:-translate-y-2 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-punch to-pink-500 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-ink">Trend Radar</h3>
              <p className="text-black/70">
                Real-time monitoring of trending topics across TikTok, Reddit, YouTube, Google Trends, and Meta Ads Library.
              </p>
            </div>

            <div className="card-pop p-8 space-y-4 hover:-translate-y-2 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mustard to-yellow-500 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-ink" />
              </div>
              <h3 className="text-2xl font-bold text-ink">AI Ad Builder</h3>
              <p className="text-black/70">
                Generate compelling ad copy and visuals that tap into current trends. Multiple variants in seconds.
              </p>
            </div>

            <div className="card-pop p-8 space-y-4 hover:-translate-y-2 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-green-500 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-ink">Performance Analytics</h3>
              <p className="text-black/70">
                Track engagement, impressions, and conversions. See which trends drive the best results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-ink to-purple-900">
        <div className="mx-auto max-w-full px-8 text-center space-y-8">
          <h2 className="text-5xl font-bold text-white">
            Ready to create trend-aware ads?
          </h2>
          <p className="text-xl text-white/80">
            Join marketers who are already riding the wave
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-mustard px-10 py-5 text-xl font-bold text-ink shadow-hard-lg border-3 border-white transition-all hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Start Building Free
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-ink text-white/60 text-center text-sm">
        <p>&copy; 2024 Pulse. Trend-Aware AI Ads.</p>
      </footer>
    </div>
  );
}
