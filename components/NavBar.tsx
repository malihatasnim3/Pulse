"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LineChart, History, Wand2, Flame, Package } from "lucide-react";

const links = [
  { href: "/trends", label: "Trends", icon: Flame },
  { href: "/ad-builder", label: "Ad Builder", icon: Wand2 },
  { href: "/company", label: "Company", icon: LineChart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/ad-history", label: "Ad History", icon: History }
];

export function NavBar() {
  const pathname = usePathname();

  // Hide navbar on landing, signin, and signup pages
  const hideNavbarRoutes = ["/landing", "/signin", "/signup"];
  if (hideNavbarRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/trends" className="group flex items-center gap-2 text-lg font-semibold text-ink">
          <Sparkles className="h-5 w-5 text-punch transition-transform group-hover:-rotate-6" />
          <span>Pulse Ads Lab</span>
        </Link>
        <nav className="flex items-center gap-2 rounded-full bg-white/80 px-2 py-1 shadow-pill">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <m.div whileHover={{ y: -2 }} key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-punch text-white shadow-card" : "text-ink hover:bg-black/5"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </m.div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
