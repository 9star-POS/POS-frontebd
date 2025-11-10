/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "#fff",
        black: "#000",
        primary: "#2b2f33", // Custom primary color
        prilight: "#9da4ab", // Custom primary color
        secondary: "#b0c3d6", // Custom secondary color
        accent: "#596471", // Custom accent color
        active: "#2b2f33",
        expired: "#41474d",
        pending: "#596471",
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
