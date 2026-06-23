import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          dark:   '#0d47a1',
          mid:    '#1565c0',
          light:  '#1e88e5',
          pale:   '#e3f2fd',
          teal:   '#4fc3f7',
        },
      },
      height: {
        dvh: '100dvh',
      },
    },
  },
  plugins: [],
};

export default config;
