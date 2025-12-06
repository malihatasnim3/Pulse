"use client";

import { m } from "framer-motion";
import { useEffect, useState } from "react";

export function Confetti() {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string }[]>([]);

  useEffect(() => {
    const colors = ["#FF3B30", "#FFCC00", "#34C759", "#000000"];
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex justify-center overflow-hidden">
      {particles.map((p) => (
        <m.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "100vh", rotate: 360 }}
          transition={{ duration: 2 + Math.random() * 2, ease: "linear" }}
          className="absolute top-0 h-4 w-4"
          style={{ backgroundColor: p.color }}
        />
      ))}
      
    </div>
  );
}
