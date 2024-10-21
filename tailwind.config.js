/** @type {import('tailwindcss').Config} */
const { nextui } = require('@nextui-org/react')
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                violet: '#4900fa',
                'violet-hover': '#5c1afc',
                pink: '#cb00ee',
            },
        },
    },
    darkMode: 'class',
    plugins: [nextui()],
}
