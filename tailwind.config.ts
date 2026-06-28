import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/web/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Period-performance colors for the trend chart (G6 / TS).
        up: '#16a34a',
        down: '#dc2626',
      },
    },
  },
  plugins: [],
};

export default config;
