/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sage: '#ccd5ae',
        mint: '#e9edc9',
        ivory: '#fefae0',
        linen: '#faedcd',
        clay: '#d4a373',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 22px 70px rgba(212, 163, 115, 0.22)',
        panel: '0 12px 34px rgba(212, 163, 115, 0.2)',
      },
    },
  },
  plugins: [],
};
