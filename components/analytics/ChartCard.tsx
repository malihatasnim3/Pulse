"use client";

import { m } from "framer-motion";
import { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  delay?: number;
  bgColor?: "mustard" | "cream" | "forest" | "punch";
};

const bgColorMap = {
  mustard: "bg-mustard",
  cream: "bg-cream",
  forest: "bg-forest",
  punch: "bg-punch"
};

export function ChartCard({ title, children, delay = 0, bgColor = "cream" }: Props) {
  const bgClass = bgColorMap[bgColor];

  return (
    <m.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className={`absolute inset-0 translate-x-2 translate-y-2 rounded-3xl ${bgClass} border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3`} />
      <div className="relative rounded-3xl border-3 border-black bg-white p-6">
        <p className="text-lg font-black text-ink mb-6">{title}</p>
        <div className="w-full h-[300px]">{children}</div>
      </div>
    </m.div>
  );
}
