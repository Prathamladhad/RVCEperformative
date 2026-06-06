"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AccessibilityToolbar from '../../components/personalize/AccessibilityToolbar'
import LivePreview from '../../components/personalize/LivePreview'
import ProfileCard from '../../components/personalize/ProfileCard'

type ProfileKey =
    | 'dyslexia'
    | 'autism'
    | 'adhd'
    | 'visual'
    | 'anxiety'
    | 'slow'
    | 'sensory'
    | 'custom'

const PROFILES: Record<ProfileKey, { title: string; summary: string; presets: Record<string, string | number> }> = {
    dyslexia: {
        title: 'Dyslexia Mode',
        summary: 'Dyslexic-friendly font, adjustable letter spacing, line focus ruler, and text-to-speech support.',
        presets: { font: 'lexend', fontSize: 20, lineHeight: 2.0, letterSpacing: 0.08, bg: '#FEF9F0' },
    },
    adhd: {
        title: 'ADHD Mode',
        summary: 'Gamified rewards, 5-minute study intervals, XP trackers, and visual dopamine indicators.',
        presets: { font: 'lexend', fontSize: 18, lineHeight: 1.7, letterSpacing: 0.04, bg: '#EFF9FF' },
    },
    autism: {
        title: 'Autism Mode',
        summary: 'Structured learning schedules, minimal animation distractions, and predictable layout guides.',
        presets: { font: 'lexend', fontSize: 18, lineHeight: 1.85, letterSpacing: 0.05, bg: '#F8FAFF' },
    },
    visual: {
        title: 'Low Vision Mode',
        summary: 'High contrast text overlays, keyboard-first focus indicators, and custom zoom scale multipliers.',
        presets: { font: 'system', fontSize: 22, lineHeight: 2.2, letterSpacing: 0.06, bg: '#FFFFFF' },
    },
    anxiety: {
        title: 'Anxiety-Friendly',
        summary: 'Calming soft palettes, no timed test pressure, encouraging prompts, and calm meditation breathing guides.',
        presets: { font: 'system', fontSize: 18, lineHeight: 1.8, letterSpacing: 0.03, bg: '#FAF0E6' },
    },
    slow: {
        title: 'Slow Learning',
        summary: 'Spaced review cycles, step-by-step repetition, vocabulary matches, and memory reinforcements.',
        presets: { font: 'system', fontSize: 18, lineHeight: 1.9, letterSpacing: 0.04, bg: '#FFFFFF' },
    },
    sensory: {
        title: 'Sensory Sensitive',
        summary: 'Muted grey/mint backgrounds, disabled animations, flat graphics, and silent study ambiance.',
        presets: { font: 'system', fontSize: 17, lineHeight: 1.8, letterSpacing: 0.02, bg: '#E6F0EC' },
    },
    custom: {
        title: 'Custom Profile',
        summary: 'Blend and configure settings according to your individual cognitive preference.',
        presets: { font: 'system', fontSize: 18, lineHeight: 1.8, letterSpacing: 0.04, bg: '#FFFFFF' },
    },
}

