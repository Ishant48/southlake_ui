/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#F83360',
          600: '#e11d48',
          900: '#881337',
        },
        navy: {
          700: '#1b234d',
          800: '#121940',
          900: '#0E1436',
          950: '#090D23',
        }
      }
    },
  },
  plugins: [],
}
