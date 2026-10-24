/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0F7F4',
          100: '#E8F0EC',
          500: '#2D5A46',
          700: '#1B4332',
          800: '#143527',
          900: '#0C2219',
        },
        surface: {
          base: '#FDFDFC',
          muted: '#F7F7F5',
          subdued: '#EFEFEB',
          border: '#E2E2DC',
        },
        charcoal: {
          primary: '#1A1A18',
          secondary: '#5C5C56',
          muted: '#8A8A82',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
