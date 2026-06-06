import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'NeuroAdapt - Dyslexia-Friendly NCERT Reader',
    description: 'Transform NCERT textbook chapters into dyslexia-friendly reading experiences for Indian government school students.',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="scroll-smooth">
            <body className="antialiased">
                {children}
            </body>
        </html>
    )
}
