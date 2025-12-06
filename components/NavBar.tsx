"use client";

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
    <>
      {/* Spacer to prevent content from being hidden behind the fixed logo */}
      {/* <div className="h-24" aria-hidden="true" /> */}

      {/* Navigation - Bottom Center */}
      <nav className="fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border-3 border-black bg-punch px-3 py-3 shadow-hard">
        {/* Logo */}
        <Link 
          href="/trends" 
          className="mr-2 flex items-center gap-2 rounded-full px-4 py-2 font-bold text-white transition-transform hover:-translate-y-1"
        >
          <svg width="29" height="13" viewBox="0 0 89 63" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.5 35.2829H12.4423C12.478 35.2829 12.511 35.2639 12.5289 35.2329L18.4024 25.0596C18.4432 24.989 18.5467 24.9942 18.5802 25.0685L29.4007 49.061C29.4373 49.1422 29.5539 49.1386 29.5854 49.0552L46.3935 4.56319C46.4275 4.47316 46.5566 4.47844 46.5832 4.57095L61.9253 58.0211C61.9509 58.1104 62.0738 58.1195 62.1124 58.035L72.4733 35.3414C72.4896 35.3058 72.5251 35.2829 72.5643 35.2829H84" stroke="white" stroke-width="9" stroke-linecap="round"/>
</svg>

          <span className="whitespace-nowrap">Pulse</span>
        </Link>

        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all hover:-translate-y-1 ${
                active 
                  ? "bg-white text-punch shadow-none" 
                  : "text-white hover:bg-white/20"
              }`}
            >
              <link.icon className={`h-4 w-4 shrink-0 ${active ? "text-punch" : "text-white"}`} />
              <span className="hidden md:inline whitespace-nowrap">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
