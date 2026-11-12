/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10233f',
        navy: '#17345f',
        gov: '#1d6b52',
        canvas: '#f4f7fb',
      },
      boxShadow: {
        soft: '0 12px 36px rgba(16, 35, 63, 0.07)',
      },
    },
  },
  plugins: [],
};
