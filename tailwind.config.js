/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        "obsidian-purple": "#E4A1FF",
      }
    },
  },
  plugins: [require("@tailwindcss/typography")],
}

