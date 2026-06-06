import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                cream: '#FEF9F0',
                'brand-purple': '#534AB7',
                'accent-teal': '#1D9E75',
                'error-red': '#E24B4A',
                'dark-text': '#2C2416',
            },
            fontFamily: {
                opendyslexic: ['OpenDyslexic', 'sans-serif'],
                lexend: ['Lexend', 'sans-serif'],
            },
            maxWidth: {
                prose: '65ch',
            },
            spacing: {
                'prose-x': '24px',
            },
            lineHeight: {
                'reading': '1.8',
                'relaxed-plus': '2.0',
            },
            letterSpacing: {
                'reading': '0.05em',
            },
            animation: {
                'chunk-reveal': 'chunkReveal 0.2s ease-out',
                'pulse-bar': 'pulseBar 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                chunkReveal: {
                    '0%': { 'transform': 'translateY(10px)', 'opacity': '0' },
                    '100%': { 'transform': 'translateY(0)', 'opacity': '1' },
                },
                pulseBar: {
                    '0%, 100%': { 'opacity': '1' },
                    '50%': { 'opacity': '0.7' },
                },
            },
        },
    },
    plugins: [],
}

export default config
