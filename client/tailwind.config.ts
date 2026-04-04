import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';
import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "secondary-fixed": "#ffdad6",
        "tertiary-container": "#ffb219",
        "on-secondary-fixed-variant": "#930010",
        "on-tertiary-fixed-variant": "#614000",
        "on-secondary-container": "#ffd2cd",
        "primary-container": "#00d2ff",
        "on-secondary": "#680008",
        "surface-variant": "#353436",
        "surface-bright": "#39393a",
        "on-primary-container": "#00566a",
        "surface-container": "#201f20",
        "primary-fixed": "#b6ebff",
        "error": "#ffb4ab",
        "on-tertiary-container": "#6b4800",
        "primary-fixed-dim": "#47d6ff",
        "on-background": "#e5e2e3",
        "secondary-fixed-dim": "#ffb3ac",
        "on-surface-variant": "#bbc9cf",
        "surface-dim": "#131314",
        "outline-variant": "#3c494e",
        "secondary": "#ffb3ac",
        "tertiary-fixed": "#ffddaf",
        "inverse-primary": "#00677f",
        "on-surface": "#e5e2e3",
        "on-tertiary": "#432c00",
        "error-container": "#93000a",
        "surface-container-high": "#2a2a2b",
        "on-primary": "#003543",
        "surface": "#131314",
        "surface-container-lowest": "#0e0e0f",
        "tertiary": "#ffd79c",
        "on-error": "#690005",
        "inverse-surface": "#e5e2e3",
        "on-secondary-fixed": "#410003",
        "on-primary-fixed": "#001f28",
        "surface-container-highest": "#353436",
        "surface-container-low": "#1c1b1c",
        "tertiary-fixed-dim": "#ffba43",
        "outline": "#859399",
        "on-error-container": "#ffdad6",
        "on-tertiary-fixed": "#281800",
        "primary": "#a5e7ff",
        "surface-tint": "#47d6ff",
        "inverse-on-surface": "#313031",
        "on-primary-fixed-variant": "#004e60",
        "secondary-container": "#c40019",
        "background": "#131314"
      },
      fontFamily: {
        "headline": ["Space Grotesk", "sans-serif"],
        "body": ["Manrope", "sans-serif"],
        "label": ["Space Grotesk", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0px",
        "lg": "0px",
        "xl": "0px",
        "full": "0px"
      }
    },
  },
  plugins: [
    forms,
    containerQueries
  ],
} satisfies Config
