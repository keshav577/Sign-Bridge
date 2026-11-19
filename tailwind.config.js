/** @type {import('tailwindcss').Config} */
// The 3-colour SignBridge palette. Rule of thumb: 70% white, 20% grey, 10% black.
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  darkMode: "class", // dark mode is switched by adding the "dark" class to <html>
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#171717", // Black - headings, buttons, navigation
          soft: "#262626", //    a touch lighter, only for cards in dark mode
        },
        fog: "#D1D5DB", //       Grey  - borders, panels, secondary sections
        // White (#FFFFFF) is Tailwind's built-in "white" - page backgrounds and cards
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 0 rgba(23,23,23,0.04), 0 10px 30px -14px rgba(23,23,23,0.22)",
      },
    },
  },
  plugins: [],
};
