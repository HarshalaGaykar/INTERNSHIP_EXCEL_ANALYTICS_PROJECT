// File: C:\Users\Harshala Gaykar\Desktop\excel-analytics\frontend\tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#1E40AF',
        'custom-purple': '#6B21A8',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: 0 },
          'to': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};