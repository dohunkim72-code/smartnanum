/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "secondary-fixed": "#eaddff",
        "on-tertiary": "#ffffff",
        "background": "#f8f9ff",
        "surface-dim": "#d0dbed",
        "on-secondary-container": "#fffbff",
        "on-primary-fixed-variant": "#3323cc",
        "surface-variant": "#d9e3f6",
        "surface-container-highest": "#d9e3f6",
        "surface-container-low": "#eff4ff",
        "on-error": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "secondary-fixed-dim": "#d2bbff",
        "error-container": "#ffdad6",
        "primary-fixed-dim": "#c3c0ff",
        "primary-container": "#4f46e5",
        "inverse-primary": "#c3c0ff",
        "on-tertiary-container": "#dbdae5",
        "inverse-surface": "#27313f",
        "on-surface-variant": "#464555",
        "on-tertiary-fixed-variant": "#46464f",
        "on-surface": "#121c2a",
        "inverse-on-surface": "#eaf1ff",
        "on-secondary-fixed": "#25005a",
        "surface-bright": "#f8f9ff",
        "secondary-container": "#8a4cfc",
        "on-error-container": "#93000a",
        "secondary": "#712ae2",
        "surface-container": "#e6eeff",
        "on-primary": "#ffffff",
        "tertiary-container": "#5f5f69",
        "on-primary-fixed": "#0f0069",
        "primary-fixed": "#e2dfff",
        "on-background": "#121c2a",
        "outline": "#777587",
        "tertiary": "#474751",
        "error": "#ba1a1a",
        "surface-container-high": "#dee9fc",
        "surface": "#f8f9ff",
        "primary": "#3713ec",
        "background-light": "#f6f6f8",
        "background-dark": "#131022",
        "on-tertiary-fixed": "#1a1b23",

        "on-secondary-fixed-variant": "#5a00c6",
        "outline-variant": "#c7c4d8",
        "surface-tint": "#4d44e3",
        "on-primary-container": "#dad7ff",
        "tertiary-fixed": "#e3e1ed",
        "tertiary-fixed-dim": "#c7c5d1",
        "on-secondary": "#ffffff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "stack-sm": "8px",
        "stack-lg": "24px",
        "container-margin": "20px",
        "gutter": "16px",
        "section-gap": "40px",
        "stack-md": "16px"
      },
      fontFamily: {
        "display": ["Public Sans", "sans-serif"],
        "manrope": ["Manrope", "sans-serif"],

        "label-sm": ["Manrope"],
        "body-md": ["Manrope"],
        "headline-xl": ["Manrope"],
        "headline-md": ["Manrope"],
        "label-md": ["Manrope"],
        "body-lg": ["Manrope"],
        "headline-lg": ["Manrope"]
      },
      fontSize: {
        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "headline-xl": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "headline-lg": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700" }]
      }
    },
  },
  plugins: [],
}
