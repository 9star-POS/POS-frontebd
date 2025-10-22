/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "#fff",
        black: "#000",
        primary: "#FF6F00", // Custom primary color
        prilight: "#FFD2B0", // Custom primary color
        secondary: "#FFF1E6", // Custom secondary color
        accent: "#FBBF24", // Custom accent color
        active: "#00FF00",
        expired: "#FF0000",
        pending: "#FFFF00",
        // Add more custom colors as needed
      },
      fontFamily: {
        futura: ["Futura", "sans-serif"],
        raleway: ["Raleway", "sans-serif"],
      },
    },
  },
  plugins: [],
};
