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
          50: '#FDFBFA',
          100: '#F7EBE8',
          200: '#F2D4CC',
          300: '#E6BCB2',
          400: '#D99B8C',
          500: '#C86A50',
          600: '#B0543B',
          700: '#94412C',
          800: '#7B3220',
          900: '#5F2113',
        }
      }
    },
  },
  plugins: [],
}
