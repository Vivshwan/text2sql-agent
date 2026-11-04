/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#818cf8', // Lighter Indigo for glowing effects
          600: '#6366f1',
        },
        surface: {
          900: '#0a0a0f', // Deeper dark background
          800: '#12121c', // Card background
          700: '#1e1e2d', // Hover states
        }
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(99, 102, 241, 0.4)',
      }
    },
  },
  plugins: [],
}