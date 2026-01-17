/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  darkMode: ["class", '[data-theme="dark"]'],


  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Inter", "Arial"],
      },
      boxShadow: {
        soft: "0 18px 60px rgba(0,0,0,.18)",
        glow: "0 0 0 1px rgba(255,255,255,.10), 0 18px 80px rgba(0,0,0,.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
