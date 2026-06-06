'use client'

import { useState } from 'react'
import { StudentPrefs } from '@/lib/types'

interface AccessibilityBarProps {
    prefs: StudentPrefs
    onUpdate: <K extends keyof StudentPrefs>(key: K, value: StudentPrefs[K]) => void
    onReset: () => void
}

const BG_COLORS: Array<{ id: StudentPrefs['background']; label: string; value: string }> = [
    { id: 'cream', label: 'Cream', value: '#FEF9F0' },
    { id: 'white', label: 'White', value: '#FFFFFF' },
    { id: 'blue', label: 'Blue', value: '#EFF6FF' },
    { id: 'dark', label: 'Dark', value: '#1a1a1a' },
]

const FONTS: Array<{ id: StudentPrefs['font']; label: string; preview: string }> = [
    { id: 'opendyslexic', label: 'OpenDyslexic', preview: 'font-opendyslexic' },
    { id: 'lexend', label: 'Lexend', preview: 'font-lexend' },
    { id: 'system', label: 'System', preview: 'font-sans' },
]

export function AccessibilityBar({
    prefs,
    onUpdate,
    onReset,
}: AccessibilityBarProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <>
            {/* Collapsed Toggle */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="fixed top-4 right-4 z-30 bg-brand-purple text-white rounded-lg px-4 py-2 font-medium hover:bg-brand-purple/90 transition-colors shadow-lg"
                    aria-label="Open accessibility settings"
                >
                    ⚙️ Accessibility
                </button>
            )}

            {/* Expanded Bar */}
            {isExpanded && (
                <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-30 max-h-[90vh] overflow-y-auto">
                    <div className="max-w-4xl mx-auto p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-dark-text">Accessibility Settings</h3>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-2xl text-gray-400 hover:text-dark-text"
                                aria-label="Close accessibility settings"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Font Selection */}
                            <div>
                                <label className="block text-sm font-bold text-dark-text mb-3">Font</label>
                                <div className="flex gap-3 flex-wrap">
                                    {FONTS.map((font) => (
                                        <button
                                            key={font.id}
                                            onClick={() => onUpdate('font', font.id)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${prefs.font === font.id
                                                    ? 'bg-brand-purple text-white ring-2 ring-brand-purple ring-offset-2'
                                                    : 'bg-gray-100 text-dark-text hover:bg-gray-200'
                                                } ${font.preview}`}
                                        >
                                            {font.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-dark-text">Font Size</label>
                                    <span className="text-sm font-medium text-brand-purple">{prefs.fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={16}
                                    max={28}
                                    value={prefs.fontSize}
                                    onChange={(e) => onUpdate('fontSize', parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Line Height */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-dark-text">Line Height</label>
                                    <span className="text-sm font-medium text-brand-purple">{prefs.lineHeight.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={1.4}
                                    max={2.4}
                                    step={0.2}
                                    value={prefs.lineHeight}
                                    onChange={(e) => onUpdate('lineHeight', parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Letter Spacing */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-dark-text">Letter Spacing</label>
                                    <span className="text-sm font-medium text-brand-purple">{prefs.letterSpacing.toFixed(2)}em</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={0.15}
                                    step={0.01}
                                    value={prefs.letterSpacing}
                                    onChange={(e) => onUpdate('letterSpacing', parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Background Color */}
                            <div>
                                <label className="block text-sm font-bold text-dark-text mb-3">Background Color</label>
                                <div className="flex gap-3 flex-wrap">
                                    {BG_COLORS.map((bg) => (
                                        <button
                                            key={bg.id}
                                            onClick={() => onUpdate('background', bg.id)}
                                            className={`w-12 h-12 rounded-lg border-2 transition-all ${prefs.background === bg.id
                                                    ? 'border-brand-purple ring-2 ring-brand-purple ring-offset-2'
                                                    : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            style={{ backgroundColor: bg.value }}
                                            title={bg.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Reading Ruler Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-dark-text">Reading Ruler</label>
                                <button
                                    onClick={() => onUpdate('showRuler', !prefs.showRuler)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${prefs.showRuler ? 'bg-accent-teal' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${prefs.showRuler ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* TTS Speed */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-dark-text">TTS Speed</label>
                                    <span className="text-sm font-medium text-brand-purple">{prefs.ttsSpeed.toFixed(2)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min={0.5}
                                    max={2}
                                    step={0.25}
                                    value={prefs.ttsSpeed}
                                    onChange={(e) => onUpdate('ttsSpeed', parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* TTS Auto-play Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-dark-text">Auto-play TTS</label>
                                <button
                                    onClick={() => onUpdate('ttsAutoPlay', !prefs.ttsAutoPlay)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${prefs.ttsAutoPlay ? 'bg-accent-teal' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${prefs.ttsAutoPlay ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={onReset}
                                className="w-full px-4 py-3 bg-gray-200 text-dark-text font-medium rounded-lg hover:bg-gray-300 transition-colors border border-gray-300"
                            >
                                Reset to Default Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
