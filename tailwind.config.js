/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mmt: {
          red: '#e41f2a',
          darkRed: '#c91b25',
          blue: '#2196f3',
          black: '#000000',
          gray: '#4a4a4a',
          bg: '#f2f2f2',
        },
        seat: {
          beige: '#E8DCCA',
          beigeDark: '#C7B299',
          selected: '#1ec25d',
          booked: '#d1d5db',
        },
        ladakh: {
          blue: '#0066CC',
          sky: '#4DA8DA',
          maroon: '#8B2131',
          gold: '#FFD700',
        }
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px 0 rgba(0,0,0,0.1)',
        'floating': '0 4px 16px 0 rgba(0,0,0,0.2)',
      }
    },
  },
  plugins: [],
}
