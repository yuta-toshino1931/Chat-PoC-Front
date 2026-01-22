/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', "sans-serif"],
      },
      colors: {
        primary: "#67BACA",
        accent: "#FE0000",
        sub1: "#B3DBC0",
        sub2: "#FDF6F6",
        background: "#FFFFFF",
        text: "#333333",
        border: "#E0E0E0",
        success: "#4CAF50",
        warning: "#FFA726",
        info: "#2196F3",
        error: "#D32F2F",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
