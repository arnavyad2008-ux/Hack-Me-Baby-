import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#05070d",
          panel: "#0b101b",
          border: "#1a2333",
          red: {
            DEFAULT: "#ff003c",
            glow: "#ff3366",
            dark: "#2b0a14",
          },
          blue: {
            DEFAULT: "#00f0ff",
            glow: "#38bdf8",
            dark: "#052238",
          },
          neon: "#39ff14",
          warning: "#ffb703",
          text: "#e2e8f0",
          muted: "#64748b",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        "red-glow": "0 0 25px -5px rgba(255, 0, 60, 0.5)",
        "blue-glow": "0 0 25px -5px rgba(0, 240, 255, 0.5)",
        "neon-glow": "0 0 20px -5px rgba(57, 255, 20, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
