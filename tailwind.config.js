/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#031635', // Deep Navy
          container: '#1a2b4b',
          'on-container': '#8293b8',
          fixed: '#d8e2ff',
          'fixed-dim': '#b6c6ef',
          'on-fixed': '#081b3a',
          'on-fixed-variant': '#364768',
        },
        secondary: {
          DEFAULT: '#006c49', // Emerald
          container: '#6cf8bb',
          'on-container': '#00714d',
          fixed: '#6ffbbe',
          'fixed-dim': '#4edea3',
          'on-fixed': '#002113',
          'on-fixed-variant': '#005236',
        },
        tertiary: {
          DEFAULT: '#735c00',
          container: '#cba72f',
          'on-container': '#4e3d00',
          fixed: '#ffe088',
          'fixed-dim': '#e9c349',
          'on-fixed': '#241a00',
          'on-fixed-variant': '#574500',
        },
        error: {
          DEFAULT: '#ba1a1a', // Red
          container: '#ffdad6',
          'on-container': '#93000a',
        },
        background: '#f7f9fb',
        'on-background': '#191c1e',
        surface: {
          DEFAULT: '#ffffff',
          dim: '#d8dadc',
          bright: '#f7f9fb',
          'container-lowest': '#ffffff',
          'container-low': '#f2f4f6',
          container: '#eceef0',
          'container-high': '#e6e8ea',
          'container-highest': '#e0e3e5',
          variant: '#e0e3e5',
        },
        'on-surface': '#191c1e',
        'on-surface-variant': '#44474e',
        outline: '#75777f',
        'outline-variant': '#c5c6cf',
      },
      borderRadius: {
        'sm': '0.25rem', // 4px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.75rem', // 12px
        'lg': '1rem', // 16px
        'xl': '1.5rem', // 24px
      },
      spacing: {
        'margin-mobile': '20px',
        'margin-desktop': '40px',
        'gutter': '16px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '24px',
        'section-gap': '40px',
      },
      fontFamily: {
        arabic: ['IBM Plex Sans Arabic', 'sans-serif'],
        sans: ['IBM Plex Sans Arabic', 'IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
