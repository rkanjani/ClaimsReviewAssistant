/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Joyful Health inspired palette
        background: "#fdfbf7",
        foreground: "#1a1a1a",
        surface: "#f5f0e8",
        primary: {
          DEFAULT: "#22c55e",
          foreground: "#ffffff",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        secondary: {
          DEFAULT: "#fef9f5",
          foreground: "#1a1a1a",
          50: "#ffffff",
          100: "#fef9f5",
          200: "#fcf3eb",
          300: "#f5e1cf",
          400: "#e8c4a0",
          500: "#d4a574",
          600: "#c4915e",
        },
        muted: {
          DEFAULT: "#f5f0e8",
          foreground: "#6b6b6b",
        },
        accent: {
          DEFAULT: "#f5f0e8",
          foreground: "#1a1a1a",
        },
        // Status colors
        status: {
          denied: "#ef4444",
          rejected: "#f97316",
          pending: "#e8c4a0",
          underpaid: "#3b82f6",
          resolved: "#22c55e",
          appealed: "#8b5cf6",
        },
        border: "#e5e0d8",
        input: "#e5e0d8",
        ring: "#e8c4a0",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-in",
        "fade-in": "fade-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s infinite",
        "shimmer": "shimmer 1.5s infinite ease-in-out",
      },
    },
  },
  plugins: [],
}
