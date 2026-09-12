import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08070a",
          900: "#0d0b0e",
          800: "#141216",
          700: "#1c191e",
          600: "#282329",
          400: "#9a93a0"
        },
        gold: {
          200: "#f6e2a8",
          300: "#eecb6e",
          400: "#e3b13c",
          500: "#cf9424",
          600: "#a8721a",
          700: "#7a5314"
        },
        blood: {
          400: "#e0523f",
          500: "#c22a2a",
          600: "#961f1f",
          700: "#6e1717"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"]
      },
      backgroundImage: {
        "gold-liquid":
          "linear-gradient(115deg, #7a5314 0%, #e3b13c 18%, #f6e2a8 32%, #cf9424 48%, #7a5314 62%, #eecb6e 78%, #a8721a 100%)",
        "gold-liquid-soft":
          "linear-gradient(135deg, #cf9424 0%, #f6e2a8 50%, #a8721a 100%)"
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(227,177,60,0.25), 0 8px 30px -8px rgba(227,177,60,0.35)",
        blood: "0 0 0 1px rgba(194,42,42,0.35), 0 8px 24px -8px rgba(194,42,42,0.45)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" }
        }
      },
      animation: {
        shimmer: "shimmer 6s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
