/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gem: {
          50: '#f0f7fb',
          100: '#dcebf5',
          200: '#bedeef',
          500: '#0284c7',
          600: '#0369a1',
          700: '#0b4a72',
          800: '#083756',
          900: '#052338',
        },
      },
    },
  },
  plugins: [],
};
