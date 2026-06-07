/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        brand: "#0f766e",
        amberline: "#d97706"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 32, 42, 0.11)"
      }
    }
  },
  plugins: []
};
