import type { Config } from 'tailwindcss'

/** Design tokens extracted from upway.html :root */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // All theming colors reference CSS variables so light/dark theme switching works
        bg:           'var(--color-bg)',
        surface:      'var(--color-surface)',
        surface2:     'var(--color-surface-2)',
        surface3:     'var(--color-surface-3)',
        border:       'var(--color-border)',
        accent:       'var(--color-accent)',
        'accent-dim': 'var(--color-accent-dim)',
        orange:       'var(--color-orange)',
        'orange-dim': 'var(--color-orange-dim)',
        text:         'var(--color-text)',
        'text-2':     'var(--color-text-2)',
        'text-3':     'var(--color-text-3)',
        danger:       'var(--color-danger)',
        'danger-dim': 'var(--color-danger-dim)',
        'bubble-parent': 'var(--color-bubble-parent)',
        'bubble-ai':     'var(--color-bubble-ai)',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      fontSize: {
        xs:   ['11px', '1.5'],
        sm:   ['12px', '1.5'],
        base: ['14px', '1.5'],
        md:   ['13.5px', '1.5'],
      },
      borderRadius: {
        btn: '10px',
        card: '14px',
      },
      height: {
        'btn-sm': '32px',
        'btn-md': '44px',
        'btn-lg': '52px',
        header:   '60px',
      },
      width: {
        sidebar: '220px',
      },
      boxShadow: {
        accent: '0 0 18px rgba(34,214,122,0.35)',
        'accent-lg': '0 0 24px rgba(34,214,122,0.35)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeSlide: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'none' },
        },
        popIn: {
          from: { transform: 'scale(0)', opacity: '0' },
          to:   { transform: 'scale(1)', opacity: '1' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer:   'shimmer 1.5s infinite',
        fadeSlide: 'fadeSlide 0.3s ease',
        popIn:     'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        spin:      'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
