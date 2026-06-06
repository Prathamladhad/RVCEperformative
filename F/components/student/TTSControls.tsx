'use client'

import { useEffect, useState } from 'react'
import { createTTSManager, isTTSSupported } from '@/lib/tts'

interface TTSControlsProps {
    text: string
    onWordChange?: (index: number) => void
    onSentenceChange?: (index: number) => void
    onComplete?: () => void
    speed?: number
    autoPlay?: boolean
    scale?: 'word' | 'line'
    onScaleChange?: (scale: 'word' | 'line') => void
}

export function TTSControls({
    text,
    onWordChange,
    onSentenceChange,
    onComplete,
    speed = 1,
    scale = 'word',
    onScaleChange,
}: TTSControlsProps) {
    const [ttsManager, setTtsManager] = useState<ReturnType<typeof createTTSManager> | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0)
    const [currentSpeed, setCurrentSpeed] = useState(speed)
    const [supported, setSupported] = useState(false)
    const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1)

    useEffect(() => {
        const isSupported = isTTSSupported()
        setSupported(isSupported)

        if (isSupported) {
            const manager = createTTSManager()
            setTtsManager(manager)

            const handleVoicesLoaded = () => {
                const available = manager.getVoices()
                setVoices(available)
            }

            manager.onVoicesChanged(handleVoicesLoaded)
            handleVoicesLoaded()
        }
    }, [])

    const speeds = [0.5, 0.75, 1, 1.25, 1.5]

    // Cancel speech on text, scale, speed, or voice changes
    useEffect(() => {
        if (ttsManager) {
            ttsManager.cancel()
            setIsPlaying(false)
            setActiveSentenceIdx(-1)
            onWordChange?.(-1)
            onSentenceChange?.(-1)
        }
    }, [text, scale, selectedVoiceIndex, currentSpeed])

    const runSentenceSequence = async (index: number, sentencesList: string[]) => {
        for (let i = index; i < sentencesList.length; i++) {
            setActiveSentenceIdx(i)
            onSentenceChange?.(i)
            
            try {
                await ttsManager!.speak(sentencesList[i], {
                    rate: currentSpeed,
                    voice: voices[selectedVoiceIndex]
                })
            } catch (err) {
                console.log('Sentence sequence interrupted:', err)
                return
            }
        }
        setIsPlaying(false)
        setActiveSentenceIdx(-1)
        onSentenceChange?.(-1)
        onComplete?.()
    }

    const togglePlayPause = async () => {
        if (!ttsManager || !text) return

        if (isPlaying) {
            ttsManager.pause()
            setIsPlaying(false)
        } else if (ttsManager.isPaused()) {
            ttsManager.resume()
            setIsPlaying(true)
        } else {
            setIsPlaying(true)
            if (scale === 'word') {
                try {
                    await ttsManager.speak(text, {
                        rate: currentSpeed,
                        voice: voices[selectedVoiceIndex],
                        onBoundary: (idx) => {
                            onWordChange?.(idx)
                        },
                    })
                    setIsPlaying(false)
                    onWordChange?.(-1)
                    onComplete?.()
                } catch (error) {
                    console.error('TTS error:', error)
                    setIsPlaying(false)
                }
            } else {
                const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [text]
                const start = activeSentenceIdx >= 0 ? activeSentenceIdx : 0
                runSentenceSequence(start, sentences)
            }
        }
    }

    if (!supported) {
        return null
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
            <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Play/Pause */}
                    <button
                        onClick={togglePlayPause}
                        className="w-12 h-12 rounded-full bg-brand-purple text-white flex items-center justify-center hover:bg-brand-purple/90 transition-colors shadow-md hover:shadow-lg text-lg"
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>

                    {/* Highlight Scale Control */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-dark-text">Highlight Style:</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => onScaleChange?.('word')}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                    scale === 'word'
                                        ? 'bg-brand-purple text-white'
                                        : 'bg-gray-100 text-dark-text hover:bg-gray-200'
                                }`}
                                title="Highlight word-by-word"
                            >
                                🔠 Word
                            </button>
                            <button
                                onClick={() => onScaleChange?.('line')}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                    scale === 'line'
                                        ? 'bg-brand-purple text-white'
                                        : 'bg-gray-100 text-dark-text hover:bg-gray-200'
                                }`}
                                title="Break down and highlight line-by-line"
                            >
                                ➖ Line Breakdown
                            </button>
                        </div>
                    </div>

                    {/* Speed Control */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-dark-text">Speed:</span>
                        <div className="flex gap-1">
                            {speeds.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setCurrentSpeed(s)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${currentSpeed === s
                                            ? 'bg-brand-purple text-white'
                                            : 'bg-gray-100 text-dark-text hover:bg-gray-200'
                                        }`}
                                    title={`Set speed to ${s}x`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Voice Selector */}
                    {voices.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="voices" className="text-sm font-medium text-dark-text">
                                Voice:
                            </label>
                            <select
                                id="voices"
                                value={selectedVoiceIndex}
                                onChange={(e) => setSelectedVoiceIndex(parseInt(e.target.value))}
                                className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-purple data"
                            >
                                {voices.map((voice, idx) => (
                                    <option key={idx} value={idx}>
                                        {voice.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Status */}
                    <span className="text-sm text-gray-600">
                        {isPlaying ? '🔊 Speaking...' : 'TTS ready'}
                    </span>
                </div>
            </div>
        </div>
    )
}
