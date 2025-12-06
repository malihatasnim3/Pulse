"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LineChart, History, Wand2, Flame } from "lucide-react";

const links = [
  { href: "/trends", label: "Trends", icon: Flame },
  { href: "/ad-builder", label: "Ad Builder", icon: Wand2 },
  { href: "/company", label: "Company", icon: LineChart },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/ad-history", label: "Ad History", icon: History }
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
      <nav className="flex items-center gap-2 rounded-full border-3 border-black bg-white px-3 py-3 shadow-hard">
        <Link href="/" className="group flex items-center gap-2 rounded-full px-3 py-2 text-lg font-black text-ink transition-colors hover:bg-black/5">
          <Sparkles className="h-5 w-5 text-punch transition-transform group-hover:-rotate-12" />
          <span className="hidden sm:block">Pulse</span>
        </Link>
        
        <div className="mx-1 h-6 w-0.5 bg-black/10" />

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative"
              >
                <m.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    active 
                      ? "bg-punch text-white border-2 border-black shadow-hard-sm" 
                      : "text-ink hover:bg-black/5"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </m.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
