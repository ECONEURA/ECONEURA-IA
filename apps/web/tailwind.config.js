/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mediterranean Theme Colors
        mediterranean: {
          50: '#f0f9ff',   // Light azure
          100: '#e0f2fe',  // Soft sky blue
          200: '#bae6fd',  // Mediterranean blue
          300: '#7dd3fc',  // Azure
          400: '#38bdf8',  // Ocean blue
          500: '#0284c7',  // Deep sea blue
          600: '#0369a1',  // Navy
          700: '#075985',  // Deep navy
          800: '#0c4a6e',  // Midnight blue
          900: '#082f49',  // Dark navy
        },
        primary: {
          50: '#f0f9ff',   // Light azure
          100: '#e0f2fe',  // Soft sky blue
          200: '#bae6fd',  // Mediterranean blue
          300: '#7dd3fc',  // Azure
          400: '#38bdf8',  // Ocean blue
          500: '#0284c7',  // Deep sea blue
          600: '#0369a1',  // Navy
          700: '#075985',  // Deep navy
          800: '#0c4a6e',  // Midnight blue
          900: '#082f49',  // Dark navy
        },
        // Mediterranean accent colors
        terracotta: {
          50: '#fdf8f6',   // Light terracotta
          100: '#f2e8e5',  // Soft terracotta
          200: '#eaddd7',  // Warm beige
          300: '#e0958a',  // Mediterranean clay
          400: '#d97666',  // Terracotta
          500: '#cd5f47',  // Deep terracotta
          600: '#b8472f',  // Dark terracotta
          700: '#a73d28',  // Rich terracotta
          800: '#8a3621',  // Deep clay
          900: '#6f2d1c',  // Dark clay
        },
        olive: {
          50: '#f8faf0',   // Light olive
          100: '#eef2db',  // Soft olive
          200: '#d9e7b7',  // Light olive green
          300: '#bdd489',  // Olive
          400: '#9fc131',  // Mediterranean olive
          500: '#7c9a2e',  // Deep olive
          600: '#5d7322',  // Dark olive
          700: '#45551a',  // Rich olive
          800: '#334012',  // Deep olive green
          900: '#25300e',  // Dark olive
        },
        sand: {
          50: '#fdfcf9',   // Light sand
          100: '#f7f3ed',  // Soft sand
          200: '#ede4d3',  // Warm sand
          300: '#e1d7c6',  // Mediterranean sand
          400: '#d4c5b0',  // Golden sand
          500: '#c5b299',  // Deep sand
          600: '#b09d7f',  // Rich sand
          700: '#9a8569',  // Dark sand
          800: '#7d6b52',  // Deep beige
          900: '#5f5040',  // Dark beige
        },
        coral: {
          50: '#fef7f0',   // Light coral
          100: '#feecdc',  // Soft coral
          200: '#fcd9bd',  // Warm coral
          300: '#fdba8c',  // Mediterranean coral
          400: '#ff8a4c',  // Bright coral
          500: '#ff5722',  // Deep coral
          600: '#e04100',  // Rich coral
          700: '#c13100',  // Dark coral
          800: '#9a2700',  // Deep orange
          900: '#7c1d00',  // Dark orange
        },
        success: {
          50: '#f0fdf4',   // Light success
          100: '#dcfce7',  // Soft success
          200: '#bbf7d0',  // Light green
          300: '#86efac',  // Success green
          400: '#4ade80',  // Bright success
          500: '#22c55e',  // Success
          600: '#16a34a',  // Deep success
          700: '#15803d',  // Rich success
          800: '#166534',  // Dark success
          900: '#14532d',  // Deep green
        },
        warning: {
          50: '#fffbeb',   // Light warning
          100: '#fef3c7',  // Soft warning
          200: '#fde68a',  // Light amber
          300: '#fcd34d',  // Warning amber
          400: '#fbbf24',  // Bright warning
          500: '#f59e0b',  // Warning
          600: '#d97706',  // Deep warning
          700: '#b45309',  // Rich warning
          800: '#92400e',  // Dark warning
          900: '#78350f',  // Deep amber
        },
        danger: {
          50: '#fef2f2',   // Light danger
          100: '#fee2e2',  // Soft danger
          200: '#fecaca',  // Light red
          300: '#fca5a5',  // Danger red
          400: '#f87171',  // Bright danger
          500: '#ef4444',  // Danger
          600: '#dc2626',  // Deep danger
          700: '#b91c1c',  // Rich danger
          800: '#991b1b',  // Dark danger
          900: '#7f1d1d',  // Deep red
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
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5px)' },
          '50%': { transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-mediterranean': 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #bae6fd 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #ff5722 0%, #ff8a4c 50%, #fcd9bd 100%)',
        'gradient-olive': 'linear-gradient(135deg, #7c9a2e 0%, #9fc131 50%, #d9e7b7 100%)',
        'gradient-sand': 'linear-gradient(135deg, #c5b299 0%, #d4c5b0 50%, #f7f3ed 100%)',
      },
      boxShadow: {
        'mediterranean': '0 4px 20px -2px rgba(2, 132, 199, 0.15)',
        'soft': '0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'warm': '0 4px 20px -2px rgba(255, 87, 34, 0.15)',
        'glow': '0 0 20px rgba(56, 189, 248, 0.3)',
      },
    },
  },
  plugins: [],
};