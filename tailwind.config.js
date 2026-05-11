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
      borderRadius: {
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
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
