'use client'

import { useState } from 'react'

interface GlossaryPanelProps {
    glossary: Record<string, string>
    keyTerms: string[]
    isOpen: boolean
    onClose: () => void
}

export function GlossaryPanel({
    glossary,
    keyTerms,
    isOpen,
    onClose,
}: GlossaryPanelProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredTerms = keyTerms.filter((term) =>
        term.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                />
            )}

            {/* Panel */}
            <div
                className={`fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl transform transition-transform duration-250 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text">Glossary</h2>
                    <button
                        onClick={onClose}
                        className="text-2xl text-gray-400 hover:text-dark-text transition-colors"
                        aria-label="Close glossary"
                    >
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Search terms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    />
                </div>

                {/* Terms List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {filteredTerms.length > 0 ? (
                        filteredTerms.map((term) => (
                            <div key={term} className="space-y-2">
                                <h3 className="font-bold text-dark-text text-lg font-opendyslexic">
                                    {term}
                                </h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {glossary[term] || 'No definition available.'}
                                </p>
                                <div className="h-px bg-gray-200" />
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 text-sm py-8">
                            No terms matching '{searchTerm}'
                        </p>
                    )}
                </div>
            </div>
        </>
    )
}
