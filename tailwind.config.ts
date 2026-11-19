import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Brand colours: CSS variables holding "R G B" channels, set from data/brand.json by app/layout.tsx (lib/brand.ts).
      colors: {
        cream: "rgb(var(--c-cream) / <alpha-value>)",
        sand: "rgb(var(--c-sand) / <alpha-value>)",
        stone: "rgb(var(--c-stone) / <alpha-value>)",
        ink: { DEFAULT: "rgb(var(--c-ink) / <alpha-value>)", 2: "rgb(var(--c-ink-2) / <alpha-value>)" },
        primary: {
          DEFAULT: "rgb(var(--c-primary) / <alpha-value>)",
          deep: "rgb(var(--c-primary-deep) / <alpha-value>)",
          mid: "rgb(var(--c-primary-mid) / <alpha-value>)",
          tint: "rgb(var(--c-primary-tint) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          pale: "rgb(var(--c-accent-pale) / <alpha-value>)",
          deep: "rgb(var(--c-accent-deep) / <alpha-value>)",
        },
        whatsapp: "#25D366",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "r-sm": "8px",
        "r-md": "16px",
        "r-frame": "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--c-primary-deep) / .06), 0 12px 32px -12px rgb(var(--c-primary-deep) / .18)",
        lift: "0 18px 40px -16px rgb(var(--c-primary-deep) / .28)",
        bar: "0 -8px 24px rgb(var(--c-primary-deep) / .14)",
      },
      maxWidth: { container: "1200px" },
    },
  },
  plugins: [],
};

export default config;
