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
        heading: ['Barlow Condensed', 'Inter', 'sans-serif'],
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
        DEFAULT: '2px',
        'md': '4px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        '3xl': '0px',
        'full': '9999px',
      },
      boxShadow: {
        'tech': '2px 2px 0px 0px rgba(190, 242, 100, 1)',
        'glow': '0 0 15px -5px rgba(190, 242, 100, 0.3)',
        'inner/light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        'card-hover': '0 4px 16px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(190, 242, 100, 0.15)',
        'nav': '0 -4px 24px -4px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glitch': 'glitch 1s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glitch: {
          '2%, 64%': { transform: 'translate(2px,0) skew(0deg)' },
          '4%, 60%': { transform: 'translate(-2px,0) skew(0deg)' },
          '62%': { transform: 'translate(0,0) skew(5deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [],
}
