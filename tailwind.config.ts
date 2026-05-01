import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#FAF8F5",
          100: "#F5EFE6",
          200: "#EDE0CE",
          300: "#DFC8AD",
          400: "#CEAB87",
          500: "#BC8E62",
          600: "#A47248",
          700: "#875A34",
          800: "#6B4427",
          900: "#4F2F18",
        },
        gold: {
          300: "#E4C97A",
          400: "#D4A84B",
          500: "#C9A84C",
          600: "#A8873A",
          700: "#8A6B2A",
        },
        terracotta: {
          400: "#D4775C",
          500: "#C4614A",
          600: "#A84D39",
          700: "#8B3B2B",
        },
        charcoal: {
          800: "#2A2520",
          900: "#1A1713",
          950: "#0D0B09",
        },
        olive: {
          400: "#8A9B6E",
          500: "#6B7C5C",
          600: "#566349",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "88": "22rem",
        "112": "28rem",
        "128": "32rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(26,23,19,0.08), 0 4px 16px rgba(26,23,19,0.06)",
        "card-hover": "0 4px 12px rgba(26,23,19,0.12), 0 16px 40px rgba(26,23,19,0.10)",
        luxury: "0 0 0 1px rgba(201,168,76,0.3), 0 8px 32px rgba(26,23,19,0.15)",
        "inner-sand": "inset 0 1px 3px rgba(188,142,98,0.15)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-right": "slideRight 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
        shimmer: "shimmer 1.5s infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backgroundImage: {
        "sand-texture": "url('/textures/sand.png')",
        "hero-gradient": "linear-gradient(160deg, #1A1713 0%, #2A2520 40%, #3D3028 100%)",
        "card-shimmer":
          "linear-gradient(90deg, transparent 25%, rgba(201,168,76,0.08) 50%, transparent 75%)",
        "geo-pattern": "url('/patterns/geometric.svg')",
      },
      gridTemplateColumns: {
        "listing-grid": "repeat(auto-fill, minmax(320px, 1fr))",
        "dashboard-2": "280px 1fr",
        "dashboard-3": "280px 1fr 340px",
      },
    },
  },
  plugins: [],
};

export default config;
