import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAF8",
        ivory: "#F1EEE9",
        ink: "#0A0A0A",
        stone: "#6B6862",
        accent: "#2A2A2A",
        // Evowell green — the logo tile, buttons on hover, ticks and highlights.
        brand: "#16A34A",
        "brand-deep": "#0E7A37",
        // Soft green wash for light cards and chips.
        mint: "#E6F4EA",
        // Bright green pop for dark surfaces (like Rêvera's lime).
        sprout: "#8AF0A0",
        // Deep green-black used for dark sections instead of plain charcoal.
        forest: "#0E1A13",
        "forest-2": "#16251C",
        warn: "#F5B544",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        marquee: "marquee var(--marquee-duration, 40s) linear infinite",
        "marquee-reverse": "marquee-reverse var(--marquee-duration, 40s) linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
