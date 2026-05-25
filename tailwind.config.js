/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card': 'var(--bg-card)',
        'neon-cyan': 'var(--neon-cyan)',
        'neon-purple': 'var(--neon-purple)',
        'neon-green': 'var(--neon-green)',
        'neon-yellow': 'var(--neon-yellow)',
        'neon-red': 'var(--neon-red)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        glow: 'var(--border-glow)',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 22px rgba(0, 245, 255, 0.28)',
      },
    },
  },
  plugins: [],
}
