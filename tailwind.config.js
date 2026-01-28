/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./features/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./layouts/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom Palette Definition for reference
                'theme-p1': '#d4eaf7',
                'theme-p2': '#b6ccd8',
                'theme-p3': '#3b3c3d',
                'theme-a1': '#71c4ef',
                'theme-a2': '#00668c',
                'theme-t1': '#1d1c1c',
                'theme-t2': '#313d44',
                'theme-b1': '#fffefb',
                'theme-b2': '#f5f4f1',
                'theme-b3': '#cccbc8',

                // Override standard colors to apply theme globally
                // white: '#fffefb', // Don't override white globally unless sure, creates confusion

                blue: {
                    50: '#d4eaf7',  // primary-100 (Background highlights)
                    100: '#d4eaf7',
                    200: '#b6ccd8', // primary-200
                    300: '#71c4ef', // accent-100
                    400: '#71c4ef',
                    500: '#00668c', // accent-200 (Main Brand Color)
                    600: '#00668c',
                    700: '#004d69',
                },

                gray: {
                    50: '#f5f4f1',  // bg-200 (App background)
                    100: '#f5f4f1',
                    200: '#b6ccd8', // primary-200 (Borders)
                    300: '#cccbc8', // bg-300
                    400: '#9ca3af',
                    500: '#313d44', // text-200 (Secondary text)
                    600: '#313d44',
                    700: '#3b3c3d', // primary-300
                    800: '#1d1c1c', // text-100 (Headings)
                    900: '#1d1c1c',
                },

                slate: {
                    50: '#f5f4f1',
                    800: '#3b3c3d', // primary-300
                    900: '#1d1c1c', // text-100
                },

                emerald: {
                    50: '#ecfdf5',
                    500: '#10b981',
                    600: '#059669',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
