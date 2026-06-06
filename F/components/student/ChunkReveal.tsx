'use client'

import { useEffect } from 'react'
import { ChunkObject } from '@/lib/types'

interface ChunkRevealProps {
    chunk: ChunkObject
    onNext: () => void
    onPrevious: () => void
    canNext: boolean
    canPrevious: boolean
    activeWordIndex?: number
    fontSize?: number
    lineHeight?: number
    letterSpacing?: number
    keyboardEnabled?: boolean
}

export function ChunkReveal({
    chunk,
    onNext,
    onPrevious,
    canNext,
    canPrevious,
    activeWordIndex = -1,
    fontSize = 18,
    lineHeight = 1.8,
    letterSpacing = 0.05,
    keyboardEnabled = true,
}: ChunkRevealProps) {
    useEffect(() => {
        if (!keyboardEnabled) return

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowRight') {
                if (canNext) {
                    onNext()
                }
            } else if (e.code === 'ArrowLeft') {
                if (canPrevious) {
                    onPrevious()
                }
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [onNext, onPrevious, canNext, canPrevious, keyboardEnabled])

    const renderContent = () => {
        const text = chunk.simplified_text
        const words = text.split(/\s+/)

        return words.map((word, idx) => {
            const isActive = idx === activeWordIndex

            // Check if word is a key term
            const isKeyTerm = chunk.key_terms.some(
                (term) => term.toLowerCase() === word.replace(/[.,!?;:—]/g, '').toLowerCase()
            )

            return (
                <span
                    key={idx}
                    className={`transition-colors duration-100 ${isActive ? 'bg-yellow-300' : isKeyTerm ? 'bg-yellow-100' : ''
                        } ${isKeyTerm ? 'font-medium' : ''}`}
                >
                    {word}
                    {idx < words.length - 1 && ' '}
                </span>
            )
        })
    }

    return (
        <article
            className="w-full max-w-prose mx-auto px-prose-x space-y-6 animate-chunk-reveal"
            style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                letterSpacing: `${letterSpacing}em`,
            }}
        >
            {/* Content */}
            <div className="space-y-4 text-left text-dark-text leading-relaxed">
                <p className="whitespace-pre-wrap break-words">
                    {renderContent()}
                </p>
            </div>

            {/* Objective */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-sm font-medium text-blue-900">In short:</p>
                <p className="text-sm text-blue-800 mt-1">{chunk.objective}</p>
            </div>

            {/* Core Facts */}
            {chunk.core_facts.length > 0 && (
                <div className="bg-accent-teal/10 rounded-lg p-4 space-y-2">
                    <p className="font-medium text-dark-text text-sm">Key facts:</p>
                    <ul className="space-y-1">
                        {chunk.core_facts.map((fact, idx) => (
                            <li key={idx} className="text-sm text-dark-text flex gap-2">
                                <span className="text-accent-teal font-bold">•</span>
                                <span>{fact}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button
                    onClick={onPrevious}
                    disabled={!canPrevious}
                    className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-dark-text hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    ← Previous
                </button>
                <button
                    onClick={onNext}
                    disabled={!canNext}
                    className="px-6 py-2 rounded-lg font-medium bg-brand-purple text-white hover:bg-brand-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next section →
                </button>
            </div>
        </article>
    )
}
