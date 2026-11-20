import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#070913",
        abyss: "#0d1224",
        slatePanel: "#131b33",
        arcane: "#8b5cf6",
        aether: "#06b6d4",
        emeraldRune: "#10b981",
        crimsonRune: "#ef4444",
      },
    },
  },
  plugins: [],
};
export default config;
