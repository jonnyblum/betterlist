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
        background: "#FAF9F7",
        foreground: "#1a1a1a",
        sage: {
          DEFAULT: "#87A878",
          50: "#f0f5ee",
          100: "#ddebd8",
          200: "#bdd8b4",
          300: "#9DC28E",
          400: "#87A878",
          500: "#6d9061",
          600: "#587549",
          700: "#435b38",
          800: "#2e4027",
          900: "#1a2416",
        },
        sky: {
          DEFAULT: "#7DB9D4",
          50: "#eef6fb",
          100: "#d5eaf5",
          200: "#b0d5eb",
          300: "#7DB9D4",
          400: "#5ba3c4",
          500: "#3d8db3",
          600: "#2d7191",
          700: "#225570",
          800: "#173a4e",
          900: "#0d1f2c",
        },
        peach: {
          DEFAULT: "#E8A87C",
          50: "#fdf5ee",
          100: "#fae6d0",
          200: "#f4cba1",
          300: "#eeae74",
          400: "#E8A87C",
          500: "#d4834a",
          600: "#b86635",
          700: "#8f4d27",
          800: "#66351a",
          900: "#3d1e0d",
        },
        card: "#FFFFFF",
        muted: "#6b7280",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pop": "pop 0.2s ease-out",
        "pulse-once": "pulseOnce 0.4s ease-out",
        "kit-appear": "kitAppear 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pop: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "70%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseOnce: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        kitAppear: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
