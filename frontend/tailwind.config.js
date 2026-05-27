/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#0f0f0f',
        'surface-secondary': '#141414',
        border: '#1f1f1f',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0a0',
        'accent-red': '#c1121f',
        'route-blue': '#2f8fed',
        'route-blue-soft': '#7cc7f8',
        'traffic-low': '#00ff88',
        'traffic-medium': '#ffcc00',
        'traffic-heavy': '#ff3b3b',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 2px 12px rgba(0, 0, 0, 0.4)',
        panel: '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
