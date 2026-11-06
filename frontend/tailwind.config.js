/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 500: '#6366f1', 600: '#4f46e5' },
        surface: { 900: '#0f111a', 800: '#161926', 700: '#1f2335' }
      }
    },
  },
  plugins: [],
}