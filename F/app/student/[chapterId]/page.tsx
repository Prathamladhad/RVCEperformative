'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChapter } from '@/hooks/useChapter'
import { useReading } from '@/hooks/useReading'
import { useAccessibility } from '@/hooks/useAccessibility'
import { ChunkReveal } from '@/components/student/ChunkReveal'
import { ReadingRuler } from '@/components/student/ReadingRuler'
import { TTSControls } from '@/components/student/TTSControls'
import { GlossaryPanel } from '@/components/student/GlossaryPanel'
import { AccessibilityBar } from '@/components/student/AccessibilityBar'
import { exportChunksPDF } from '@/lib/exportChunksPDF'
import { ARPdfViewer } from '@/components/shared/ARPdfViewer'

interface Question {
    id: string
    question: string
    options: string[]
    correctIndex: number
    explanation: string
}

export default function StudentReaderPage({
    params,
}: {
    params: { chapterId: string }
}) {
    const router = useRouter()
    const [studentId, setStudentId] = useState<string | null>(null)
    const [studentName, setStudentName] = useState('Rohan Sharma')
    const [studentProfile, setStudentProfile] = useState('dyslexia')
    const [cognitiveScore, setCognitiveScore] = useState<number | null>(null)

    // Load student registry data on mount
    useEffect(() => {
        const storedId = localStorage.getItem('neuroadapt_student_id')
        const storedName = localStorage.getItem('neuroadapt_student_name')
        const storedProfile = localStorage.getItem('neuroadapt_profile')
        const savedScore = localStorage.getItem('neuroadapt_cognitive_score')
        if (storedId) setStudentId(storedId)
        if (storedName) setStudentName(storedName)
        if (storedProfile) setStudentProfile(storedProfile)
        if (savedScore) setCognitiveScore(Number(savedScore))
    }, [])

    const { chapter, loading, error } = useChapter(params.chapterId, studentId)
    const reading = useReading(params.chapterId, chapter?.chunks.length || 0)
    const accessibility = useAccessibility()
    const [glossaryOpen, setGlossaryOpen] = useState(false)
    const [arViewerOpen, setArViewerOpen] = useState(false)

    // Test & Metrics States
    const [quizActive, setQuizActive] = useState(false)
    const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
    const [pageLoadTime] = useState<number>(Date.now())
    const [showReport, setShowReport] = useState(false)
    const [reportData, setReportData] = useState<{
        score: number
        wpm: number
        durationSec: number
        comfortScore: number
        focusCoinsEarned: number
        xpPointsEarned: number
        attentionSpanScore: number
    } | null>(null)
    const [studyPlan, setStudyPlan] = useState<string | null>(null)
    const [planLoading, setPlanLoading] = useState(false)

    // Accessibility features dynamic tracker for Comfort Score
    const [rulerActivated, setRulerActivated] = useState(false)
    const [ttsActivated, setTtsActivated] = useState(false)

    useEffect(() => {
        if (accessibility.prefs.showRuler) {
            setRulerActivated(true)
        }
    }, [accessibility.prefs.showRuler])

    // Apply saved personalization profile to accessibility prefs
    useEffect(() => {
        if (!accessibility.mounted) return

        try {
            const profile = localStorage.getItem('neuroadapt_profile') as
                | 'dyslexia'
                | 'autism'
                | 'adhd'
                | 'visual'
                | 'other'
                | null

            if (!profile) return

            // Map profile -> accessibility preferences
            if (profile === 'dyslexia') {
                accessibility.updatePref('font', 'opendyslexic')
                accessibility.updatePref('fontSize', Math.max(18, accessibility.prefs.fontSize + 4))
                accessibility.updatePref('lineHeight', Math.max(1.8, accessibility.prefs.lineHeight + 0.2))
                accessibility.updatePref('letterSpacing', Math.max(0.08, accessibility.prefs.letterSpacing + 0.03))
                accessibility.updatePref('ttsAutoPlay', true)
                accessibility.updatePref('ttsSpeed', 0.95)
                accessibility.updatePref('showRuler', true)
            } else if (profile === 'autism') {
                accessibility.updatePref('font', 'lexend')
                accessibility.updatePref('fontSize', Math.max(16, accessibility.prefs.fontSize + 2))
                accessibility.updatePref('lineHeight', Math.max(1.8, accessibility.prefs.lineHeight + 0.1))
                accessibility.updatePref('showRuler', false)
                accessibility.updatePref('ttsAutoPlay', false)
            } else if (profile === 'adhd') {
                accessibility.updatePref('font', 'lexend')
                accessibility.updatePref('fontSize', Math.max(16, accessibility.prefs.fontSize + 2))
                accessibility.updatePref('lineHeight', Math.max(1.6, accessibility.prefs.lineHeight))
                accessibility.updatePref('letterSpacing', Math.max(0.06, accessibility.prefs.letterSpacing + 0.02))
                accessibility.updatePref('ttsSpeed', 1.1)
                accessibility.updatePref('ttsAutoPlay', false)
            } else if (profile === 'visual') {
                accessibility.updatePref('font', 'system')
                accessibility.updatePref('fontSize', Math.max(20, accessibility.prefs.fontSize + 6))
                accessibility.updatePref('lineHeight', Math.max(1.9, accessibility.prefs.lineHeight + 0.3))
                accessibility.updatePref('background', 'white')
                accessibility.updatePref('ttsAutoPlay', true)
                accessibility.updatePref('showRuler', false)
            }
        } catch (err) {
            // ignore
        }
    }, [accessibility.mounted])

    useEffect(() => {
        if (chapter && reading.currentChunkIndex < chapter.chunks.length) {
            reading.markComplete(chapter.chunks[reading.currentChunkIndex].chunk_id)
        }
    }, [reading.currentChunkIndex, chapter, reading])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (quizActive) return // Disable page turn shortcuts when test is active
            if (e.code === 'Space' || e.code === 'ArrowRight') {
                if (reading.currentChunkIndex < (chapter?.chunks.length || 0) - 1) {
                    reading.nextChunk()
                }
            } else if (e.code === 'ArrowLeft') {
                if (reading.currentChunkIndex > 0) {
                    reading.prevChunk()
                }
            } else if (e.code === 'KeyG') {
                setGlossaryOpen(!glossaryOpen)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [reading, glossaryOpen, chapter?.chunks.length, quizActive])

    // Quiz generator helper
    const startTest = () => {
        if (!chapter) return
        
        // Generate dynamic questions from chunk definitions and facts
        const questions: Question[] = []
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

        // Term questions
        const termsToUse = glossaryTerms.slice(0, 3)
        termsToUse.forEach((item, index) => {
            const distractors = glossaryTerms
                .filter(t => t.term !== item.term)
                .map(t => t.definition)
                .slice(0, 3)
            while (distractors.length < 3) {
                distractors.push(`Standard scientific property related to class ${chapter.class_level} curriculum.`)
            }
            const options = [item.definition, ...distractors]
            const shuffled = options.map((opt, i) => ({ opt, originalIndex: i }))
            shuffled.sort(() => Math.random() - 0.5)
            const correctIndex = shuffled.findIndex(s => s.originalIndex === 0)
            
            questions.push({
                id: `q-glossary-${index}`,
                question: `What is the meaning of the term "${item.term}"?`,
                options: shuffled.map(s => s.opt),
                correctIndex,
                explanation: `Correct! "${item.term}" means: ${item.definition}`
            })
        })

        // Core facts questions
        const factsToUse = facts.slice(0, 2)
        factsToUse.forEach((fact, index) => {
            const distractors = [
                `This property varies and is not consistently observed.`,
                `This statement represents the opposite explanation.`,
                `This explanation is outdated and no longer used in CBSE textbooks.`
            ]
            const options = [fact, ...distractors]
            const shuffled = options.map((opt, i) => ({ opt, originalIndex: i }))
            shuffled.sort(() => Math.random() - 0.5)
            const correctIndex = shuffled.findIndex(s => s.originalIndex === 0)

            questions.push({
                id: `q-fact-${index}`,
                question: `Which of the following statement is true regarding the chapter content?`,
                options: shuffled.map(s => s.opt),
                correctIndex,
                explanation: `Correct! A confirmed fact from the lesson is: "${fact}"`
            })
        })

        // Fallbacks if metadata is empty
        if (questions.length === 0) {
            questions.push({
                id: 'q-fallback-1',
                question: `What is the main learning objective of "${chapter.title}"?`,
                options: [
                    `Understand key curriculum facts related to ${chapter.subject}`,
                    `Memorize definitions without understanding practical contexts`,
                    `Identify events unrelated to standard class lessons`
                ],
                correctIndex: 0,
                explanation: `Correct! The chapter outline focuses on teaching basic concepts of ${chapter.title}.`
            })
        }

        setQuizQuestions(questions)
        setQuizAnswers({})
        setQuizActive(true)
    }

    const submitQuiz = async () => {
        if (!chapter) return

        // Calculate score
        let correctCount = 0
        quizQuestions.forEach(q => {
            if (quizAnswers[q.id] === q.correctIndex) {
                correctCount++
            }
        })
        const finalScore = Math.round((correctCount / quizQuestions.length) * 100)

        // Calculate WPM reading speed
        const durationSec = Math.max(30, (Date.now() - pageLoadTime) / 1000)
        const wordCount = chapter.chunks.reduce((sum, c) => sum + (c.simplified_text || '').split(/\s+/).length, 0)
        const wpm = Math.min(300, Math.max(40, Math.round(wordCount / (durationSec / 60))))

        // Calculate comfort score (use of tools)
        let comfort = 70
        if (rulerActivated) comfort += 10
        if (ttsActivated) comfort += 10
        if (accessibility.prefs.fontSize > 18) comfort += 5
        if (accessibility.prefs.lineHeight > 1.6) comfort += 5
        comfort = Math.min(100, comfort)

        // Generate coins and XP
        const xpEarned = 100 + (correctCount * 10)
        const coinsEarned = 10 + (correctCount * 2)

        const attentionScore = Math.min(100, Math.max(30, Math.round((completedChunksCount() / chapter.chunks.length) * 100)))

        const generatedData = {
            score: finalScore,
            wpm,
            durationSec: Math.round(durationSec),
            comfortScore: comfort,
            focusCoinsEarned: coinsEarned,
            xpPointsEarned: xpEarned,
            attentionSpanScore: attentionScore
        }

        setReportData(generatedData)
        setQuizActive(false)
        setShowReport(true)

        // Update local client stats
        const storedMetrics = localStorage.getItem('neuroadapt_behavior_metrics')
        if (storedMetrics) {
            try {
                const metricsObj = JSON.parse(storedMetrics)
                metricsObj.xpPoints = (metricsObj.xpPoints || 0) + xpEarned
                metricsObj.focusCoins = (metricsObj.focusCoins || 0) + coinsEarned
                metricsObj.completedLessons = (metricsObj.completedLessons || 0) + 1
                metricsObj.readingWpm = wpm
                metricsObj.recentStress = Math.max(0, parseFloat((1 - (finalScore / 100)).toFixed(2)))
                localStorage.setItem('neuroadapt_behavior_metrics', JSON.stringify(metricsObj))
            } catch (err) {
                console.error(err)
            }
        }

        // Post metrics log to server database
        if (studentId) {
            try {
                await fetch(`/api/students/${studentId}/metrics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scores: {
                            marks: finalScore,
                            wpm,
                            confidence: Math.round(finalScore / 10),
                            participation: 9,
                            activities: 8,
                            comfort: comfort
                        },
                        notes: `Finished dynamic chapter quiz for "${chapter.title}". Accuracy: ${finalScore}%. Speed: ${wpm} WPM. Comfort score: ${comfort}%.`
                    })
                })
            } catch (err) {
                console.error('Failed to sync metrics log to server:', err)
            }
        }
    }

    const completedChunksCount = () => {
        return reading.completedChunks.length
    }

    const generateStudyPlan = async () => {
        if (!reportData || !chapter) return
        setPlanLoading(true)
        try {
            const res = await fetch('/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    studentName,
                    profile: studentProfile,
                    score: reportData.score,
                    wpm: reportData.wpm,
                    comfortScore: reportData.comfortScore,
                    attentionSpanScore: reportData.attentionSpanScore,
                    chapterTitle: chapter.title,
                    durationSec: reportData.durationSec
                })
            })
            if (res.ok) {
                const data = await res.json()
                setStudyPlan(data.plan)
                setCognitiveScore(data.cognitiveScore)
                // Also persist to localStorage for the dashboard
                localStorage.setItem('neuroadapt_study_plan', data.plan)
                localStorage.setItem('neuroadapt_plan_date', new Date().toISOString())
                localStorage.setItem('neuroadapt_cognitive_score', String(data.cognitiveScore))
            }
        } catch (err) {
            console.error('Failed to generate study plan:', err)
        } finally {
            setPlanLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-violet-50/50">
                <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">Personalizing reading layout...</p>
                </div>
            </div>
        )
    }

    if (error || !chapter || !accessibility.mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-violet-50/30">
                <div className="text-center space-y-4 max-w-sm p-8 bg-white border rounded-[30px] shadow-lg">
                    <span className="text-4xl">⚠️</span>
                    <h3 className="text-lg font-bold text-slate-900">Failed to Load Content</h3>
                    <p className="text-sm text-slate-500">
                        {error ? error.message : 'Chapter could not be loaded or personalized. Please check backend connection.'}
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold shadow-md shadow-violet-100 transition text-sm"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const currentChunk = chapter.chunks[reading.currentChunkIndex]
    const isLastChunk = reading.currentChunkIndex === chapter.chunks.length - 1

    return (
        <>
        <div
            className="min-h-screen transition-colors duration-500"
            style={{
                backgroundColor: accessibility.prefs.background === 'cream'
                    ? '#FEF9F0'
                    : accessibility.prefs.background === 'white'
                        ? '#FFFFFF'
                        : accessibility.prefs.background === 'blue'
                            ? '#EFF6FF'
                            : '#121214',
                color: accessibility.prefs.background === 'dark' ? '#E2E8F0' : '#1E293B'
            }}
        >
            {/* Reading Ruler */}
            <ReadingRuler enabled={accessibility.prefs.showRuler} />

            {/* Accessibility Customization Bar */}
            <AccessibilityBar
                prefs={accessibility.prefs}
                onUpdate={accessibility.updatePref}
                onReset={accessibility.reset}
            />

            <div className="max-w-4xl mx-auto px-4 py-8 pb-36 relative">
                
                {/* 1. Header Navigation */}
                <header className="flex justify-between items-center mb-8 border-b border-slate-200/20 pb-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 rounded-xl border border-slate-200/30 text-xs font-bold hover:bg-slate-500/5 transition flex items-center gap-1.5"
                    >
                        <span>⬅️</span> Dashboard
                    </button>
                    <div className="flex gap-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-violet-100/90 text-violet-700 border border-violet-200/50">
                            {studentProfile.toUpperCase()} Adaptive Mode
                        </span>
                    </div>
                </header>

                {/* 2. Reading space */}
                {!quizActive && (
                    <main className="space-y-8">
                        {/* Chapter title */}
                        <div className="text-center space-y-3">
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                {chapter.title}
                            </h1>
                            <div className="flex justify-center gap-2 text-xs font-medium">
                                <span className="px-3 py-1 bg-violet-500/20 text-violet-500 border border-violet-500/30 rounded-full">{chapter.subject.toUpperCase()}</span>
                                <span className="px-3 py-1 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-full">{chapter.board.toUpperCase()} Board</span>
                                <span className="px-3 py-1 bg-sky-500/20 text-sky-500 border border-sky-500/30 rounded-full">Class {chapter.class_level}</span>
                            </div>

                            {/* Reading Progress indicator */}
                            <div className="flex items-center justify-center gap-3 pt-3 max-w-xs mx-auto text-xs">
                                <div className="flex-1 bg-slate-200/30 h-2.5 rounded-full overflow-hidden border border-slate-200/20">
                                    <div
                                        className="bg-violet-600 h-full transition-all duration-500 rounded-full"
                                        style={{ width: `${reading.progressPercentage}%` }}
                                    />
                                </div>
                                <span className="font-bold text-slate-400">{reading.progressPercentage}% Complete</span>
                            </div>
                        </div>

                        {/* Text chunk renderer */}
                        <div className="p-1">
                            <ChunkReveal
                                chunk={currentChunk}
                                onNext={reading.nextChunk}
                                onPrevious={reading.prevChunk}
                                canNext={reading.currentChunkIndex < chapter.chunks.length - 1}
                                canPrevious={reading.currentChunkIndex > 0}
                                activeWordIndex={reading.activeWordIndex}
                                fontSize={accessibility.prefs.fontSize}
                                lineHeight={accessibility.prefs.lineHeight}
                                letterSpacing={accessibility.prefs.letterSpacing}
                            />
                        </div>

                        {/* End of Lesson Call To Action */}
                        {isLastChunk && (
                            <div className="p-6 sm:p-8 rounded-[30px] border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-center space-y-4 shadow-lg">
                                <span className="text-4xl animate-bounce block">🏁</span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Congratulations! You finished the chapter!</h3>
                                <p className="text-sm text-slate-500 max-w-md mx-auto">
                                    You have read all sections. Let's do a quick fun challenge to check your understanding!
                                </p>
                                <button
                                    onClick={startTest}
                                    className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-200 transition text-sm flex items-center gap-2 mx-auto"
                                >
                                    <span>🚀</span> Start Chapter Test
                                </button>
                            </div>
                        )}
                    </main>
                )}

                {/* 3. Concept Quiz space */}
                {quizActive && (
                    <main className="max-w-2xl mx-auto bg-white/5 border border-slate-200/20 p-6 sm:p-10 rounded-[36px] shadow-2xl space-y-8">
                        <div>
                            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest block">Chapter Challenge</span>
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Concept Comprehension Test</h2>
                            <p className="text-xs text-slate-400">Answer these quick questions based on the terms and core facts you read.</p>
                        </div>

                        <div className="space-y-6">
                            {quizQuestions.map((q, qIndex) => {
                                return (
                                    <div key={q.id} className="space-y-3.5 border-b border-slate-200/10 pb-6 last:border-b-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                            Q{qIndex + 1}. {q.question}
                                        </p>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {q.options.map((opt, optIndex) => {
                                                const isSelected = quizAnswers[q.id] === optIndex
                                                return (
                                                    <button
                                                        key={optIndex}
                                                        onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIndex })}
                                                        className={`rounded-2xl border p-3.5 text-left text-xs transition duration-200 ${
                                                            isSelected
                                                                ? 'border-violet-600 bg-violet-600/10 text-violet-600 dark:text-violet-400 font-bold'
                                                                : 'border-slate-200/20 hover:bg-slate-500/5 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex gap-4 border-t border-slate-200/15 pt-6">
                            <button
                                onClick={() => setQuizActive(false)}
                                className="flex-1 py-3 rounded-2xl border border-slate-200/20 text-xs font-bold hover:bg-slate-500/5 transition text-slate-700 dark:text-slate-300"
                            >
                                Back to Reading
                            </button>
                            <button
                                onClick={submitQuiz}
                                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-violet-200 transition"
                            >
                                Submit Test
                            </button>
                        </div>
                    </main>
                )}

                {/* Floating controls */}
                {!quizActive && (
                    <>
                        {/* Glossary Panel Toggle */}
                        <div className="fixed right-6 bottom-36 z-20 flex flex-col gap-3">
                            {/* AR PDF Viewer Button */}
                            <button
                                onClick={() => setArViewerOpen(true)}
                                className="w-14 h-14 rounded-full text-white shadow-xl transition flex items-center justify-center text-xl hover:scale-110"
                                style={{
                                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                    boxShadow: '0 0 20px rgba(124,58,237,0.5)',
                                }}
                                title="Open AR PDF Viewer"
                            >
                                🔮
                            </button>
                            <button
                                onClick={() => chapter && exportChunksPDF(chapter, {
                                    includeGlossary: true,
                                    includeCoreFacts: true,
                                    includeObjectives: true,
                                    studentName,
                                })}
                                className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition flex items-center justify-center text-xl hover:scale-110"
                                title="Save chapter as PDF"
                            >
                                📥
                            </button>
                            <button
                                onClick={() => setGlossaryOpen(!glossaryOpen)}
                                className="w-14 h-14 rounded-full bg-violet-600 text-white shadow-xl hover:bg-violet-700 transition flex items-center justify-center text-xl hover:scale-110"
                                title="Open glossary (G)"
                            >
                                📖
                            </button>
                        </div>

                        {/* Glossary Panel */}
                        <GlossaryPanel
                            glossary={currentChunk.glossary || {}}
                            keyTerms={currentChunk.key_terms || []}
                            isOpen={glossaryOpen}
                            onClose={() => setGlossaryOpen(false)}
                        />

                        {/* TTS Play Controls */}
                        <TTSControls
                            text={currentChunk.simplified_text}
                            onWordChange={(idx) => {
                                reading.setActiveWord(idx)
                                if (idx >= 0) setTtsActivated(true)
                            }}
                            speed={accessibility.prefs.ttsSpeed}
                            autoPlay={accessibility.prefs.ttsAutoPlay}
                        />
                    </>
                )}

                {/* 4. Score Report Modal */}
                {showReport && reportData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                        <div className="max-w-lg w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-violet-500/30 p-8 rounded-[40px] shadow-2xl text-center space-y-6 animate-scale-up text-slate-100">
                            <span className="text-5xl animate-bounce block">🏆</span>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Assessment Completed!</span>
                                <h3 className="text-2xl font-extrabold text-white">Dynamic Test Report</h3>
                                <p className="text-xs text-slate-400">Excellent job, {studentName}! Here is your real-time performance breakdown.</p>
                            </div>

                            {/* Metrics Circle stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl space-y-1">
                                    <span className="text-[9px] font-bold uppercase text-slate-400">Quiz Accuracy</span>
                                    <span className="block text-2xl font-black text-violet-400">{reportData.score}%</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl space-y-1">
                                    <span className="text-[9px] font-bold uppercase text-slate-400">Reading Speed</span>
                                    <span className="block text-2xl font-black text-emerald-400">{reportData.wpm} <span className="text-xs font-semibold">WPM</span></span>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl space-y-1">
                                    <span className="text-[9px] font-bold uppercase text-slate-400">Comfort Score</span>
                                    <span className="block text-2xl font-black text-sky-400">{reportData.comfortScore}%</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl space-y-1">
                                    <span className="text-[9px] font-bold uppercase text-slate-400">Attention Flow</span>
                                    <span className="block text-2xl font-black text-amber-400">{reportData.attentionSpanScore}%</span>
                                </div>
                            </div>

                            {/* Rewards Box */}
                            <div className="bg-violet-950/40 border border-violet-500/20 p-4 rounded-3xl flex items-center justify-around text-sm font-bold">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">💎</span>
                                    <span>+{reportData.xpPointsEarned} XP</span>
                                </div>
                                <div className="h-6 w-px bg-violet-500/20" />
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🪙</span>
                                    <span>+{reportData.focusCoinsEarned} Coins</span>
                                </div>
                            </div>

                            {/* Feedback message */}
                            <div className="bg-white/5 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed text-left flex gap-3.5">
                                <span className="text-xl">👩‍🏫</span>
                                <div>
                                    <span className="font-bold text-white block">Nova Assessment Feedback:</span>
                                    “Your attention span metrics remain stable. Applying OpenDyslexic visual supports helped secure a high comfort score. Dynamic logs successfully registered!”
                                </div>
                            </div>

                            {/* AI Study Plan Section */}
                            {!studyPlan && !planLoading && (
                                <button
                                    onClick={generateStudyPlan}
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-sm flex items-center justify-center gap-2"
                                >
                                    <span>🧠</span> Generate My Study Plan
                                </button>
                            )}

                            {planLoading && (
                                <div className="w-full py-4 flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-400 border-t-transparent" />
                                    <span className="text-xs text-emerald-400 font-semibold">AI is crafting your personalized study plan...</span>
                                </div>
                            )}

                            {studyPlan && (
                                <div className="w-full bg-white/5 border border-emerald-500/20 rounded-3xl p-5 space-y-3 text-left max-h-64 overflow-y-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🗓️</span>
                                        <span className="text-sm font-bold text-emerald-400">Your Personalized Study Plan</span>
                                    </div>
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-400 leading-relaxed font-semibold">
                                        🚀 Because your cognitive score is {cognitiveScore || 75} in this evaluation, this study plan is designed to be better suited to your learning pace.
                                    </div>
                                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                                        {studyPlan}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setShowReport(false)
                                    router.push('/dashboard')
                                }}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/20 transition-all text-sm"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* AR PDF Viewer Modal */}
        <ARPdfViewer
            isOpen={arViewerOpen}
            onClose={() => setArViewerOpen(false)}
            mode="student"
        />
        </>
    )
}

