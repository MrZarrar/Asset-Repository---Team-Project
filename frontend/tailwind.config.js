/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#85d7ff',
          DEFAULT: '#1fb6ff',
          dark: '#009eeb',
        }
      },
      spacing: {
        '128': '32rem',
      }
    },
  },
  plugins: [],
}