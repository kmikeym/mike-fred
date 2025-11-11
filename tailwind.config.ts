import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Federal Reserve / Official color palette
        fed: {
          navy: "#002147",
          teal: "#008080",
          gold: "#D4AF37",
          red: "#DC143C",
        },
        // Quarterly Systems purple theme
        primary: "#667eea",
        accent: "#764ba2",
      },
    },
  },
  plugins: [],
};

export default config;
