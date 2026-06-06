"use client"

import { useState, useEffect } from 'react'

type GardenProgressProps = {
    xp: number
    coins: number
    onBuyTheme?: (themeName: string, cost: number) => void
    unlockedThemes?: string[]
}

export default function GardenProgress({ xp, coins, onBuyTheme, unlockedThemes = ['Default'] }: GardenProgressProps) {
    const [gardenLevel, setGardenLevel] = useState(1)

    useEffect(() => {
        // Calculate garden level based on XP (e.g. 0-99 Level 1, 100-249 Level 2, 250-499 Level 3, 500+ Level 4)
        if (xp >= 500) {
            setGardenLevel(4)
        } else if (xp >= 250) {
            setGardenLevel(3)
        } else if (xp >= 100) {
            setGardenLevel(2)
        } else {
            setGardenLevel(1)
        }
    }, [xp])

    // Get SVG path/details for each garden level
    const renderTree = () => {
        switch (gardenLevel) {
            case 1:
                return (
                    <g className="animate-bounce duration-[3000ms]">
                        {/* Seed / Tiny Sprout */}
                        <circle cx="100" cy="130" r="12" fill="#8B4513" />
                        <ellipse cx="100" cy="122" rx="4" ry="10" fill="#a7f3d0" transform="rotate(20 100 122)" />
                        <path d="M 100 130 Q 100 115 108 106" stroke="#4ad396" strokeWidth="3" fill="none" />
                        <text x="100" y="160" textAnchor="middle" className="text-[10px] fill-emerald-800 font-semibold">Seed Sprouting</text>
                    </g>
                )
            case 2:
                return (
                    <g>
                        {/* Sprout with 2 Leaves */}
                        <path d="M 100 135 Q 100 95 95 80" stroke="#8B4513" strokeWidth="4" fill="none" />
                        {/* Leaf Left */}
                        <path d="M 98 105 Q 80 100 82 90 Q 94 95 98 105" fill="#4ad396" />
                        {/* Leaf Right */}
                        <path d="M 97 90 Q 115 85 116 75 Q 105 82 97 90" fill="#22c55e" />
                        <text x="100" y="160" textAnchor="middle" className="text-[10px] fill-emerald-800 font-semibold">Young Sapling</text>
                    </g>
                )
            case 3:
                return (
                    <g>
                        {/* Small Tree */}
                        <path d="M 100 135 Q 100 80 103 60" stroke="#7c2d12" strokeWidth="6" fill="none" />
                        {/* Branch Left */}
                        <path d="M 100 100 Q 80 85 70 85" stroke="#7c2d12" strokeWidth="3.5" fill="none" />
                        {/* Branch Right */}
                        <path d="M 101 80 Q 118 70 125 72" stroke="#7c2d12" strokeWidth="3.5" fill="none" />
                        {/* Foliage */}
                        <circle cx="103" cy="52" r="16" fill="#22c55e" opacity="0.9" />
                        <circle cx="72" cy="80" r="12" fill="#10b981" opacity="0.95" />
                        <circle cx="123" cy="70" r="13" fill="#059669" opacity="0.9" />
                        <text x="100" y="160" textAnchor="middle" className="text-[10px] fill-emerald-800 font-semibold">Growing Tree</text>
                    </g>
                )
            case 4:
            default:
                return (
                    <g className="transition-all duration-700">
                        {/* Full Blossoming Tree */}
                        <path d="M 100 135 L 100 65" stroke="#7c2d12" strokeWidth="8" />
                        <path d="M 100 95 Q 75 75 60 70" stroke="#7c2d12" strokeWidth="5" fill="none" />
                        <path d="M 100 80 Q 125 60 135 62" stroke="#7c2d12" strokeWidth="5" fill="none" />
                        <path d="M 100 65 Q 90 40 105 32" stroke="#7c2d12" strokeWidth="4" fill="none" />
                        {/* Leaf Bunches */}
                        <circle cx="100" cy="55" r="22" fill="#22c55e" opacity="0.9" />
                        <circle cx="60" cy="65" r="16" fill="#10b981" opacity="0.95" />
                        <circle cx="132" cy="58" r="18" fill="#059669" opacity="0.9" />
                        {/* Flowers / Fruit */}
                        <circle cx="95" cy="48" r="4" fill="#ec4899" />
                        <circle cx="108" cy="58" r="4" fill="#f43f5e" />
                        <circle cx="62" cy="68" r="3.5" fill="#f43f5e" />
                        <circle cx="125" cy="52" r="4" fill="#ec4899" />
                        <circle cx="138" cy="64" r="3.5" fill="#f59e0b" />
                        <text x="100" y="160" textAnchor="middle" className="text-[10px] fill-emerald-950 font-bold">Blossoming Garden Tree</text>
                    </g>
                )
        }
    }

    return (
        <div className="rounded-[32px] border border-white/80 bg-white/70 p-5 shadow-lg shadow-slate-200/60 backdrop-blur-lg flex flex-col gap-4">
            <div>
                <h3 className="text-lg font-semibold text-slate-900">Your Achievement Garden</h3>
                <p className="text-xs text-slate-500 mt-1">Watch your learning tree grow at your own comfortable pace.</p>
            </div>

            <div className="flex items-center gap-6">
                {/* SVG Garden Illustration */}
                <div className="w-36 h-36 bg-gradient-to-b from-teal-50/50 to-emerald-50 rounded-2xl border border-teal-100 flex items-center justify-center p-2 relative shadow-inner">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        {/* Soil Base */}
                        <path d="M 20 135 Q 100 128 180 135 L 180 180 L 20 180 Z" fill="#D2B48C" />
                        <path d="M 10 145 Q 100 140 190 145 L 190 180 L 10 180 Z" fill="#C4A482" />
                        {/* Sprout / Tree */}
                        {renderTree()}
                    </svg>
                    <div className="absolute top-2 right-2 bg-emerald-100/90 text-emerald-800 text-[10px] font-bold rounded-full px-2 py-0.5 shadow-sm border border-emerald-200">
                        Lvl {gardenLevel}
                    </div>
                </div>

                {/* Score & Progression */}
                <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Focus XP</span>
                            <span className="font-semibold text-violet-700">{xp} XP</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                                className="h-full bg-violet-600 transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(100, (xp / 500) * 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">Next Stage at 100, 250, 500 XP</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                            <span>🪙</span>
                            <span>{coins} Focus Coins</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calming Themes Unlocked Section */}
            {onBuyTheme && (
                <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unlock Calming Ambiances</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {[
                            { name: 'Forest Rain', cost: 15, key: 'forest' },
                            { name: 'Cosmic Zen', cost: 30, key: 'cosmic' }
                        ].map((theme) => {
                            const isUnlocked = unlockedThemes.includes(theme.name)
                            return (
                                <button
                                    key={theme.key}
                                    disabled={isUnlocked || coins < theme.cost}
                                    onClick={() => onBuyTheme(theme.name, theme.cost)}
                                    className={`flex items-center justify-between rounded-xl border p-2 text-left text-xs transition-all ${
                                        isUnlocked
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                            : coins >= theme.cost
                                            ? 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900'
                                            : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    <div>
                                        <div className="font-semibold">{theme.name}</div>
                                        <div className="text-[9px] opacity-75">{isUnlocked ? 'Unlocked ✓' : 'Spendable'}</div>
                                    </div>
                                    {!isUnlocked && (
                                        <span className="font-bold text-amber-700 text-[10px]">🪙{theme.cost}</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
