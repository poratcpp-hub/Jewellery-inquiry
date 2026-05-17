import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#b8934a',
          light: '#d4a96a',
          dark: '#8a6a2e',
          50: '#fdf8ee',
          100: '#f9edcf',
          200: '#f2d89a',
          300: '#e8be5e',
          400: '#d4a96a',
          500: '#b8934a',
          600: '#9a7535',
          700: '#7a5a26',
          800: '#5c4120',
          900: '#3d2b14',
        },
        champagne: {
          DEFAULT: '#f5efe0',
          50: '#faf8f5',
          100: '#f5efe0',
          200: '#ede0c4',
          300: '#e0cda2',
          400: '#cfb87a',
          500: '#b8994e',
        },
        ivory: '#faf8f5',
        'dark-brown': '#2c1810',
        'warm-brown': '#4a3728',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Arial Hebrew', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        luxury: '0 2px 20px rgba(184, 147, 74, 0.08)',
        card: '0 1px 8px rgba(26, 18, 9, 0.06)',
        'card-hover': '0 4px 20px rgba(26, 18, 9, 0.1)',
      },
    },
  },
  plugins: [],
}

export default config
