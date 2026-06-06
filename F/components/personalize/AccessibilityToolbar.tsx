"use client"

import { useState } from 'react'
import { useAccessibility } from '@/hooks/useAccessibility'

export default function AccessibilityToolbar() {
    const { prefs, updatePref, reset } = useAccessibility()
    const [isOpen, setIsOpen] = useState(false)

    // Narrate text helper for audio feedback
    const speakFeedback = (text: string) => {
        if (typeof window === 'undefined') return
        if (prefs.voiceNarration || prefs.ttsAutoPlay) {
            window.speechSynthesis?.cancel()
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = prefs.ttsSpeed || 1
            window.speechSynthesis?.speak(utterance)
        }
    }

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 max-w-[92vw] sm:max-w-md">
            {/* Main Toggle Button */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen)
                    speakFeedback(isOpen ? "Accessibility toolbar closed" : "Accessibility toolbar opened")
                }}
                className="flex items-center gap-2 rounded-full border border-violet-200 bg-white/95 px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-md shadow-violet-100 hover:bg-violet-50 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-violet-500"
                aria-expanded={isOpen}
                aria-label="Toggle Accessibility Preferences Toolbar"
            >
                <span className="text-lg">⚙️</span>
                <span>Quick Access Controls</span>
                <span className={`text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Expandable Preferences Board */}
            {isOpen && (
                <div className="w-80 sm:w-96 rounded-3xl border border-white/60 bg-white/90 p-5 shadow-2xl shadow-slate-300/50 backdrop-blur-xl transition-all duration-300 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-800">Accessibility Studio</span>
                        <button
                            onClick={() => {
                                reset()
                                speakFeedback("Preferences reset to default")
                            }}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition"
                        >
                            Reset Defaults
                        </button>
                    </div>

                    {/* Font Family Preference */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Typography Font</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['opendyslexic', 'lexend', 'system'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => {
                                        updatePref('font', f)
                                        speakFeedback(`Font changed to ${f === 'opendyslexic' ? 'Open Dyslexic' : f}`)
                                    }}
                                    className={`rounded-xl border py-1.5 text-xs font-medium capitalize transition-all ${
                                        prefs.font === f
                                            ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
                                    }`}
                                >
                                    {f === 'opendyslexic' ? 'Dyslexic' : f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size & Spacings */}
                    <div className="space-y-3">
                        {/* Font Size */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-bold uppercase tracking-wider">Font Size</span>
                                <span className="font-semibold text-slate-800">{prefs.fontSize}px</span>
                            </div>
                            <input
                                type="range"
                                min={14}
                                max={28}
                                step={1}
                                value={prefs.fontSize}
                                onChange={(e) => updatePref('fontSize', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                            />
                        </div>

                        {/* Line Height */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-bold uppercase tracking-wider">Line Spacing</span>
                                <span className="font-semibold text-slate-800">{prefs.lineHeight}x</span>
                            </div>
                            <input
                                type="range"
                                min={1.4}
                                max={2.4}
                                step={0.1}
                                value={prefs.lineHeight}
                                onChange={(e) => updatePref('lineHeight', parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                            />
                        </div>

                        {/* Letter Spacing */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-bold uppercase tracking-wider">Letter Spacing</span>
                                <span className="font-semibold text-slate-800">{prefs.letterSpacing}em</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={0.15}
                                step={0.01}
                                value={prefs.letterSpacing}
                                onChange={(e) => updatePref('letterSpacing', parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Color Theme Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Background Mood Theme</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { key: 'white', label: 'Pure White', color: '#FFFFFF', dark: false },
                                { key: 'cream', label: 'Warm Cream', color: '#FEF9F0', dark: false },
                                { key: 'blue', label: 'Calm Blue', color: '#EFF6FF', dark: false },
                                { key: 'sensory', label: 'Soothing Mint', color: '#E6F0EC', dark: false },
                                { key: 'warm', label: 'Soft Peach', color: '#FAF0E6', dark: false },
                                { key: 'dark', label: 'Midnight Dark', color: '#1a1a1a', dark: true }
                            ].map((theme) => (
                                <button
                                    key={theme.key}
                                    onClick={() => {
                                        updatePref('background', theme.key as any)
                                        speakFeedback(`Background theme changed to ${theme.label}`)
                                    }}
                                    style={{ backgroundColor: theme.color }}
                                    className={`relative flex flex-col items-center justify-center rounded-xl border p-2 text-[10px] font-semibold transition-all h-10 ${
                                        prefs.background === theme.key
                                            ? 'border-violet-600 ring-2 ring-violet-500/20 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-400'
                                    } ${theme.dark ? 'text-white' : 'text-slate-800'}`}
                                >
                                    {theme.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accessibility Toggles */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                        {/* Contrast */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contrast Mode</span>
                            <button
                                onClick={() => {
                                    const next = prefs.contrast === 'high' ? 'standard' : 'high'
                                    updatePref('contrast', next)
                                    speakFeedback(`Contrast set to ${next === 'high' ? 'high contrast' : 'standard contrast'}`)
                                }}
                                className={`rounded-xl border py-1 text-xs font-semibold transition-all ${
                                    prefs.contrast === 'high'
                                        ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                {prefs.contrast === 'high' ? '☀️ High Contrast' : '🕶️ Standard'}
                            </button>
                        </div>

                        {/* Motion */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Animations</span>
                            <button
                                onClick={() => {
                                    const next = prefs.motion === 'reduced' ? 'normal' : 'reduced'
                                    updatePref('motion', next)
                                    speakFeedback(next === 'reduced' ? 'Animations reduced' : 'Animations enabled')
                                }}
                                className={`rounded-xl border py-1 text-xs font-semibold transition-all ${
                                    prefs.motion === 'reduced'
                                        ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                {prefs.motion === 'reduced' ? '🔇 Reduced Motion' : '🎬 Normal Motion'}
                            </button>
                        </div>

                        {/* Audio Narration Toggle */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Voice Narrator</span>
                            <button
                                onClick={() => {
                                    const next = !prefs.voiceNarration
                                    updatePref('voiceNarration', next)
                                    speakFeedback(next ? "Voice Narrator Enabled" : "Voice Narrator Disabled")
                                }}
                                className={`rounded-xl border py-1 text-xs font-semibold transition-all ${
                                    prefs.voiceNarration
                                        ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                {prefs.voiceNarration ? '🔊 On (Speaker)' : '🔇 Off (Silent)'}
                            </button>
                        </div>

                        {/* Reading Ruler Toggle */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reading Ruler</span>
                            <button
                                onClick={() => {
                                    const next = !prefs.showRuler
                                    updatePref('showRuler', next)
                                    speakFeedback(next ? "Reading ruler shown" : "Reading ruler hidden")
                                }}
                                className={`rounded-xl border py-1 text-xs font-semibold transition-all ${
                                    prefs.showRuler
                                        ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                {prefs.showRuler ? '📏 Ruler Visible' : '🙈 Ruler Hidden'}
                            </button>
                        </div>
                    </div>

                    {/* Speech Speed controls (when narrator is active) */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-bold uppercase tracking-wider">Voice Speed (TTS)</span>
                            <span className="font-semibold text-slate-800">{prefs.ttsSpeed || 1}x</span>
                        </div>
                        <input
                            type="range"
                            min={0.5}
                            max={1.5}
                            step={0.1}
                            value={prefs.ttsSpeed || 1}
                            onChange={(e) => {
                                const rate = parseFloat(e.target.value)
                                updatePref('ttsSpeed', rate)
                                speakFeedback(`Voice speed set to ${rate}x`)
                            }}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
