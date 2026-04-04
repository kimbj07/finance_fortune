/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        'primary-dark': '#4F46E5',
        secondary: '#F59E0B',
        accent: '#8B5CF6',
      }
    },
  },
  plugins: [],
}
