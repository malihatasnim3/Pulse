import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/NavBar";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Pulse | Trend-Aware AI Ads",
  description: "Build Nano Banana Pro powered ads that ride social trends."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${grotesk.variable} pattern-bg text-ink`}>
        <NavBar />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
