import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f4e8cf",
        terracotta: "#cb6b3d",
        coffee: "#51352b",
        palm: "#2f6758",
        ocean: "#0f6b78"
      },
      boxShadow: {
        card: "0 30px 80px rgba(51, 35, 28, 0.16)"
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -10px, 0)" }
        }
      },
      animation: {
        drift: "drift 8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
