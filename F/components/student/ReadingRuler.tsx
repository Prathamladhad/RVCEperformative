'use client'

import { useEffect, useState } from 'react'

interface ReadingRulerProps {
    enabled: boolean
}

export function ReadingRuler({ enabled }: ReadingRulerProps) {
    const [position, setPosition] = useState(0)

    useEffect(() => {
        if (!enabled) return

        const handleMouseMove = (e: MouseEvent) => {
            setPosition(e.clientY)
        }

        const handleScroll = () => {
            const elementTop = window.innerHeight * 0.4
            setPosition(elementTop)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('scroll', handleScroll)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('scroll', handleScroll)
        }
    }, [enabled])

    if (!enabled) return null

    return (
        <div
            className="fixed left-0 right-0 pointer-events-none opacity-60 bg-yellow-200"
            style={{
                height: '2.2em',
                transform: `translateY(${position}px)`,
                transition: 'transform 0.05s linear',
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)',
            }}
        />
    )
}
