import type { Config } from "tailwindcss";

const config: Config & { daisyui?: any } = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // PollSync Custom Color Scheme
                'primary': '#10B981', // Clean Green
                'secondary': '#F97316', // Orange
                'accent': '#1E40AF', // Smooth Dark Blue
                'dark-blue': '#0F172A', // Deep Dark Blue
                'background': '#0F172A',
                'foreground': '#F1F5F9',
                'dim': '#334155',
            },
        },
    },
    plugins: [
        require("daisyui"),
    ],
    daisyui: {
        themes: [
            {
                pollsync: {
                    "primary": "#10B981", // Green
                    "secondary": "#F97316", // Orange
                    "accent": "#1E40AF", // Dark Blue
                    "neutral": "#1E293B",
                    "base-100": "#0F172A", // Dark background
                    "base-200": "#1E293B",
                    "base-300": "#334155",
                    "info": "#3B82F6",
                    "success": "#10B981",
                    "warning": "#F59E0B",
                    "error": "#EF4444",
                },
            },
            {
                light: {
                    "primary": "#10B981",
                    "secondary": "#F97316",
                    "accent": "#1E40AF",
                    "neutral": "#3d4451",
                    "base-100": "#ffffff",
                    "base-200": "#F3F4F6",
                    "base-300": "#E5E7EB",
                    "info": "#3B82F6",
                    "success": "#10B981",
                    "warning": "#F59E0B",
                    "error": "#EF4444",
                },
            },
        ],
        base: true,
        styled: true,
        utils: true,
    },
};

export default config;
