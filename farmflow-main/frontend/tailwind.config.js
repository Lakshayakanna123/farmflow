/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2E7D32",
        secondary: "#A5D6A7",
        background: "#FFF8E7",
        card: "#FFFFFF",
        text: "#3E2723",
        textSecondary: "#757575",
        success: "#43A047",
        warning: "#F9A825",
        danger: "#D84315"
      }
    },
  },
  plugins: [],
}
