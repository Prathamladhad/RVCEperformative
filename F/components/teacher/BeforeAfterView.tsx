'use client'

import { useState } from 'react'
import { ChunkObject } from '@/lib/types'

interface BeforeAfterViewProps {
    chunks: ChunkObject[]
    onChunkUpdate?: (chunkId: string, text: string) => void
}

export function BeforeAfterView({
    chunks,
    onChunkUpdate,
}: BeforeAfterViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [editingChunkId, setEditingChunkId] = useState<string | null>(null)
    const [editText, setEditText] = useState('')

    const chunk = chunks[currentIndex]

    const handleEditStart = (chunkId: string, text: string) => {
        setEditingChunkId(chunkId)
        setEditText(text)
    }

    const handleEditSave = () => {
        if (editingChunkId && onChunkUpdate) {
            onChunkUpdate(editingChunkId, editText)
            setEditingChunkId(null)
        }
    }


    return (
        <div className="w-full space-y-6 bg-white rounded-lg shadow">
            {/* Navigation */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-dark-text">
                        Chunk {currentIndex + 1} of {chunks.length}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                            disabled={currentIndex === 0}
                            className="px-4 py-2 bg-gray-200 text-dark-text rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                        >
                            ← Previous
                        </button>
                        <button
                            onClick={() => setCurrentIndex(Math.min(chunks.length - 1, currentIndex + 1))}
                            disabled={currentIndex === chunks.length - 1}
                            className="px-4 py-2 bg-gray-200 text-dark-text rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>

                {/* Dot Navigation */}
                <div className="flex gap-2 flex-wrap">
                    {chunks.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                    ? 'bg-brand-purple w-6'
                                    : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            aria-label={`Go to chunk ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original */}
                <div className="space-y-3">
                    <h4 className="font-bold text-dark-text text-lg">Original NCERT</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <p className="text-sm leading-relaxed text-dark-text whitespace-pre-wrap">
                            {chunk.original_text}
                        </p>
                    </div>
                </div>

                {/* Transformed */}
                <div className="space-y-3">
                    <h4 className="font-bold text-dark-text text-lg">NeuroAdapt Output</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                        {editingChunkId === chunk.chunk_id ? (
                            <div className="space-y-3">
                                <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg font-sans text-sm resize-none h-32"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleEditSave}
                                        className="px-4 py-2 bg-accent-teal text-white rounded-lg font-medium hover:bg-accent-teal/90"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingChunkId(null)}
                                        className="px-4 py-2 bg-gray-200 text-dark-text rounded-lg font-medium hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => handleEditStart(chunk.chunk_id, chunk.simplified_text)}
                                className="cursor-pointer text-sm leading-relaxed text-dark-text whitespace-pre-wrap hover:bg-green-100/50 p-2 rounded transition-colors"
                            >
                                {chunk.simplified_text}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Key Terms */}
            {chunk.key_terms.length > 0 && (
                <div className="p-6 border-t border-gray-200">
                    <h4 className="font-bold text-dark-text mb-3">Key Terms</h4>
                    <div className="flex flex-wrap gap-2">
                        {chunk.key_terms.map((term) => (
                            <span
                                key={term}
                                className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-sm font-medium text-dark-text"
                            >
                                {term}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
