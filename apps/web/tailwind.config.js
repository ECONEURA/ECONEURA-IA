/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/web/src/**/*.{js,ts,jsx,tsx}',
    './packages/**/*.{js,ts,jsx,tsx}', // si tienes UI compartida
  ],
  theme: {
    extend: {
      colors: {
        mediterranean: {
          50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
          400: '#38bdf8', 500: '#0284c7', 600: '#0369a1', 700: '#075985',
          800: '#0c4a6e', 900: '#082f49',
        },
        terracotta: {
          50: '#fdf8f6', 100: '#f2e8e5', 200: '#eaddd7', 300: '#e0958a',
          400: '#d97666', 500: '#cd5f47', 600: '#b8472f', 700: '#a73d28',
          800: '#8a3621', 900: '#6f2d1c',
        },
        olive: {
          50: '#f8faf0', 100: '#eef2db', 200: '#d9e7b7', 300: '#bdd489',
          400: '#9fc131', 500: '#7c9a2e', 600: '#5d7322', 700: '#45551a',
          800: '#334012', 900: '#25300e',
        },
        sand: {
          50: '#fdfcf9', 100: '#f7f3ed', 200: '#ede4d3', 300: '#e1d7c6',
          400: '#d4c5b0', 500: '#c5b299', 600: '#b09d7f', 700: '#9a8569',
          800: '#7d6b52', 900: '#5f5040',
        },
        coral: {
          50: '#fef7f0', 100: '#feecdc', 200: '#fcd9bd', 300: '#fdba8c',
          400: '#ff8a4c', 500: '#ff5722', 600: '#e04100', 700: '#c13100',
          800: '#9a2700', 900: '#7c1d00',
        },
        success: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d',
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f',
        },
        danger: {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
          400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
          800: '#991b1b', 900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideLeft: { '0%': { transform: 'translateX(10px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideRight:{ '0%': { transform: 'translateX(-10px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        wave:     { '0%,100%': { transform: 'rotate(0deg)' }, '50%': { transform: 'rotate(3deg)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        bounceGentle:{ '0%,100%': { transform:'translateY(-5px)' }, '50%': { transform:'translateY(0)' } },
        float:    { '0%,100%': { transform:'translateY(0px)' }, '50%': { transform:'translateY(-10px)' } },
      },
      backgroundImage: {
        'gradient-mediterranean': 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #bae6fd 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #ff5722 0%, #ff8a4c 50%, #fcd9bd 100%)',
        'gradient-olive': 'linear-gradient(135deg, #7c9a2e 0%, #9fc131 50%, #d9e7b7 100%)',
        'gradient-sand': 'linear-gradient(135deg, #c5b299 0%, #d4c5b0 50%, #f7f3ed 100%)',
      },
      boxShadow: {
        mediterranean: '0 4px 20px -2px rgba(2, 132, 199, 0.15)',
        soft: '0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        warm: '0 4px 20px -2px rgba(255, 87, 34, 0.15)',
        glow: '0 0 20px rgba(56, 189, 248, 0.3)',
      },
    },
  },
  plugins: [],
}
