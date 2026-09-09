import type { Config } from "tailwindcss";

// XAS brand tokens, derived from the provided badge/mockups:
// deep navy background, white surfaces/text, gold accents for premium/CTA.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        xas: {
          navy: "#0B1E3D",       // primary background / header
          "navy-light": "#12274F",
          "navy-dark": "#071429",
          gold: "#D4AF37",       // primary accent — CTAs, badges, stars
          "gold-light": "#E9CE6B",
          "gold-dark": "#A9861F",
          ink: "#0F172A",        // body text on light surfaces
          paper: "#F8F9FB",      // light surface background
        },
        status: {
          pending: "#F59E0B",
          approved: "#16A34A",
          rejected: "#DC2626",
          premium: "#D4AF37",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        xas: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
