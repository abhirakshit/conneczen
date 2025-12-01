/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./apps/web/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./apps/web/components/**/*.{js,ts,jsx,tsx}",
        "./apps/web/lib/**/*.{js,ts,jsx,tsx}",

        // Optional shared packages
        "./packages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};