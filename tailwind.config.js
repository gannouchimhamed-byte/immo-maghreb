/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#1B2B3A", light: "#243647", dark: "#141F29" },
        gold: { DEFAULT: "#D4AF64", light: "#E8CC8A", dark: "#B8922A" },
        cream: { DEFAULT: "#F7F3EE", card: "#FDFAF6", muted: "#9A8878" },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
