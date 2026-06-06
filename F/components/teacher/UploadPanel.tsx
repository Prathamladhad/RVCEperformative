'use client'

import { useRef, useState } from 'react'
import { UploadMetadata } from '@/lib/types'

interface UploadPanelProps {
    onSubmit: (metadata: UploadMetadata) => void
    isLoading?: boolean
}

export function UploadPanel({ onSubmit, isLoading = false }: UploadPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [mode, setMode] = useState<'upload' | 'paste'>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [text, setText] = useState('')

    const isValid =
        (mode === 'upload' && file) || (mode === 'paste' && text.trim())

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.currentTarget.classList.add('border-brand-purple', 'bg-brand-purple/5')
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('border-brand-purple', 'bg-brand-purple/5')
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.currentTarget.classList.remove('border-brand-purple', 'bg-brand-purple/5')
        const files = e.dataTransfer.files
        if (files.length > 0 && files[0].type === 'application/pdf') {
            setFile(files[0])
            setMode('upload')
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = () => {
        onSubmit({
            file: mode === 'upload' ? file || undefined : undefined,
            text: mode === 'paste' ? text : undefined,
            class_level: 8,
            subject: 'science',
            board: 'ncert',
        })
    }

    return (
        <div className="w-full space-y-6 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold text-dark-text">Upload Chapter</h2>

            {/* Mode Toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => setMode('upload')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'upload'
                            ? 'bg-brand-purple text-white'
                            : 'bg-gray-100 text-dark-text hover:bg-gray-200'
                        }`}
                    disabled={isLoading}
                >
                    Upload PDF
                </button>
                <button
                    onClick={() => setMode('paste')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'paste'
                            ? 'bg-brand-purple text-white'
                            : 'bg-gray-100 text-dark-text hover:bg-gray-200'
                        }`}
                    disabled={isLoading}
                >
                    Paste Text
                </button>
            </div>

            {/* Upload Area */}
            {mode === 'upload' && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-brand-purple hover:bg-brand-purple/5"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isLoading}
                    />
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-lg font-medium text-dark-text">
                        Drop PDF here or click to browse
                    </p>
                    {file && (
                        <p className="text-sm text-accent-teal mt-2">✓ {file.name}</p>
                    )}
                </div>
            )}

            {/* Text Area */}
            {mode === 'paste' && (
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste chapter text here. Example: 'Photosynthesis is the process by which plants convert light energy...'"
                    className="w-full h-40 p-4 border border-gray-300 rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    disabled={isLoading}
                />
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!isValid || isLoading}
                className="w-full bg-brand-purple text-white py-3 rounded-lg font-bold text-lg hover:bg-brand-purple/90 disabled:bg-gray-400 transition-colors disabled:cursor-not-allowed"
            >
                {isLoading ? 'Processing...' : 'Transform Chapter'}
            </button>
        </div>
    )
}
