/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily:{
        meri:"Merriweather",
      }
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["light", "dark"], // Bổ sung 2 theme chính
  },
}

