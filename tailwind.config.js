/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        heading: ['Inter', 'sans-serif'],
      },
      colors: {
        zinc: {
          500: '#a1a1aa', // G-01: WCAG AA 6.91:1 vs zinc-900 #18181b
          600: '#8c8c97', // G-01: WCAG AA 5.33:1 vs zinc-900 #18181b

          750: '#2e2e33',
          800: '#27272a',
          850: '#202025',
          900: '#18181b',
          950: '#09090b',
        },
        black: '#050505',
        brand: {
          primary: '#bef264',
          primaryHover: '#a3e635',
          secondary: '#d9f99d',
          surface: '#121212',
          highlight: '#27272a',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          accent: '#06b6d4',
          lime: '#bef264'
        }
      },
      // --- Semantic z-index scale ---
      // Higher values to match project's existing layering (60-100-200)
      zIndex: {
        base: '0',
        raised: '10',      // Elevated cards, sticky headers
        sticky: '20',
        dropdown: '50',    // Tooltips, small dropdowns
        modal: '100',      // Main modals, sheets, full-screen overlays
        toast: '200',      // Notifications — always above modals
        overlay: '150',    // Secondary overlays on top of modals
        debug: '9999',     // Critical errors / Dev tools
      },
      borderRadius: {
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
        // Semantic aliases
        'control': '8px',   // Inputs, buttons, chips
        'card': '16px',     // Cards, panels
        'sheet': '24px',    // Bottom sheets, modals
      },
      // --- Semantic font size scale ---
      // Eliminates text-[9px]/text-[10px]/text-[11px] ad-hoc usage.
      fontSize: {
        'caption-xs': ['0.625rem', { lineHeight: '1rem' }],   // 10px — labels, badges
        'caption':    ['0.6875rem', { lineHeight: '1rem' }],  // 11px — data labels
        'label':      ['0.75rem', { lineHeight: '1rem' }],    // 12px — secondary labels
        'body-sm':    ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
        'body':       ['0.875rem', { lineHeight: '1.375rem' }], // 14px — primary body
        'body-lg':    ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'h3':         ['1rem', { lineHeight: '1.375rem', fontWeight: '700' }],
        'h2':         ['1.25rem', { lineHeight: '1.5rem', fontWeight: '700' }],
        'h1':         ['1.5rem', { lineHeight: '1.75rem', fontWeight: '800' }],
      },
      // --- Semantic spacing tokens ---
      spacing: {
        'card-sm': '0.75rem',   // 12px — compact card padding
        'card':    '1rem',      // 16px — standard card padding
        'card-lg': '1.5rem',    // 24px — spacious card padding
        'section': '1.5rem',    // 24px — between sections
        'page':    '1.25rem',   // 20px — horizontal page inset (matches px-5)
      },
      boxShadow: {
        'inner/light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        'card-hover': '0 4px 16px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(190, 242, 100, 0.15)',
        'nav': '0 -4px 24px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [],
}
