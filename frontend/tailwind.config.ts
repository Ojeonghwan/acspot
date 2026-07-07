import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        acspot: {
          alert: "#ff405a",
          blue: "#0797c9",
          sky: "#eaf4fc",
          line: "#c9dfef",
          text: "#102033",
          muted: "#527799"
        }
      }
    }
  },
  plugins: []
};

export default config;
