"use client"

import { useState } from 'react'

type LivePreviewProps = {
    profileKey: string
    presets: Record<string, string | number>
}

export default function LivePreview({ profileKey, presets }: LivePreviewProps) {
    const [isSimplified, setIsSimplified] = useState(true)
    const [isNarrating, setIsNarrating] = useState(false)
    const [rulerTop, setRulerTop] = useState(60)
    const [speechIndex, setSpeechIndex] = useState(-1)

    const complexText = "An ecosystem represents a complex biochemical and structural community of living, biotic organisms (composed of diverse flora and fauna populations) interacting symbiotically with abiotic geological components."
    const simplifiedText = "An ecosystem is a community where living things (plants, animals) and non-living things (water, soil, sun) interact and help each other survive."

    // Highlight TTS words simulation
    const words = (isSimplified ? simplifiedText : complexText).split(' ')

    const toggleNarration = () => {
        if (isNarrating) {
            setIsNarrating(false)
            setSpeechIndex(-1)
        } else {
            setIsNarrating(true)
            let idx = 0
            const interval = setInterval(() => {
                setSpeechIndex(idx)
                idx++
                if (idx >= words.length) {
                    clearInterval(interval)
                    setIsNarrating(false)
                    setSpeechIndex(-1)
                }
            }, 300)
        }
    }

    return (
        <div className="rounded-[32px] border border-white/80 bg-white/70 p-6 shadow-lg shadow-slate-200/60 backdrop-blur-lg flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Interactive Live Preview</p>
                    <h2 className="text-2xl font-bold text-slate-900 capitalize">{profileKey} Mode</h2>
                </div>
                <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Previewing Preset</div>
            </div>

            {/* Simulated Reading Container */}
            <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-4 overflow-hidden">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lesson Card Preview</span>
                    </div>
                    <div className="flex gap-2">
                        {/* Audio Narrator simulation */}
                        <button
                            onClick={toggleNarration}
                            className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-all ${
                                isNarrating
                                    ? 'bg-rose-500 text-white animate-pulse'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            {isNarrating ? '⏹️ Mute' : '🔊 Read Aloud'}
                        </button>
                        {/* Simplification Toggle */}
                        <button
                            onClick={() => setIsSimplified(!isSimplified)}
                            className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 transition"
                        >
                            {isSimplified ? '📖 Show Full Text' : '🪄 Simplify Text'}
                        </button>
                    </div>
                </div>

                {/* Main Text Block with dynamic styling */}
                <div
                    onMouseMove={(e) => {
                        const bounds = e.currentTarget.getBoundingClientRect()
                        setRulerTop(e.clientY - bounds.top - 12)
                    }}
                    className="relative rounded-2xl border border-slate-200/60 p-5 cursor-row-resize overflow-hidden"
                    style={{
                        fontFamily: presets.font === 'opendyslexic' ? 'OpenDyslexic' : presets.font === 'lexend' ? 'Lexend' : 'system-ui',
                        fontSize: `${presets.fontSize ?? 17}px`,
                        lineHeight: `${presets.lineHeight ?? 1.8}`,
                        letterSpacing: `${presets.letterSpacing ?? 0.04}em`,
                        backgroundColor: presets.bg as string,
                    }}
                >
                    {/* Simulated Reading Ruler */}
                    {profileKey !== 'sensory' && (
                        <div
                            className="absolute left-0 right-0 h-7 bg-amber-300/20 border-y border-amber-400/40 pointer-events-none transition-all duration-75"
                            style={{ top: `${Math.max(10, Math.min(rulerTop, 160))}px` }}
                        />
                    )}

                    <p className="leading-relaxed">
                        {words.map((word, idx) => (
                            <span
                                key={idx}
                                className={`inline-block mr-1 rounded ${
                                    idx === speechIndex
                                        ? 'bg-yellow-300 text-black font-bold scale-105'
                                        : ''
                                }`}
                            >
                                {word}
                            </span>
                        ))}
                    </p>
                </div>
            </div>

            {/* Profile Specific Feature Alerts */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Visual & Cognitive Features Enabled</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span>🎨</span>
                        <div>
                            <span className="font-semibold text-slate-900 block">Theme Base</span>
                            <span>{presets.bg} hex hue</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span>📏</span>
                        <div>
                            <span className="font-semibold text-slate-900 block">Reading Ruler</span>
                            <span>{profileKey === 'sensory' ? 'Muted' : 'Hover-Guided ruler'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span>⚡</span>
                        <div>
                            <span className="font-semibold text-slate-900 block">Focus Pacing</span>
                            <span>{profileKey === 'adhd' ? '5-min sprints' : 'Standard pace'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span>🧩</span>
                        <div>
                            <span className="font-semibold text-slate-900 block">Format Layout</span>
                            <span>{profileKey === 'autism' ? 'Predictable routines' : 'Adaptive content'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
