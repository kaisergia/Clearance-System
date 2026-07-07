import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        "brand-red": "#f44a3b",
        "coral-red": "#f44a3b",

        // Primary
        "primary": "#b51b15",
        "primary-container": "#d9372a",
        "on-primary": "#ffffff",
        "on-primary-container": "#fffbff",
        "primary-fixed": "#ffdad5",
        "primary-fixed-dim": "#ffb4a9",
        "on-primary-fixed": "#410001",
        "on-primary-fixed-variant": "#930004",
        "inverse-primary": "#ffb4a9",

        // Secondary
        "secondary": "#545f73",
        "secondary-container": "#d5e0f8",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#586377",
        "secondary-fixed": "#d8e3fb",
        "secondary-fixed-dim": "#bcc7de",
        "on-secondary-fixed": "#111c2d",
        "on-secondary-fixed-variant": "#3c475a",

        // Tertiary
        "tertiary": "#4d5d73",
        "tertiary-container": "#66768d",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#fdfcff",
        "tertiary-fixed": "#d3e4fe",
        "tertiary-fixed-dim": "#b7c8e1",
        "on-tertiary-fixed": "#0b1c30",
        "on-tertiary-fixed-variant": "#38485d",

        // Surface
        "surface": "#f7f9fb",
        "surface-dim": "#d8dadc",
        "surface-bright": "#f7f9fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "surface-variant": "#e0e3e5",
        "surface-tint": "#b91e17",
        "on-surface": "#191c1e",
        "on-surface-variant": "#5b403c",
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",

        // Background
        "background": "#f7f9fb",
        "on-background": "#191c1e",

        // Error
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        // Outline
        "outline": "#8f706b",
        "outline-variant": "#e4beb8",
      },

      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },

      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        base: "4px",
        gutter: "24px",
        "margin-desktop": "32px",
        "margin-mobile": "16px",
      },

      fontFamily: {
        "display-lg": ["Hanken Grotesk", "sans-serif"],
        "headline-lg": ["Hanken Grotesk", "sans-serif"],
        "headline-lg-mobile": ["Hanken Grotesk", "sans-serif"],
        "title-md": ["Hanken Grotesk", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "label-md": ["Geist", "sans-serif"],
      },

      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};

export default config;
