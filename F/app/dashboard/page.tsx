"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { listChapters } from '@/lib/api'
import { ChapterData } from '@/lib/types'
import { ARPdfViewer } from '@/components/shared/ARPdfViewer'

type ProfileKey =
    | 'dyslexia'
    | 'autism'
    | 'adhd'
    | 'visual'
    | 'anxiety'
    | 'slow'
    | 'sensory'
    | 'custom'

const PROFILE_DETAILS: Record<ProfileKey, { title: string; desc: string; icon: string; theme: string }> = {
    dyslexia: {
        title: 'Dyslexia Mode',
        desc: 'Custom dyslexic-friendly font, line ruler guidance, word spacing, and audio-assisted narration.',
        icon: '📖',
        theme: 'bg-amber-50 border-amber-200 text-amber-800'
    },
    adhd: {
        title: 'ADHD Mode',
        desc: 'Dopamine rewards, visual interval timers, gamified coins, and active focus cues.',
        icon: '⚡',
        theme: 'bg-sky-50 border-sky-200 text-sky-800'
    },
    autism: {
        title: 'Autism Mode',
        desc: 'Highly structured lesson maps, predictability guides, and minimal animation distractions.',
        icon: '🧩',
        theme: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    visual: {
        title: 'Low Vision Mode',
        desc: 'Magnified typography, high contrast display, and voice narration read-aloud support.',
        icon: '🔍',
        theme: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    },
    anxiety: {
        title: 'Calming Mode',
        desc: 'Stress-free environment, no timed elements, soft tones, and breathing exercises.',
        icon: '🕊️',
        theme: 'bg-rose-50 border-rose-200 text-rose-800'
    },
    sensory: {
        title: 'Sensory Sensitive',
        desc: 'Muted grey/mint palettes, zero visual noise, flat interfaces, and silent ambiance.',
        icon: '💤',
        theme: 'bg-slate-50 border-slate-200 text-slate-800'
    },
    slow: {
        title: 'Spaced Review',
        desc: 'Reinforced concept loops, vocabulary checks, and repetition cycles for retention.',
        icon: '🔁',
        theme: 'bg-teal-50 border-teal-200 text-teal-800'
    },
    custom: {
        title: 'Custom Profile',
        desc: 'Individually fine-tuned font spacing, weights, colors, and accessibility settings.',
        icon: '⚙️',
        theme: 'bg-violet-50 border-violet-200 text-violet-800'
    }
}

export default function StudentDashboardPage() {
    const router = useRouter()
    const [name, setName] = useState('Learner')
    const [profile, setProfile] = useState<ProfileKey>('dyslexia')
    const [metrics, setMetrics] = useState({
        focusCoins: 10,
        xpPoints: 45,
        completedLessons: 0
    })
    const [chapters, setChapters] = useState<ChapterData[]>([])
    const [loadingChapters, setLoadingChapters] = useState(true)
    const [arViewerOpen, setArViewerOpen] = useState(false)

    // Load user configuration
    useEffect(() => {
        const savedName = localStorage.getItem('neuroadapt_student_name')
        const savedProfile = localStorage.getItem('neuroadapt_profile') as ProfileKey
        const savedMetricsStr = localStorage.getItem('neuroadapt_behavior_metrics')

        if (savedName) setName(savedName)
        if (savedProfile) setProfile(savedProfile)

        if (savedMetricsStr) {
            try {
                const parsed = JSON.parse(savedMetricsStr)
                setMetrics({
                    focusCoins: parsed.focusCoins ?? 10,
                    xpPoints: parsed.xpPoints ?? 45,
                    completedLessons: parsed.completedLessons ?? 0
                })
            } catch (err) {
                // ignore
            }
        }

        // Fetch textbooks/chapters
        const loadChaptersData = async () => {
            try {
                const data = await listChapters()
                // Show approved chapters
                setChapters(data.filter(ch => ch.approved))
            } catch (error) {
                console.error('Failed to load chapters:', error)
            } finally {
                setLoadingChapters(false)
            }
        }

        loadChaptersData()
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('neuroadapt_student_id')
        localStorage.removeItem('neuroadapt_student_name')
        localStorage.removeItem('neuroadapt_profile')
        localStorage.removeItem('neuroadapt_behavior_metrics')
        localStorage.removeItem('neuroadapt_student_prefs')
        router.push('/')
    }

    // Determine focus garden growth stage
    const xp = metrics.xpPoints
    let gardenStage = '🌱 Seedling'
    let gardenLabel = 'Stage 1: Seedling'
    let progress = Math.min(100, Math.round((xp / 50) * 100))
    let nextStage = 'Sprout (50 XP)'

    if (xp >= 100) {
        gardenStage = '🌳 Blossomed Tree'
        gardenLabel = 'Stage 3: Mature Tree'
        progress = 100
        nextStage = 'Max Stage reached!'
    } else if (xp >= 50) {
        gardenStage = '🌿 Sprouting Plant'
        gardenLabel = 'Stage 2: Sprout'
        progress = Math.min(100, Math.round(((xp - 50) / 50) * 100))
        nextStage = 'Blossomed Tree (100 XP)'
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/40 to-sky-50/50 py-10 px-4 sm:px-6 relative overflow-hidden">
            {/* Calming Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-200/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky-200/20 blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                {/* 1. Header Card */}
                <header className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-violet-200/50">
                            🧠
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Hello, {name}!</h1>
                            <p className="text-xs font-semibold text-slate-500">Welcome to your adaptive reading space.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/personalize"
                            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                        >
                            🎯 Adjust Profile
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-100 hover:bg-rose-100/60 text-rose-700 font-bold text-xs transition shadow-sm"
                        >
                            🚪 Logout
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Stats & Profile) */}
                    <div className="space-y-8">
                        {/* Cognitive Profile Card */}
                        <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-md space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Cognitive Profile</h3>
                            
                            <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${PROFILE_DETAILS[profile]?.theme || 'bg-violet-50 border-violet-100 text-violet-800'}`}>
                                <span className="text-3xl shrink-0 mt-0.5">{PROFILE_DETAILS[profile]?.icon || '⚙️'}</span>
                                <div className="space-y-1">
                                    <h4 className="font-black text-sm">{PROFILE_DETAILS[profile]?.title || 'Dyslexia Mode'}</h4>
                                    <p className="text-xs opacity-90 leading-relaxed">
                                        {PROFILE_DETAILS[profile]?.desc || 'Layout optimizations enabled.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Focus Garden Progress Card */}
                        <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-md space-y-5">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">My Focus Garden</h3>
                            
                            {/* Visual Tree */}
                            <div className="flex flex-col items-center py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <span className="text-5xl animate-bounce duration-[3000ms]">{gardenStage.split(' ')[0]}</span>
                                <span className="text-xs font-black text-slate-700 mt-2">{gardenLabel}</span>
                            </div>

                            {/* Stat Coins & XP */}
                            <div className="grid grid-cols-2 gap-3.5">
                                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3 text-center">
                                    <span className="text-lg">🪙</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Focus Coins</p>
                                    <p className="text-lg font-black text-amber-800">{metrics.focusCoins}</p>
                                </div>
                                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3 text-center">
                                    <span className="text-lg">⚡</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">XP Earned</p>
                                    <p className="text-lg font-black text-indigo-800">{metrics.xpPoints}</p>
                                </div>
                            </div>

                            {/* Level Up Progress */}
                            {xp < 100 && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>Next Stage:</span>
                                        <span>{nextStage}</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (AR Launch + Textbook list) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* ─── Relocated AR PDF Viewer Card ─── */}
                        <div
                            className="rounded-3xl overflow-hidden relative"
                            style={{
                                background: 'linear-gradient(135deg, #1b0c33 0%, #0d1233 60%, #001233 100%)',
                                border: '1px solid rgba(139,92,246,0.3)',
                                boxShadow: '0 8px 30px rgba(139,92,246,0.15)',
                            }}
                        >
                            {/* Glow orbs */}
                            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
                            <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)' }} />

                            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                {/* Icon */}
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                                    style={{
                                        background: 'rgba(139,92,246,0.18)',
                                        border: '1px solid rgba(139,92,246,0.4)',
                                        boxShadow: '0 0 20px rgba(139,92,246,0.25)',
                                    }}
                                >
                                    🔮
                                </div>

                                {/* Text */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span
                                            className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                                            style={{ background: 'rgba(139,92,246,0.25)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.4)' }}
                                        >
                                            Interactive
                                        </span>
                                        <h2 className="text-white font-extrabold text-lg">AR PDF Text Overlay</h2>
                                    </div>
                                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                        Launch your camera, hover over a printed workbook page, and project simplified text right over it! Includes a gesture-controlled **Word Catch Game** to boost vocabulary retention.
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {['📷 Live Camera', '☝️ Hand Gestures', '🎮 Word Catch Game', '✨ Interactive overlays'].map(tag => (
                                            <span
                                                key={tag}
                                                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Launch Button */}
                                <button
                                    onClick={() => setArViewerOpen(true)}
                                    className="w-full sm:w-auto flex-shrink-0 px-6 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                        boxShadow: '0 0 25px rgba(124,58,237,0.45)',
                                    }}
                                >
                                    🚀 Launch AR Viewer
                                </button>
                            </div>
                        </div>

                        {/* Classroom Textbooks Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-black text-slate-800">📖 Classroom Textbooks Available</h2>
                            
                            {loadingChapters ? (
                                <div className="text-center py-10 bg-white/60 rounded-3xl border border-slate-100">
                                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-violet-600 border-t-transparent mx-auto" />
                                    <p className="text-xs font-bold text-slate-500 mt-2">Loading classroom materials...</p>
                                </div>
                            ) : chapters.length === 0 ? (
                                <div className="bg-white/60 border border-slate-100 rounded-3xl p-8 text-center space-y-3 shadow-sm">
                                    <span className="text-4xl">📚</span>
                                    <h4 className="font-bold text-slate-800 text-sm">No textbooks uploaded yet</h4>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                        Your teacher has not approved any textbook chapters for this class yet. Chapters approved in the teacher workspace will appear here instantly.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {chapters.map((ch) => (
                                        <div
                                            key={ch.chapter_id}
                                            className="bg-white/80 border border-slate-100 p-5 rounded-[24px] shadow-sm hover:shadow-md hover:border-violet-200 transition-all flex flex-col justify-between gap-4 group"
                                        >
                                            <div className="space-y-1.5 text-left">
                                                <span className="text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 leading-none">
                                                    {ch.subject}
                                                </span>
                                                <h4 className="font-extrabold text-slate-800 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug">
                                                    {ch.title}
                                                </h4>
                                                <div className="flex gap-3 text-[10px] font-semibold text-slate-500">
                                                    <span>Class {ch.class_level}</span>
                                                    <span>•</span>
                                                    <span>{ch.chunks.length} Chapters Sections</span>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/student/${ch.chapter_id}`}
                                                className="w-full text-center py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-100 transition flex items-center justify-center gap-1.5"
                                            >
                                                Start Reading 📖
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AR PDF Viewer Modal */}
            <ARPdfViewer
                isOpen={arViewerOpen}
                onClose={() => setArViewerOpen(false)}
                mode="student"
            />
        </main>
    )
}
