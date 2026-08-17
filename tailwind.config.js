/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // cores da marca em canais RGB → aceitam opacidade (bg-cea-blue/10)
        cea: {
          blue: 'rgb(var(--cea-blue-rgb) / <alpha-value>)',
          deep: 'rgb(var(--cea-blue-deep-rgb) / <alpha-value>)',
          red: 'rgb(var(--cea-red-rgb) / <alpha-value>)',
          soft: 'var(--cea-blue-soft)',
        },
        bg: 'var(--bg)',
        card: 'var(--card)',
        ok: 'rgb(var(--ok-rgb) / <alpha-value>)',
        warn: 'rgb(var(--warn-rgb) / <alpha-value>)',
        crit: 'rgb(var(--crit-rgb) / <alpha-value>)',
        line: 'var(--border)',
        ink: 'var(--ink)',
        muted: 'var(--ink-muted)',
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: 'var(--radius)',
      },
      boxShadow: {
        card: 'var(--shadow)',
        pop: '0 8px 24px rgba(16,24,40,.12)',
      },
    },
  },
  plugins: [],
}
