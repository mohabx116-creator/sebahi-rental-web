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
          DEFAULT: '#111b10', // Dark Olive background / base primary
          container: '#172414',
          'on-container': '#e7dcc0',
          fixed: '#f6f1df',
          'fixed-dim': '#e7dcc0',
          'on-fixed': '#08120b',
          'on-fixed-variant': '#172414',
        },
        secondary: {
          DEFAULT: '#0f4f3a', // Emerald Accent
          container: '#0b6b4f',
          'on-container': '#f6f1df',
          fixed: '#0b6b4f',
          'fixed-dim': '#0f4f3a',
          'on-fixed': '#111b10',
          'on-fixed-variant': '#0f4f3a',
        },
        tertiary: {
          DEFAULT: '#c49a3a', // Warm Gold CTA Accent
          container: '#d6b15f',
          'on-container': '#111b10',
          fixed: '#f6f1df',
          'fixed-dim': '#e7dcc0',
          'on-fixed': '#111b10',
          'on-fixed-variant': '#c49a3a',
        },
        error: {
          DEFAULT: '#ba1a1a', // Red
          container: '#ffdad6',
          'on-container': '#93000a',
        },
        background: '#111b10',
        'on-background': '#f6f1df',
        surface: {
          DEFAULT: '#172414',
          dim: '#08120b',
          bright: '#172414',
          'container-lowest': '#08120b',
          'container-low': '#111b10',
          container: '#172414',
          'container-high': '#172414',
          'container-highest': '#172414',
          variant: '#0f4f3a',
        },
        'on-surface': '#f6f1df',
        'on-surface-variant': '#e7dcc0',
        outline: 'rgba(255, 255, 255, 0.14)',
        'outline-variant': 'rgba(255, 255, 255, 0.08)',
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
