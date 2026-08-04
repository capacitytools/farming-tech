import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#EAF5EC',
          100: '#CFE9D4',
          200: '#9FD3A9',
          300: '#6FBC7E',
          400: '#3FA653',
          500: '#1F7A34',
          600: '#166028', // primary brand green
          700: '#124D20',
          800: '#0F3F1A',
          900: '#0B1F14', // deep forest / dark bg
        },
        earth: {
          100: '#F5EBDD',
          200: '#E8D5B5',
          300: '#D6B786',
          400: '#C2985A',
          500: '#A87B3F', // clay/earth accent
          600: '#8B6230',
        },
        gold: {
          400: '#F2C14E',
          500: '#E0A82E',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(11, 31, 20, 0.25)',
        'glass-sm': '0 4px 16px 0 rgba(11, 31, 20, 0.15)',
        'app-nav': '0 -4px 20px 0 rgba(11, 31, 20, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'scan-line': 'scanline 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scanline: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
