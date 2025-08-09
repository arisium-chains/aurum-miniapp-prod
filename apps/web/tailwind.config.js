/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1C1917',
        'bg-secondary': '#292524',
        'bg-tertiary': '#44403C',
        accent: '#F59E0B',
        primary: '#DC2626',
        'text-primary': '#FAFAF9',
        'text-secondary': '#A8A29E',
        'text-muted': '#78716C',
        border: '#44403C',
        'border-light': '#57534E',
        'card-muted': '#44403C',
        'accent-foreground': '#1C1917',
        'primary-foreground': '#FAFAF9',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.6)' }
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'aurum': '0 10px 25px -5px rgba(220, 38, 38, 0.1), 0 10px 10px -5px rgba(220, 38, 38, 0.04)',
        'gold': '0 10px 25px -5px rgba(245, 158, 11, 0.1), 0 10px 10px -5px rgba(245, 158, 11, 0.04)',
      }
    },
  },
  plugins: [],
}