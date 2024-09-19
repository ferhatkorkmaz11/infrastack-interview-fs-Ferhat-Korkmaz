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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        success: "var(--success)",
        error: "var(--error)",
        "card-bg": "var(--card-bg)",
        "navbar-bg": "var(--navbar-bg)",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern:
        /bg-(primary|secondary|accent|success|error|card-bg|navbar-bg)\/[0-9]+/,
    },
    {
      pattern:
        /border-(primary|secondary|accent|success|error|card-bg|navbar-bg)\/[0-9]+/,
    },
  ],
};

export default config;
