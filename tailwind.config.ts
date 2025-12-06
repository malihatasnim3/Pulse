import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F7F2E7",
        ink: "#1F1D2B",
        punch: "#FF4E68",
        banana: "#FFD166",
        forest: "#064E3B"
      },
      boxShadow: {
        card: "0 12px 28px rgba(0,0,0,0.12)",
        pill: "0 10px 20px rgba(0,0,0,0.18)"
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
