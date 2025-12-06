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
        cream: "#F9F7F2", // Off-white
        ink: "#1F1D2B",
        punch: "#FF3B30", // Vibrant Red
        mustard: "#FFCC00", // Mustard Yellow
        success: "#34C759", // Bright Green
        forest: "#064E3B"
      },
      boxShadow: {
        card: "0 12px 28px rgba(0,0,0,0.12)",
        pill: "0 10px 20px rgba(0,0,0,0.18)",
        hard: "4px 4px 0px 0px #000000",
        "hard-sm": "2px 2px 0px 0px #000000",
        "hard-lg": "6px 6px 0px 0px #000000"
      },
      borderWidth: {
        3: "3px"
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
