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
                // Noir Theme Palette
                void: "#050505",
                cyan: {
                    DEFAULT: "#00f3ff",
                    dim: "rgba(0, 243, 255, 0.1)",
                },
                blood: "#ff003c",
                slate: {
                    DEFAULT: "#1f2937",
                    dark: "#111827",
                },
            },
            fontFamily: {
                mono: ["var(--font-jetbrains-mono)", "monospace"],
                serif: ["var(--font-playfair)", "serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