export default function PersonalizePage() {
    const router = useRouter()
    const [step, setStep] = useState<'welcome' | 'questions' | 'profiles' | 'analyzing'>('welcome')
    const [selectedProfile, setSelectedProfile] = useState<ProfileKey>('dyslexia')
    const [analysisProgress, setAnalysisProgress] = useState(0)
    const [analysisText, setAnalysisText] = useState('Initiating AI cognitive profiling...')
    const [name, setName] = useState('')
    const [age, setAge] = useState(9)
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [checkingUser, setCheckingUser] = useState(false)

    // Questionnaire State
    const [answers, setAnswers] = useState({
        learningStyle: 'Interactive',
        attentionSpan: 'Short burst (5-10m)',
        sensorySensitivity: 'Low distraction / Soft colors',
        socialComfort: 'Solo space',
        focusTiming: 'Night focus',
        stressLevel: 'Mildly anxious',
        favoriteSubject: 'Science & Environment',
        goals: 'Improve memory',
        difficulty: 'Gentle starter',
        pace: 'Self-paced',
        motivation: 'Unlockable achievements',
        communication: 'Visual emoji cues'
    })

    const [chapters, setChapters] = useState<any[]>([])
    const [loadingChapters, setLoadingChapters] = useState(true)

    // Load name and textbooks from server on mount
    useEffect(() => {
        const savedName = localStorage.getItem('neuroadapt_student_name')
        if (savedName) setName(savedName)

        const fetchChapters = async () => {
            try {
                const res = await fetch('/api/chapters')
                if (res.ok) {
                    const list = await res.json()
                    setChapters(list)
                }
            } catch (err) {
                console.error('Error fetching chapters:', err)
            } finally {
                setLoadingChapters(false)
            }
        }
        fetchChapters()
    }, [])

    // Simulated AI Synthesis Progression
    useEffect(() => {
        if (step === 'analyzing') {
            const interval = setInterval(() => {
                setAnalysisProgress((p) => {
                    if (p >= 100) {
                        clearInterval(interval)
                        setTimeout(() => {
                            setStep('profiles')
                        }, 800)
                        return 100
                    }
                    const next = p + 4
                    if (next === 24) setAnalysisText('Mapping attention profiles (ADHD preset matching)...')
                    if (next === 48) setAnalysisText('Analyzing sensory thresholds (Autism low-motion check)...')
                    if (next === 72) setAnalysisText('Customizing typography templates (Dyslexia OpenDyslexic match)...')
                    if (next === 92) setAnalysisText('Generating study schedules & routine planners...')
                    return next
                })
            }, 100)
            return () => clearInterval(interval)
        }
    }, [step])

    // Save profile and redirect to dashboard
    const handleSaveProfile = async (profile: ProfileKey) => {
        const studentId = `student-${Date.now()}`
        const trimmedName = name.trim() || 'New Student'
        localStorage.setItem('neuroadapt_profile', profile)
        localStorage.setItem('neuroadapt_student_id', studentId)
        localStorage.setItem('neuroadapt_student_name', trimmedName)

        // Store customized parameters in student preferences
        const profilePresets = PROFILES[profile].presets
        const savedPrefs = {
            font: profilePresets.font as any,
            fontSize: profilePresets.fontSize as number,
            lineHeight: profilePresets.lineHeight as number,
            letterSpacing: profilePresets.letterSpacing as number,
            background: (profile === 'visual' ? 'white' : profile === 'dyslexia' ? 'cream' : profile === 'autism' ? 'blue' : profile === 'sensory' ? 'sensory' : profile === 'anxiety' ? 'warm' : 'white') as any,
            showRuler: profile !== 'sensory',
            ttsSpeed: 1,
            ttsAutoPlay: profile === 'dyslexia' || profile === 'visual',
            contrast: profile === 'visual' ? 'high' : 'standard',
            motion: (profile === 'sensory' || profile === 'anxiety') ? 'reduced' : 'normal'
        }
        localStorage.setItem('neuroadapt_student_prefs', JSON.stringify(savedPrefs))

        // Register this user so they can return without re-assessment
        const userKey = trimmedName.toLowerCase().replace(/\s+/g, '_')
        const storedUsers = JSON.parse(localStorage.getItem('neuroadapt_users') || '{}')
        const customPrefsForStore = savedPrefs

        // Save behavioral parameters
        const customMetrics = {
            attentionSpanSec: profile === 'adhd' ? 120 : profile === 'slow' ? 180 : 300,
            readingWpm: profile === 'dyslexia' ? 140 : profile === 'slow' ? 120 : 200,
            focusDurationSec: 240,
            mistakesPerQuiz: profile === 'slow' ? 3 : 1,
            recentStress: profile === 'anxiety' ? 0.6 : 0.2,
            completedLessons: 1,
            focusCoins: 10,
            xpPoints: 45
        }
        localStorage.setItem('neuroadapt_behavior_metrics', JSON.stringify(customMetrics))

        // Persist user record for future logins (skip assessment)
        storedUsers[userKey] = {
            studentId,
            name: trimmedName,
            age,
            password,
            profile,
            metrics: customMetrics,
            prefs: customPrefsForStore
        }
        localStorage.setItem('neuroadapt_users', JSON.stringify(storedUsers))

        // Call server API to register the student
        try {
            await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: studentId,
                    name: name.trim() || 'New Student',
                    age: age || 9,
                    profile: PROFILES[profile].title,
                    metrics: customMetrics
                })
            })
            console.log('Successfully registered student profile on server.')
        } catch (e) {
            console.error('Failed to register student on server database:', e)
        }

        // Redirect
        router.push('/dashboard')
    }

    const handleStartAssessment = () => {
        if (!name.trim()) {
            setLoginError('Please enter your name.')
            return
        }
        if (!password.trim() || password.length < 4) {
            setLoginError('Please enter a password (at least 4 characters).')
            return
        }
        setLoginError('')
        setCheckingUser(true)

        // Check if this name+password combo is a returning user
        const storedUsers = JSON.parse(localStorage.getItem('neuroadapt_users') || '{}')
        const userKey = name.trim().toLowerCase().replace(/\s+/g, '_')

        if (storedUsers[userKey]) {
            // Returning user — verify password
            if (storedUsers[userKey].password === password) {
                // Restore their session and go straight to dashboard
                localStorage.setItem('neuroadapt_student_id', storedUsers[userKey].studentId)
                localStorage.setItem('neuroadapt_student_name', storedUsers[userKey].name)
                localStorage.setItem('neuroadapt_profile', storedUsers[userKey].profile)
                if (storedUsers[userKey].metrics) {
                    localStorage.setItem('neuroadapt_behavior_metrics', JSON.stringify(storedUsers[userKey].metrics))
                }
                if (storedUsers[userKey].prefs) {
                    localStorage.setItem('neuroadapt_student_prefs', JSON.stringify(storedUsers[userKey].prefs))
                }
                setCheckingUser(false)
                router.push('/dashboard')
            } else {
                setLoginError('Incorrect password. Please try again.')
                setCheckingUser(false)
            }
        } else {
            // New user — proceed to assessment
            setCheckingUser(false)
            setStep('questions')
        }
    }

    return (
        <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-50 via-sky-50 to-indigo-50 py-10 px-4 sm:px-6">
            {/* Calming Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-200/40 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky-200/40 blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />

            <AccessibilityToolbar />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* 1. Welcome Screen */}
                {step === 'welcome' && (
                    <div className="max-w-2xl mx-auto mt-12 text-center bg-white/70 backdrop-blur-xl border border-white p-8 sm:p-12 rounded-[40px] shadow-2xl flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-4xl shadow-lg shadow-violet-200/50 animate-bounce">
                            🧠
                        </div>
                        <div className="space-y-2">
                            <span className="bg-violet-100/90 text-violet-700 text-xs font-bold px-3 py-1 rounded-full border border-violet-200 uppercase tracking-widest">
                                NeuroAdapt Studio
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                                Let’s build a learning journey made for YOU.
                            </h1>
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                                Welcome! Every brain learns differently. We customize layouts, font weights, colors, tools, and visual pacing to keep you feeling calm, focused, and confident.
                            </p>
                        </div>

                        {/* Onboarding Inputs */}
                        <div className="w-full space-y-3 text-left">
                            {/* Name + Age row */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="sm:col-span-3 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name (e.g. Rohan Sharma)"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setLoginError('') }}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Age</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="18"
                                        value={age}
                                        onChange={(e) => setAge(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Password row */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                    Password
                                    <span className="ml-2 font-normal text-slate-400 normal-case">
                                        (returning students: enter your password to skip assessment)
                                    </span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="Create or enter your password (min 4 characters)"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                                />
                            </div>

                            {/* Error message */}
                            {loginError && (
                                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 text-xs text-rose-700 font-semibold">
                                    <span>⚠️</span> {loginError}
                                </div>
                            )}
                        </div>

                        {/* Teacher textbooks preview */}
                        <div className="w-full border-t border-slate-100 pt-5 text-left">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                📖 Classroom Textbooks Available
                            </h3>
                            {loadingChapters ? (
                                <p className="text-xs text-slate-400">Loading curriculum chapters...</p>
                            ) : chapters.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center">
                                    <p className="text-xs text-slate-500 font-medium">No textbook chapters uploaded by the teacher yet.</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Chapters uploaded by your teacher in the dashboard will appear here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto pr-1">
                                    {chapters.map((ch) => (
                                        <div
                                            key={ch.chapter_id}
                                            className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 flex items-center justify-between text-xs hover:border-violet-200 transition"
                                        >
                                            <div className="truncate pr-2">
                                                <span className="text-[9px] font-bold text-violet-500 uppercase block tracking-wider leading-none mb-0.5">{ch.subject}</span>
                                                <span className="font-semibold text-slate-700 block truncate">{ch.title}</span>
                                            </div>
                                            <span className="text-[9px] font-bold bg-white text-slate-500 border px-2 py-0.5 rounded-full shrink-0">
                                                Class {ch.class_level}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-full rounded-2xl bg-violet-50 border border-violet-100 p-4 text-left flex gap-3 text-xs text-slate-700">
                            <span className="text-lg">👋</span>
                            <div>
                                <span className="font-bold text-slate-900 block">A message from Nova (your AI Companion):</span>
                                "Take your time responding. There are no correct answers. We are just seeking to understand how you feel comfortable studying!"
                            </div>
                        </div>

                        <button
                            onClick={handleStartAssessment}
                            disabled={checkingUser}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-violet-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {checkingUser ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    Checking...
                                </>
                            ) : (
                                'Continue →'
                            )}
                        </button>
                    </div>
                )}

                {/* 2. Questionnaire Steps */}
                {step === 'questions' && (
                    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 sm:p-10 rounded-[40px] shadow-2xl space-y-6">
                        <div>
                            <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Step 2 of 4</span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Cognitive Style & Comfort Assessment</h2>
                            <p className="text-xs sm:text-sm text-slate-500">Pick the options that best match your comfort levels.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {/* Learning Style */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Preferred Learning Style</label>
                                <select
                                    value={answers.learningStyle}
                                    onChange={(e) => setAnswers({ ...answers, learningStyle: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-violet-500"
                                >
                                    <option>Visual (Maps & Infographics)</option>
                                    <option>Audio (TTS & Read-alouds)</option>
                                    <option>Reading/Writing (Text outlines)</option>
                                    <option>Interactive (Matching blocks)</option>
                                    <option>Gamified (XP & Challenges)</option>
                                </select>
                            </div>

                            {/* Attention span */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Attention Rhythm</label>
                                <select
                                    value={answers.attentionSpan}
                                    onChange={(e) => setAnswers({ ...answers, attentionSpan: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-violet-500"
                                >
                                    <option>Short burst (5-10m)</option>
                                    <option>Standard focus (15-25m)</option>
                                    <option>Self-paced blocks (unlimited)</option>
                                </select>
                            </div>

                            {/* Sensory preferences */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Sensory Settings</label>
                                <select
                                    value={answers.sensorySensitivity}
                                    onChange={(e) => setAnswers({ ...answers, sensorySensitivity: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-violet-500"
                                >
                                    <option>Low distraction / Soft colors</option>
                                    <option>High contrast / Large fonts</option>
                                    <option>Plain layouts / Muted design</option>
                                    <option>Vibrant / High animations</option>
                                </select>
                            </div>

                            {/* Focus Timing */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">4. Best Time to Study</label>
                                <select
                                    value={answers.focusTiming}
                                    onChange={(e) => setAnswers({ ...answers, focusTiming: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-violet-500"
                                >
                                    <option>Morning energy (8 AM)</option>
                                    <option>Afternoon study (3 PM)</option>
                                    <option>Night focus (8 PM)</option>
                                </select>
                            </div>

                            {/* Stress level */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">5. Stress & Anxiety Sensitivity</label>
                                <select
                                    value={answers.stressLevel}
                                    onChange={(e) => setAnswers({ ...answers, stressLevel: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-violet-500"
                                >
                                    <option>Relaxed / Calm focus</option>
                                    <option>Mildly anxious (No-timers preferred)</option>
                                    <option>Overwhelmed easily (Breathing breaks)</option>
                                </select>
                            </div>

                            {/* Favorite Subjects */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">6. Primary Subjects</label>
                                <select
                                    value={answers.favoriteSubject}
                                    onChange={(e) => setAnswers({ ...answers, favoriteSubject: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-violet-500"
                                >
                                    <option>Science & Environment</option>
                                    <option>Mathematics & Fractions</option>
                                    <option>Languages & Reading</option>
                                    <option>History & Geography</option>
                                </select>
                            </div>

                            {/* Difficulty */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">7. Difficulty Goal</label>
                                <select
                                    value={answers.difficulty}
                                    onChange={(e) => setAnswers({ ...answers, difficulty: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-violet-500"
                                >
                                    <option>Gentle starter</option>
                                    <option>Moderate challenges</option>
                                    <option>Advanced/Deeper dives</option>
                                </select>
                            </div>

                            {/* Motivation */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">8. Motivation Trigger</label>
                                <select
                                    value={answers.motivation}
                                    onChange={(e) => setAnswers({ ...answers, motivation: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-violet-500"
                                >
                                    <option>Unlockable achievements</option>
                                    <option>XP points & Levels</option>
                                    <option>Quiet progress gardens</option>
                                    <option>No-gamification (plain stats)</option>
                                </select>
                            </div>

                            {/* Communication style */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">9. UI Signals Preference</label>
                                <select
                                    value={answers.communication}
                                    onChange={(e) => setAnswers({ ...answers, communication: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-violet-500"
                                >
                                    <option>Visual emoji cues</option>
                                    <option>Plain textual directions</option>
                                    <option>Voice narrator guides</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 border-t border-slate-100 pt-6">
                            <button
                                onClick={() => setStep('welcome')}
                                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep('analyzing')}
                                className="flex-1 sm:flex-initial px-10 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-violet-100 transition"
                            >
                                Analyze & Generate Profile
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. AI Synthesizing Loader */}
                {step === 'analyzing' && (
                    <div className="max-w-md mx-auto mt-12 bg-white/80 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-2xl flex flex-col items-center gap-6">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                            {/* Spinning circle */}
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-violet-600 animate-spin" />
                            <span className="text-3xl animate-pulse">⚡</span>
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold text-slate-900">AI Profile Generation</h2>
                            <p className="text-xs font-medium text-violet-600 h-10 flex items-center justify-center px-4">
                                {analysisText}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full space-y-1">
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                    className="h-full bg-violet-600 transition-all duration-300"
                                    style={{ width: `${analysisProgress}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-slate-400 block text-right font-bold">{analysisProgress}% Complete</span>
                        </div>
                    </div>
                )}

                {/* 4. Profile Results Studio */}
                {step === 'profiles' && (
                    <div className="space-y-6">
                        <div className="bg-white/50 backdrop-blur-md p-6 rounded-[30px] border border-white/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="bg-violet-100/90 text-violet-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-violet-200 uppercase tracking-widest">
                                    AI Profiler Recommendation
                                </span>
                                <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Your Personalized Learning Space</h2>
                                <p className="text-xs sm:text-sm text-slate-600">
                                    Our engine suggests the profile below based on your answers. You can choose any profile to test it, then click "Apply Profile" to proceed to your dashboard.
                                </p>
                            </div>
                            <Link href="/" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-violet-300 transition">
                                Exit Studio
                            </Link>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
                            {/* Profiles Column */}
                            <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-[32px] shadow-lg flex flex-col gap-4">
                                <div className="border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-800">Available Learning Formats</span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Click a card to load the real-time preview style.</p>
                                </div>

                                <div className="grid gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
                                    {(Object.keys(PROFILES) as ProfileKey[]).map((key) => (
                                        <ProfileCard
                                            key={key}
                                            title={PROFILES[key].title}
                                            summary={PROFILES[key].summary}
                                            active={selectedProfile === key}
                                            onHover={() => setSelectedProfile(key)}
                                            onClick={() => setSelectedProfile(key)}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleSaveProfile(selectedProfile)}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-violet-100 transition-all mt-2"
                                >
                                    Apply Profile & Enter Dashboard
                                </button>
                            </div>

                            {/* Interactive Preview Column */}
                            <div className="space-y-4">
                                <LivePreview profileKey={selectedProfile} presets={PROFILES[selectedProfile].presets} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
