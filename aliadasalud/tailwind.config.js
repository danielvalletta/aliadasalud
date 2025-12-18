/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'orange-intense': '#FF781D',
        'orange-soft': '#F2AC58',
        'aqua': '#75FADA',
        'green-light': '#A2F9A2',
        'blue-deep': '#214059',
        'blue-light': '#609AB6',
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #FF781D 0%, #F2AC58 100%)',
        'gradient-aqua': 'linear-gradient(135deg, #75FADA 0%, #A2F9E3 100%)',
        'gradient-blue': 'linear-gradient(135deg, #214059 0%, #609AB6 100%)',
      },
    },
  },
  plugins: [],
}
