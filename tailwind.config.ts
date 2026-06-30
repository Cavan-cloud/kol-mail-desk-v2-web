import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#182126",
        muted: "#65727c",
        line: "#d9e0e4",
        panel: "#f4f7f6",
        paper: "#ffffff",
        accent: "#0f766e",
        "accent-strong": "#0b5d57",
        glass: "rgba(255, 255, 255, 0.68)",
        "glass-strong": "rgba(255, 255, 255, 0.86)",
        "glass-line": "rgba(255, 255, 255, 0.64)",
        lovart: "#f0b65a",
        "lovart-soft": "#fff2db"
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace"
        ]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(24, 33, 38, 0.08)",
        glass: "0 18px 50px rgba(38, 54, 62, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.72)",
        float: "0 12px 32px rgba(20, 30, 36, 0.10), 0 2px 8px rgba(15, 118, 110, 0.06)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.66), inset 0 -1px 0 rgba(24,33,38,0.03)"
      },
      transitionTimingFunction: {
        fluid: "cubic-bezier(0.32, 0.72, 0, 1)"
      }
    }
  },
  plugins: []
};

export default config;
