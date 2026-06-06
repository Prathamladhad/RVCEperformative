"use client"

import { useState, useEffect } from 'react'

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'done'

export default function BreathingExercise({ onClose }: { onClose: () => void }) {
    const [phase, setPhase] = useState<BreathingPhase>('inhale')
    const [secondsLeft, setSecondsLeft] = useState(4)
    const [cycles, setCycles] = useState(0)

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (phase !== 'done') {
            interval = setInterval(() => {
                setSecondsLeft((s) => {
                    if (s <= 1) {
                        // Switch phase
                        if (phase === 'inhale') {
                            setPhase('hold')
                            return 4
                        } else if (phase === 'hold') {
                            setPhase('exhale')
                            return 4
                        } else if (phase === 'exhale') {
                            const nextCycles = cycles + 1
                            setCycles(nextCycles)
                            if (nextCycles >= 3) {
                                setPhase('done')
                                return 0
                            } else {
                                setPhase('inhale')
                                return 4
                            }
                        }
                        return 4
                    }
                    return s - 1
                })
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [phase, cycles])

    const getPhaseMessage = () => {
        switch (phase) {
            case 'inhale':
                return 'Slowly Breathe In...'
            case 'hold':
                return 'Gently Hold It...'
            case 'exhale':
                return 'Release & Breathe Out...'
            case 'done':
                return 'Wonderful job. You are ready to continue!'
        }
    }

    const getBubbleScaleClass = () => {
        switch (phase) {
            case 'inhale':
                return 'scale-150 duration-[4000ms] bg-emerald-300/40 text-emerald-950 border-emerald-400'
            case 'hold':
                return 'scale-150 duration-[4000ms] bg-sky-300/40 text-sky-950 border-sky-400'
            case 'exhale':
                return 'scale-90 duration-[4000ms] bg-violet-300/40 text-violet-950 border-violet-400'
            default:
                return 'scale-100 duration-500 bg-amber-100/50 text-amber-950 border-amber-300'
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xl transition-opacity animate-fade-in">
            <div className="w-[90vw] max-w-md rounded-[40px] border border-white/60 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-lg flex flex-col items-center">
                <span className="text-4xl mb-2">🌸</span>
                <h3 className="text-2xl font-bold text-slate-800">Calm Workspace</h3>
                <p className="mt-1 text-sm text-slate-600">Let's take a quick 1-minute breathing break together to reset.</p>

                {/* Breathing Visual Bubble */}
                <div className="my-12 h-64 flex items-center justify-center">
                    <div
                        className={`w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center transition-all ease-in-out font-bold text-center p-4 select-none ${getBubbleScaleClass()}`}
                    >
                        <span className="text-xs uppercase tracking-widest opacity-60">Phase</span>
                        <span className="text-2xl mt-1">{secondsLeft > 0 ? secondsLeft : '✨'}</span>
                    </div>
                </div>

                <div className="min-h-[50px] mb-6">
                    <p className="text-lg font-semibold text-slate-700 transition-all duration-300">
                        {getPhaseMessage()}
                    </p>
                    {phase !== 'done' && (
                        <p className="text-xs text-slate-500 mt-1">Cycle {cycles + 1} of 3</p>
                    )}
                </div>

                <div className="flex gap-3 w-full">
                    {phase === 'done' ? (
                        <button
                            onClick={onClose}
                            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-md shadow-emerald-100"
                        >
                            Return to Dashboard
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                Skip Break
                            </button>
                            <button
                                onClick={() => {
                                    setPhase('inhale')
                                    setCycles(0)
                                    setSecondsLeft(4)
                                }}
                                className="flex-1 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 shadow-md shadow-violet-100"
                            >
                                Restart
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
