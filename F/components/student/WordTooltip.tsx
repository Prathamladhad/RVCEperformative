'use client'

import { useState, useRef } from 'react'

interface WordTooltipProps {
    word: string
    definition?: string
    children: React.ReactNode
}

export function WordTooltip({
    definition,
    children,
}: WordTooltipProps) {
    const [showTooltip, setShowTooltip] = useState(false)
    const tooltipRef = useRef<HTMLDivElement>(null)

    if (!definition) {
        return <>{children}</>
    }

    return (
        <div className="relative inline-block">
            <div
                onTouchStart={() => setShowTooltip(true)}
                onTouchEnd={() => setShowTooltip(false)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="cursor-help"
            >
                {children}
            </div>

            {showTooltip && (
                <div
                    ref={tooltipRef}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-dark-text text-white px-3 py-2 rounded-lg whitespace-nowrap text-sm shadow-lg z-50 pointer-events-none"
                >
                    {definition}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-dark-text" />
                </div>
            )}
        </div>
    )
}
