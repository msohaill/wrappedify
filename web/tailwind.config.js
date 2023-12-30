import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        ...defaultTheme.fontFamily,
        sans: ['CircularStd', ...defaultTheme.fontFamily.sans],
        serif: ['Libre Baskerville', ...defaultTheme.fontFamily.serif],
      }
    },
  },
  plugins: [],
}
