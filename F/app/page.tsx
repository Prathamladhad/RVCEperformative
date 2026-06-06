'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
    const [shareCode, setShareCode] = useState('')
    const [isHovered, setIsHovered] = useState(false)

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/40 to-sky-50/50 relative overflow-hidden">
            {/* Calming Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-200/30 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-sky-200/30 blur-[120px] rounded-full pointer-events-none" />

            {/* Background Grid Pattern */}
            <svg
                className="fixed inset-0 w-full h-full pointer-events-none opacity-5"
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern
                        id="grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                    >
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#534AB7" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl animate-pulse">🧠</span>
                            <div>
                                <div className="text-2xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                    NeuroAdapt
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5 font-semibold">Learning made comfortable for every brain</p>
                            </div>
                        </div>

                        <nav className="flex items-center gap-4">
                            <Link
                                href="/personalize"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className="relative px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-violet-200 transition-all flex items-center gap-1.5 focus:outline-none"
                            >
                                <span className={`transition-transform duration-300 ${isHovered ? 'rotate-12 scale-110' : ''}`}>🎯</span>
                                <span>Personalize My Space</span>
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* Hero / Portal Content */}
                <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <span className="bg-violet-100 text-violet-700 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-violet-200 uppercase tracking-widest">
                            AI-Powered Learning Platform
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Personalized reading pathways that adapt to your cognitive style.
                        </h1>
                        <p className="text-slate-600 text-base leading-relaxed max-w-2xl mx-auto">
                            NeuroAdapt dynamically transforms textbook chapters to fit ADHD, Autism, Dyslexia, Low Vision, and Anxiety preferences. Start our friendly onboarding to unlock your custom dashboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                        {/* Student Reader Portal Card */}
                        <div className="bg-white/80 border border-white p-8 rounded-[40px] shadow-lg flex flex-col justify-between gap-6 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">👧</span>
                                    <h2 className="text-3xl font-extrabold text-slate-900">For Learners</h2>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Unlock your reading space! Customize layout scales, enable the guided reading ruler, play audio narration with word highlights, and track your focus coins as your virtual tree blossoms.
                                </p>

                                <div className="space-y-3 bg-violet-50/50 rounded-3xl p-5 border border-violet-100/60">
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Includes Workspace Tools:</h3>
                                    <ul className="space-y-2 text-xs text-slate-700">
                                        <li className="flex gap-2">
                                            <span className="text-violet-600">✓</span>
                                            <span>OpenDyslexic & Lexend font settings</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-violet-600">✓</span>
                                            <span>Live text-to-speech with highlighting guides</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-violet-600">✓</span>
                                            <span>Guided reading rulers and simple text mode toggles</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-violet-600">✓</span>
                                            <span>Guided breathing overlay if sensory overload triggers</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="shareCode" className="text-xs font-bold text-slate-700">
                                        Entering a shared classroom code?
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            id="shareCode"
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                            value={shareCode}
                                            onChange={(e) => setShareCode(e.target.value)}
                                            className="flex-1 px-4 py-3 border border-slate-200 bg-white/50 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                        <button
                                            onClick={() => {
                                                if (shareCode.length === 6) {
                                                    window.location.href = `/student/${shareCode}`
                                                }
                                            }}
                                            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-2xl transition shadow-md shadow-violet-100"
                                        >
                                            Enter Reader
                                        </button>
                                    </div>
                                </div>

                                <Link
                                    href="/personalize"
                                    className="w-full text-center block py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-violet-100 transition"
                                >
                                    Build My Personalized Space
                                </Link>
                            </div>
                        </div>

                        {/* Teacher Portal Card */}
                        <div className="bg-white/80 border border-white p-8 rounded-[40px] shadow-lg flex flex-col justify-between gap-6 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">👨‍🏫</span>
                                    <h2 className="text-3xl font-extrabold text-slate-900">For Educators</h2>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Upload standard textbook chapters (PDFs or raw text) and let our pipeline segment, summarize, and simplify the vocabulary to accommodate reading adjustments.
                                </p>

                                <div className="space-y-3 bg-emerald-50/50 rounded-3xl p-5 border border-emerald-100/60">
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Teacher features:</h3>
                                    <ul className="space-y-2 text-xs text-slate-700">
                                        <li className="flex gap-2">
                                            <span className="text-emerald-600">✓</span>
                                            <span>Segment and clean textbook documents automatically</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-emerald-600">✓</span>
                                            <span>Edit AI-generated term glossary lists</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-emerald-600">✓</span>
                                            <span>Generate unique classroom access keys</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-emerald-600">✓</span>
                                            <span>Monitor student diagnostics and weekly analytics</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <Link
                                href="/teacher"
                                className="w-full text-center py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-100 transition mt-4"
                            >
                                Enter Teacher Workspace
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-slate-100 bg-white/40 backdrop-blur-sm py-8 mt-12">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <p className="text-slate-500 text-xs font-semibold">
                            NeuroAdapt • Making classroom content accessible to every mind.
                        </p>
                    </div>
                </footer>
            </div>
        </main>
    )
}
