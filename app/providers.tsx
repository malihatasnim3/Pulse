"use client";

import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <LazyMotion features={domAnimation}>
      <AuthGuard>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="min-h-screen"
          >
            {children}
          </m.div>
        </AnimatePresence>
      </AuthGuard>
    </LazyMotion>
  );
}
