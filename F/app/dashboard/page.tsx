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

const PROFILE_DETAILS: Record<ProfileKey, { title: string; desc: string; icon: string; theme: string; presets: string[] }> = {
    dyslexia: {
        title: 'Dyslexia Mode',
        desc: 'Custom dyslexic-friendly font spacing, line focus ruler, and text-to-speech read-aloud support.',
        icon: '📖',
        theme: 'bg-amber-50 border-amber-200 text-amber-800',
        presets: ['Lexend/Clean typography', 'Letter-spacing scale', 'Line focus ruler', 'Narrator voice']
    },
    adhd: {
        title: 'ADHD Mode',
        desc: 'Visual progress trackers, double coin rewards, rest breaks, and active study cues.',
        icon: '⚡',
        theme: 'bg-sky-50 border-sky-200 text-sky-800',
        presets: ['Gamified coins & XP', 'Double coin challenges', 'Pomodoro rest breaks', 'Interactive guides']
    },
    autism: {
        title: 'Autism Mode',
        desc: 'Structured chapter maps, clear step guides, and minimal motion animations.',
        icon: '🧩',
        theme: 'bg-blue-50 border-blue-200 text-blue-800',
        presets: ['Predictable schedule', 'Step-by-step progress', 'Flat layouts', 'Reduced motion']
    },
    visual: {
        title: 'Low Vision Mode',
        desc: 'Magnified typography, high contrast dark/light themes, and screen reader narrator.',
        icon: '🔍',
        theme: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        presets: ['24px font size scale', 'High contrast layout', 'TTS voice playback', 'Large UI controls']
    },
    anxiety: {
        title: 'Calming Mode',
        desc: 'Stress-free environment, no timed test pressure, warm anti-glare screen, and breathing breaks.',
        icon: '🕊️',
        theme: 'bg-rose-50 border-rose-200 text-rose-800',
        presets: ['Untimed worksheets', 'Warm anti-glare backdrop', 'Nova AI encouragement', 'Calm breathing overlay']
    },
    sensory: {
        title: 'Sensory Sensitive',
        desc: 'Muted grey/mint palettes, zero visual decorations, and silent study ambiance.',
        icon: '💤',
        theme: 'bg-slate-50 border-slate-200 text-slate-800',
        presets: ['Muted gray colors', 'Flat non-glare designs', 'Disabled audio alerts', 'Minimal widgets']
    },
    slow: {
        title: 'Spaced Review',
        desc: 'Reinforced concept loops, vocabulary checks, and repetition cycles for retention.',
        icon: '🔁',
        theme: 'bg-teal-50 border-teal-200 text-teal-800',
        presets: ['Concept repeat cards', 'Flashcards summary', 'Spaced review tasks', 'Glossary reinforcement']
    },
    custom: {
        title: 'Custom Profile',
        desc: 'Individually fine-tuned font spacing, weights, colors, and accessibility settings.',
        icon: '⚙️',
        theme: 'bg-violet-50 border-violet-200 text-violet-800',
        presets: ['Adjustable spacing', 'Selected custom font', 'Toggled screen ruler', 'Custom voice speed']
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
    const [activeProfileTab, setActiveProfileTab] = useState<ProfileKey>('dyslexia')

    // Quiz State
    const [quizActive, setQuizActive] = useState(false)
    const [selectedQuizChapter, setSelectedQuizChapter] = useState<ChapterData | null>(null)
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
    const [quizQuestions, setQuizQuestions] = useState<any[]>([])
    const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null)
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
    const [quizSubmitted, setQuizSubmitted] = useState(false)
    const [quizFinished, setQuizFinished] = useState(false)
    const [quizScore, setQuizScore] = useState(0)

    // Load user configuration
    useEffect(() => {
        const savedName = localStorage.getItem('neuroadapt_student_name')
        const savedProfile = localStorage.getItem('neuroadapt_profile') as ProfileKey
        const savedMetricsStr = localStorage.getItem('neuroadapt_behavior_metrics')

        if (savedName) setName(savedName)
        if (savedProfile) {
            setProfile(savedProfile)
            setActiveProfileTab(savedProfile)
        }

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

    // Dynamic Quiz generation helper
    const startChapterQuiz = (chapter: ChapterData) => {
        // If chapter has pre-generated quiz questions from the backend, use them directly!
        if (chapter.quiz_questions && chapter.quiz_questions.length > 0) {
            setSelectedQuizChapter(chapter)
            setQuizQuestions(chapter.quiz_questions.slice(0, 3))
            setCurrentQuestionIdx(0)
            setSelectedOptionIdx(null)
            setQuizAnswers({})
            setQuizSubmitted(false)
            setQuizFinished(false)
            setQuizScore(0)
            setQuizActive(true)
            return
        }

        const glossaryTerms: { term: string; definition: string }[] = []
        const facts: string[] = []

        chapter.chunks.forEach(chunk => {
            if (chunk.glossary) {
                Object.entries(chunk.glossary).forEach(([term, definition]) => {
                    glossaryTerms.push({ term, definition })
                })
            }
            if (chunk.core_facts) {
                chunk.core_facts.forEach(fact => {
                    facts.push(fact)
                })
            }
        })

        const questions: any[] = []

        // 1. Term question
        if (glossaryTerms.length > 0) {
            const item = glossaryTerms[Math.floor(Math.random() * glossaryTerms.length)]
            const distractors = glossaryTerms
                .filter(t => t.term !== item.term)
                .map(t => t.definition)
                .slice(0, 3)
            while (distractors.length < 3) {
                distractors.push(`An essential term representing physical elements in class standard curriculum.`)
                distractors.push(`The specific process rate used to identify structural chapter items.`)
                distractors.push(`A core properties measurement mapped to adaptive class lessons.`)
            }
            const options = [item.definition, ...distractors].sort(() => Math.random() - 0.5)
            const correctIndex = options.indexOf(item.definition)

            questions.push({
                question: `What does the term "${item.term}" mean in this chapter?`,
                options,
                correctIndex,
                explanation: `Correct! "${item.term}" is defined as: ${item.definition}`
            })
        }

        // 2. Fact question
        if (facts.length > 0) {
            const correctFact = facts[Math.floor(Math.random() * facts.length)]
            const distractors = [
                "It is a chemical sequence that only triggers inside vacuum space chambers.",
                "It has no dynamic interaction with ecosystem structures or living things.",
                "It was completely disproven by modern scientific textbook research.",
                "It has static values that only respond at absolute zero conditions."
            ].sort(() => Math.random() - 0.5).slice(0, 3)

            const options = [correctFact, ...distractors].sort(() => Math.random() - 0.5)
            const correctIndex = options.indexOf(correctFact)

            questions.push({
                question: `Which of the following is a true statement about "${chapter.title}"?`,
                options,
                correctIndex,
                explanation: `Correct! The textbook teaches: ${correctFact}`
            })
        }

        // 3. Fallback questions
        while (questions.length < 3) {
            const idx = questions.length + 1
            const generalQuestions = [
                {
                    question: `What is the primary benefit of the line focus ruler in Dyslexia Mode?`,
                    options: [
                        "It masks out surrounding sentences to prevent letter-crowding eye strain.",
                        "It reads the entire paragraph in high-speed text narration.",
                        "It automatically rewrites the chapter in simple phrases.",
                        "It adds unlockable achievements to your study profile stats."
                    ],
                    correctIndex: 0,
                    explanation: "Correct! The line focus ruler helps narrow focus, preventing letters from crowding together while reading."
                },
                {
                    question: `Why does breaking lesson text into small chunks help retain facts?`,
                    options: [
                        "It prevents cognitive overload and supports active study breaks.",
                        "It shortens textbook documents to save browser printing size.",
                        "It hides complex math equations from the dashboard grid.",
                        "It has no measurable influence on learning rates."
                    ],
                    correctIndex: 0,
                    explanation: "Correct! Chunking text lets the brain review, process, and consolidate key details step-by-step."
                }
            ]
            questions.push(generalQuestions[idx % generalQuestions.length])
        }

        setSelectedQuizChapter(chapter)
        setQuizQuestions(questions.slice(0, 3))
        setCurrentQuestionIdx(0)
        setSelectedOptionIdx(null)
        setQuizAnswers({})
        setQuizSubmitted(false)
        setQuizFinished(false)
        setQuizScore(0)
        setQuizActive(true)
    }

    const handleOptionSelect = (optIdx: number) => {
        if (quizSubmitted) return
        setSelectedOptionIdx(optIdx)
    }

    const handleQuizSubmit = () => {
        if (selectedOptionIdx === null || quizSubmitted) return
        
        const updatedAnswers = { ...quizAnswers, [currentQuestionIdx]: selectedOptionIdx }
        setQuizAnswers(updatedAnswers)
        setQuizSubmitted(true)
    }

    const handleQuizNext = () => {
        if (currentQuestionIdx < quizQuestions.length - 1) {
            setCurrentQuestionIdx(p => p + 1)
            setSelectedOptionIdx(quizAnswers[currentQuestionIdx + 1] ?? null)
            setQuizSubmitted(false)
        } else {
            // Calculate final score
            let finalScore = 0
            quizQuestions.forEach((q, idx) => {
                if (quizAnswers[idx] === q.correctIndex) {
                    finalScore++
                }
            })
            setQuizScore(finalScore)
            setQuizFinished(true)

            // Reward Coins & XP
            const addedXP = finalScore * 15
            const addedCoins = finalScore * 3

            const newXP = metrics.xpPoints + addedXP
            const newCoins = metrics.focusCoins + addedCoins
            const newLessons = metrics.completedLessons + (finalScore >= 2 ? 1 : 0)

            const updatedMetrics = {
                focusCoins: newCoins,
                xpPoints: newXP,
                completedLessons: newLessons
            }
            setMetrics(updatedMetrics)

            // Persist back to storage
            localStorage.setItem('neuroadapt_behavior_metrics', JSON.stringify({
                attentionSpanSec: profile === 'adhd' ? 120 : 300,
                readingWpm: profile === 'dyslexia' ? 140 : 200,
                focusDurationSec: 240,
                mistakesPerQuiz: 3 - finalScore,
                recentStress: 0.1,
                completedLessons: newLessons,
                focusCoins: newCoins,
                xpPoints: newXP
            }))

            // Update user registry record
            try {
                const userKey = name.toLowerCase().replace(/\s+/g, '_')
                const storedUsers = JSON.parse(localStorage.getItem('neuroadapt_users') || '{}')
                if (storedUsers[userKey]) {
                    storedUsers[userKey].metrics = {
                        ...storedUsers[userKey].metrics,
                        xpPoints: newXP,
                        focusCoins: newCoins,
                        completedLessons: newLessons
                    }
                    localStorage.setItem('neuroadapt_users', JSON.stringify(storedUsers))
                }
            } catch (e) {}
        }
    }

    // Determine focus garden growth stage
    const xp = metrics.xpPoints
    let gardenStageIcon = '🌱'
    let gardenLabel = 'Stage 1: Seedling'
    let progress = Math.min(100, Math.round((xp / 50) * 100))
    let nextStage = 'Sprout (50 XP)'
    let stageGlow = 'shadow-violet-200 border-violet-100 bg-violet-50/50'

    if (xp >= 100) {
        gardenStageIcon = '🌳'
        gardenLabel = 'Stage 3: Blossomed Oak'
        progress = 100
        nextStage = 'Max Level Reached!'
        stageGlow = 'shadow-yellow-200 border-amber-200 bg-amber-50/40'
    } else if (xp >= 50) {
        gardenStageIcon = '🌿'
        gardenLabel = 'Stage 2: Bonsai Sprout'
        progress = Math.min(100, Math.round(((xp - 50) / 50) * 100))
        nextStage = 'Mature Oak (100 XP)'
        stageGlow = 'shadow-emerald-200 border-emerald-200 bg-emerald-50/40'
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
                        {/* Active Cognitive Profile Card */}
                        <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-md space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Selected Layout Profile</h3>
                            
                            <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${PROFILE_DETAILS[profile]?.theme || 'bg-violet-50 border-violet-100 text-violet-800'}`}>
                                <span className="text-3xl shrink-0 mt-0.5">{PROFILE_DETAILS[profile]?.icon || '⚙️'}</span>
                                <div className="space-y-1">
                                    <h4 className="font-black text-sm">{PROFILE_DETAILS[profile]?.title || 'Dyslexia Mode'}</h4>
                                    <p className="text-xs opacity-90 leading-relaxed font-medium">
                                        {PROFILE_DETAILS[profile]?.desc || 'Layout optimizations enabled.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Focus Garden Progress Card */}
                        <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-md space-y-5">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">My Focus Garden</h3>
                            
                            {/* Visual Tree with dynamic glow */}
                            <div className={`flex flex-col items-center py-4 rounded-2xl border shadow-inner transition-all duration-700 ${stageGlow}`}>
                                <span className="text-6xl animate-bounce duration-[4000ms]">{gardenStageIcon}</span>
                                <span className="text-xs font-black text-slate-700 mt-2">{gardenLabel}</span>
                            </div>

                            {/* Stat Coins & XP */}
                            <div className="grid grid-cols-2 gap-3.5">
                                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3 text-center">
                                    <span className="text-lg">🪙</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Focus Coins</p>
                                    <p className="text-xl font-black text-amber-800">{metrics.focusCoins}</p>
                                </div>
                                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3 text-center">
                                    <span className="text-lg">⚡</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">XP Earned</p>
                                    <p className="text-xl font-black text-indigo-800">{metrics.xpPoints}</p>
                                </div>
                            </div>

                            {/* Level Up Progress */}
                            {xp < 100 && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>Growth Status:</span>
                                        <span>{nextStage}</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (AR Launch + Textbook list) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Relocated AR PDF Viewer Card */}
                        <div
                            className="rounded-3xl overflow-hidden relative"
                            style={{
                                background: 'linear-gradient(135deg, #1b0c33 0%, #0d1233 60%, #001233 100%)',
                                border: '1px solid rgba(139,92,246,0.3)',
                                boxShadow: '0 8px 30px rgba(139,92,246,0.15)',
                            }}
                        >
                            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
                            <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)' }} />

                            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
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

                        {/* Classroom Textbooks Section with Integrated Quizzes */}
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

                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/student/${ch.chapter_id}`}
                                                    className="flex-1 text-center py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1"
                                                >
                                                    Read 📖
                                                </Link>
                                                <button
                                                    onClick={() => startChapterQuiz(ch)}
                                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1"
                                                >
                                                    Quiz 📝
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Interactive Profiles Exploration Deck */}
                <section className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-md space-y-5">
                    <div className="text-left space-y-1">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <span>🧠</span> Explore Cognitive Tool Configurations
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Click on any profile tab below to see how our reading interface adapts presets to target specific learning rhythms:
                        </p>
                    </div>

                    {/* Tab controls */}
                    <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                        {(Object.keys(PROFILE_DETAILS) as ProfileKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setActiveProfileTab(key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    activeProfileTab === key
                                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-100'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                                }`}
                            >
                                {PROFILE_DETAILS[key].icon} {PROFILE_DETAILS[key].title}
                            </button>
                        ))}
                    </div>

                    {/* Active profile review card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-left">
                        <div className="md:col-span-1 space-y-2.5">
                            <span className="text-4xl">{PROFILE_DETAILS[activeProfileTab].icon}</span>
                            <h4 className="text-lg font-black text-slate-800">{PROFILE_DETAILS[activeProfileTab].title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                {PROFILE_DETAILS[activeProfileTab].desc}
                            </p>
                        </div>
                        <div className="md:col-span-2 space-y-3 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                            <h5 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Activated Preset Settings:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {PROFILE_DETAILS[activeProfileTab].presets.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                                        <span className="text-emerald-500 text-base">✓</span>
                                        <span>{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ─── Interactive Quiz Modal ─── */}
            {quizActive && selectedQuizChapter && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white/95 border border-white max-w-xl w-full p-6 sm:p-8 rounded-[32px] shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                        
                        {/* Close button */}
                        <button
                            onClick={() => setQuizActive(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"
                        >
                            ✕
                        </button>

                        {!quizFinished ? (
                            <>
                                {/* Quiz Header */}
                                <div className="space-y-1 text-left">
                                    <span className="text-[10px] font-black bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">
                                        Active Quiz • {selectedQuizChapter.title}
                                    </span>
                                    <h3 className="text-xl font-black text-slate-800 mt-2">
                                        Question {currentQuestionIdx + 1} of {quizQuestions.length}
                                    </h3>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-300"
                                            style={{ width: `${((currentQuestionIdx + 1) / quizQuestions.length) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Question text */}
                                <p className="text-sm font-extrabold text-slate-800 text-left leading-relaxed">
                                    {quizQuestions[currentQuestionIdx]?.question}
                                </p>

                                {/* Options list */}
                                <div className="space-y-2.5">
                                    {quizQuestions[currentQuestionIdx]?.options.map((option: string, optIdx: number) => {
                                        let optClass = "border-slate-200 bg-white hover:border-violet-300"
                                        const isSelected = selectedOptionIdx === optIdx
                                        const isCorrect = optIdx === quizQuestions[currentQuestionIdx].correctIndex
                                        
                                        if (quizSubmitted) {
                                            if (isCorrect) {
                                                optClass = "border-emerald-500 bg-emerald-50/60 text-emerald-800 font-bold"
                                            } else if (isSelected) {
                                                optClass = "border-rose-400 bg-rose-50/60 text-rose-800"
                                            } else {
                                                optClass = "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60"
                                            }
                                        } else if (isSelected) {
                                            optClass = "border-violet-500 bg-violet-50/40 text-violet-800 font-bold"
                                        }

                                        return (
                                            <button
                                                key={optIdx}
                                                disabled={quizSubmitted}
                                                onClick={() => handleOptionSelect(optIdx)}
                                                className={`w-full text-left p-4 border rounded-2xl text-xs leading-relaxed transition-all flex items-start gap-3 ${optClass}`}
                                            >
                                                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                                                    {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span className="flex-1">{option}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Answer Explanation */}
                                {quizSubmitted && (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs text-slate-700 leading-relaxed font-semibold">
                                        💡 {quizQuestions[currentQuestionIdx]?.explanation}
                                    </div>
                                )}

                                {/* Action button */}
                                <div className="pt-2 flex justify-end">
                                    {!quizSubmitted ? (
                                        <button
                                            onClick={handleQuizSubmit}
                                            disabled={selectedOptionIdx === null}
                                            className="px-8 py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition"
                                        >
                                            Submit Answer ✓
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleQuizNext}
                                            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition"
                                        >
                                            {currentQuestionIdx < quizQuestions.length - 1 ? 'Next Question →' : 'See Results 📊'}
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Quiz finished page */
                            <div className="text-center py-6 space-y-6">
                                <div className="text-5xl animate-bounce">
                                    {quizScore === 3 ? '🏆' : quizScore >= 2 ? '🎉' : '🌱'}
                                </div>
                                
                                <div className="space-y-1.5">
                                    <h3 className="text-2xl font-black text-slate-800">Quiz Completed!</h3>
                                    <p className="text-xs font-bold text-slate-500">
                                        You scored <span className="text-emerald-600 font-extrabold text-base">{quizScore} / 3</span> on the "{selectedQuizChapter.title}" quiz.
                                    </p>
                                </div>

                                {/* Reward box */}
                                <div className="max-w-xs mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Study Rewards Earned:</h4>
                                    <div className="flex justify-around">
                                        <div className="flex items-center gap-1">
                                            <span className="text-base">🪙</span>
                                            <span className="text-sm font-black text-amber-700">+{quizScore * 3} Coins</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-base">⚡</span>
                                            <span className="text-sm font-black text-indigo-700">+{quizScore * 15} XP</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                                        Your focus tree in the garden has received this water.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setQuizActive(false)}
                                    className="w-full sm:w-auto px-10 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-2xl shadow-md transition"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* AR PDF Viewer Modal */}
            <ARPdfViewer
                isOpen={arViewerOpen}
                onClose={() => setArViewerOpen(false)}
                mode="student"
            />
        </main>
    )
}
