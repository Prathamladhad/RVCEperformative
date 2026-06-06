'use client'

import { useState, useEffect } from 'react'
import { getRecommendations } from '@/lib/api'
import type { Recommendation, StudentMetrics } from '@/lib/api'
import { downloadStudyPlanPDF } from '@/lib/downloadStudyPlanPDF'

interface RecommendationCardProps {
    subject: string
    classLevel: number
    studentMetrics?: StudentMetrics
    studentName?: string
}

const PROFILE_ICONS: Record<string, string> = {
    dyslexia: '📚',
    dyslexic: '📚',
    adhd: '⚡',
    autism: '🧩',
    autistic: '🧩',
    visual: '👁️',
}

const DAY_COLORS: Record<string, string> = {
    Monday: 'bg-violet-100 text-violet-800 border-violet-200',
    Tuesday: 'bg-blue-100 text-blue-800 border-blue-200',
    Wednesday: 'bg-sky-100 text-sky-800 border-sky-200',
    Thursday: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Friday: 'bg-amber-100 text-amber-800 border-amber-200',
    Saturday: 'bg-orange-100 text-orange-800 border-orange-200',
    Sunday: 'bg-rose-100 text-rose-800 border-rose-200',
}

const ACTIVITY_ICONS: Record<string, string> = {
    visual: '🎨',
    auditory: '🎧',
    kinesthetic: '🤸',
    structured: '📋',
}

export function RecommendationCard({ subject, classLevel, studentMetrics, studentName }: RecommendationCardProps) {
    const [recommendations, setRecommendations] = useState<Recommendation | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'resources' | 'timeline' | 'activities'>('resources')
    const [expandedResource, setExpandedResource] = useState<string | null>('youtube')
    const [exportingPDF, setExportingPDF] = useState(false)

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true)
                setError(null)
                const recs = await getRecommendations(subject, classLevel, studentMetrics)
                setRecommendations(recs)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch recommendations')
                console.error('Error fetching recommendations:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchRecommendations()
    }, [subject, classLevel, studentMetrics])

    const handleExportPDF = async () => {
        if (!recommendations) return
        setExportingPDF(true)
        try {
            const studyTimeline = (recommendations as any).study_timeline || {}
            const activities = (recommendations as any).activities || []
            const profile = studentMetrics?.profile || 'General Learner'

            const planJson = JSON.stringify({
                studentName: studentName || 'Student',
                profile,
                chapterTitle: `${subject} — Class ${classLevel}`,
                generatedAt: new Date().toISOString(),
                cognitiveScore: studentMetrics?.readingWpm
                    ? Math.min(100, Math.round((studentMetrics.readingWpm / 200) * 100))
                    : 75,
                cogLevel: recommendations.difficulty === 'easy' ? 'Foundational' : recommendations.difficulty === 'advanced' ? 'Advanced' : 'Intermediate',
                scoreMessage: (recommendations as any).profile_insight || `Recommendations tailored for ${profile} profile.`,
                cognitiveMetrics: [
                    { metric: 'Reading Speed', value: `${studentMetrics?.readingWpm || 150} WPM`, level: studentMetrics?.readingWpm && studentMetrics.readingWpm < 100 ? 'Low' : studentMetrics?.readingWpm && studentMetrics.readingWpm > 200 ? 'High' : 'Moderate', insight: 'Speed determines session length and resource depth.' },
                    { metric: 'Quiz Accuracy', value: `${Math.max(0, 100 - (studentMetrics?.mistakesPerQuiz || 0) * 10)}%`, level: (studentMetrics?.mistakesPerQuiz || 0) > 5 ? 'Needs Work' : 'Good', insight: 'Lower mistakes indicate stronger concept retention.' },
                    { metric: 'Stress Level', value: `${Math.round((studentMetrics?.recentStress || 0.1) * 100)}%`, level: (studentMetrics?.recentStress || 0) > 0.7 ? 'High' : 'Manageable', insight: 'High stress can reduce working memory capacity.' },
                    { metric: 'Lessons Completed', value: `${studentMetrics?.completedLessons || 0}`, level: (studentMetrics?.completedLessons || 0) > 10 ? 'Excellent' : 'Building', insight: 'Consistent completion builds long-term retention.' },
                ],
                dailyRoutine: studyTimeline.weekly_schedule || [],
                tips: recommendations.tips || [],
                recommendations: activities.map((a: any) => `${a.name} (${a.duration_minutes} min): ${a.description}`)
            })
            await downloadStudyPlanPDF(planJson)
        } catch (err) {
            console.error('PDF export failed:', err)
        } finally {
            setExportingPDF(false)
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-violet-100 bg-white p-8 shadow-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 w-48 rounded-full bg-violet-100" />
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-slate-100" />)}
                    </div>
                    <div className="h-32 rounded-xl bg-violet-50" />
                </div>
            </div>
        )
    }

    if (error || !recommendations) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="font-semibold text-red-800">Couldn't load recommendations</p>
                        <p className="text-sm text-red-600 mt-1">{error || 'Unknown error'}</p>
                    </div>
                </div>
            </div>
        )
    }

    const aiPowered = (recommendations as any).ai_powered || false
    const profileInsight = (recommendations as any).profile_insight || ''
    const activities = (recommendations as any).activities || []
    const studyTimeline = (recommendations as any).study_timeline || {}
    const weeklySchedule = studyTimeline.weekly_schedule || []
    const checkpoints = studyTimeline.checkpoints || []
    const profile = studentMetrics?.profile || ''
    const profileIcon = PROFILE_ICONS[profile.toLowerCase()] || '🧠'

    const tabs = [
        { id: 'resources', label: '📚 Resources', count: Object.values(recommendations.resources).flat().length },
        { id: 'timeline', label: '📅 Study Timeline', count: weeklySchedule.length > 0 ? 14 : 0 },
        { id: 'activities', label: '🎯 Activities', count: activities.length },
    ] as const

    return (
        <div className="space-y-5 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{profileIcon}</span>
                        <h3 className="text-lg font-bold text-slate-900">Personalised Recommendations</h3>
                        {aiPowered && (
                            <span className="text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                ✨ AI Powered
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500">
                        {subject.toUpperCase()} · Class {classLevel} ·{' '}
                        <span className={`font-semibold ${recommendations.difficulty === 'easy' ? 'text-emerald-600' : recommendations.difficulty === 'advanced' ? 'text-red-600' : 'text-amber-600'}`}>
                            {recommendations.difficulty.charAt(0).toUpperCase() + recommendations.difficulty.slice(1)} Level
                        </span>
                    </p>
                </div>
                <button
                    onClick={handleExportPDF}
                    disabled={exportingPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-100 transition disabled:opacity-60"
                >
                    {exportingPDF ? '⏳ Exporting...' : '📥 Export Study Plan PDF'}
                </button>
            </div>

            {/* ── Profile Insight Banner ───────────────────────────────── */}
            {profileInsight && (
                <div className="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 p-4 flex gap-3">
                    <span className="text-xl flex-shrink-0">💡</span>
                    <p className="text-sm text-slate-700 leading-relaxed">{profileInsight}</p>
                </div>
            )}

            {/* ── Tips Pills ───────────────────────────────────────────── */}
            {recommendations.tips.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personalised Tips</p>
                    <div className="flex flex-wrap gap-2">
                        {recommendations.tips.map((tip, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1.5 text-xs bg-violet-50 border border-violet-100 text-violet-800 px-3 py-1.5 rounded-full font-medium"
                            >
                                {tip}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Tabs ────────────────────────────────────────────────── */}
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                            ? 'bg-white text-violet-700 shadow-sm border border-violet-100'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab: Resources ────────────────────────────────────────── */}
            {activeTab === 'resources' && (
                <div className="space-y-3">
                    {/* YouTube */}
                    {recommendations.resources.youtube && recommendations.resources.youtube.length > 0 && (
                        <div className="rounded-xl border border-red-100 overflow-hidden">
                            <button
                                onClick={() => setExpandedResource(expandedResource === 'youtube' ? null : 'youtube')}
                                className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 transition"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🎥</span>
                                    <span className="font-bold text-red-900 text-sm">YouTube Videos</span>
                                    <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">
                                        {recommendations.resources.youtube.length}
                                    </span>
                                </div>
                                <span className="text-red-400 text-sm">{expandedResource === 'youtube' ? '▾' : '▸'}</span>
                            </button>
                            {expandedResource === 'youtube' && (
                                <div className="divide-y divide-red-50">
                                    {recommendations.resources.youtube.map((v, i) => (
                                        <a
                                            key={i}
                                            href={v.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-white hover:bg-red-50 transition group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-sm flex-shrink-0">
                                                ▶
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-xs truncate group-hover:text-red-700">{v.title}</p>
                                                <p className="text-[10px] text-slate-500">{(v as any).channel || 'YouTube'}</p>
                                            </div>
                                            <span className="text-red-300 group-hover:text-red-600 text-sm flex-shrink-0">→</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NPTEL */}
                    {recommendations.resources.nptel && recommendations.resources.nptel.length > 0 && (
                        <div className="rounded-xl border border-orange-100 overflow-hidden">
                            <button
                                onClick={() => setExpandedResource(expandedResource === 'nptel' ? null : 'nptel')}
                                className="w-full flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 transition"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🎓</span>
                                    <span className="font-bold text-orange-900 text-sm">NPTEL Courses</span>
                                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                                        {recommendations.resources.nptel.length}
                                    </span>
                                </div>
                                <span className="text-orange-400 text-sm">{expandedResource === 'nptel' ? '▾' : '▸'}</span>
                            </button>
                            {expandedResource === 'nptel' && (
                                <div className="divide-y divide-orange-50">
                                    {recommendations.resources.nptel.map((c, i) => (
                                        <a
                                            key={i}
                                            href={c.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-white hover:bg-orange-50 transition group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">🏛️</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-xs truncate group-hover:text-orange-700">{c.title}</p>
                                                <p className="text-[10px] text-slate-500">{(c as any).platform || 'NPTEL'}</p>
                                            </div>
                                            <span className="text-orange-300 group-hover:text-orange-600 text-sm flex-shrink-0">→</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Khan Academy */}
                    {recommendations.resources.khan && recommendations.resources.khan.length > 0 && (
                        <div className="rounded-xl border border-green-100 overflow-hidden">
                            <button
                                onClick={() => setExpandedResource(expandedResource === 'khan' ? null : 'khan')}
                                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 transition"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🌟</span>
                                    <span className="font-bold text-green-900 text-sm">Khan Academy</span>
                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">
                                        {recommendations.resources.khan.length}
                                    </span>
                                </div>
                                <span className="text-green-400 text-sm">{expandedResource === 'khan' ? '▾' : '▸'}</span>
                            </button>
                            {expandedResource === 'khan' && (
                                <div className="divide-y divide-green-50">
                                    {recommendations.resources.khan.map((c, i) => (
                                        <a
                                            key={i}
                                            href={c.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-white hover:bg-green-50 transition group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-sm flex-shrink-0">📖</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-xs truncate group-hover:text-green-700">{c.title}</p>
                                                <p className="text-[10px] text-slate-500">{(c as any).platform || 'Khan Academy'}</p>
                                            </div>
                                            <span className="text-green-300 group-hover:text-green-600 text-sm flex-shrink-0">→</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab: Study Timeline ────────────────────────────────────── */}
            {activeTab === 'timeline' && (
                <div className="space-y-4">
                    {weeklySchedule.length > 0 ? (
                        <>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>📅 14-Day Plan</span>
                                <span>·</span>
                                <span>⏱️ {studyTimeline.daily_minutes || 30} min/day</span>
                                <span>·</span>
                                <span>📊 {Math.round(((studyTimeline.daily_minutes || 30) * 14) / 60 * 10) / 10} hrs total</span>
                            </div>

                            <div className="space-y-2">
                                {weeklySchedule.map((day: any, i: number) => {
                                    const colorClass = DAY_COLORS[day.day] || 'bg-slate-100 text-slate-700 border-slate-200'
                                    return (
                                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${colorClass}`}>
                                            <span className="text-xs font-black w-20 flex-shrink-0 pt-0.5">{day.day}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">{day.focus}</p>
                                                <p className="text-[11px] opacity-70 truncate">{day.activity}</p>
                                            </div>
                                            <span className="text-[11px] font-bold flex-shrink-0 opacity-70">{day.duration_minutes}m</span>
                                        </div>
                                    )
                                })}
                            </div>

                            {checkpoints.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Checkpoints</p>
                                    {checkpoints.map((cp: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                                            <span className="text-sm">🏁</span>
                                            <span className="text-xs font-semibold text-amber-800">Day {cp.day}:</span>
                                            <span className="text-xs text-amber-700 flex-1">{cp.task}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            <span className="text-3xl block mb-2">📅</span>
                            Study timeline not available — click "Resources" tab for curated materials
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab: Activities ───────────────────────────────────────── */}
            {activeTab === 'activities' && (
                <div className="space-y-3">
                    {activities.length > 0 ? (
                        activities.map((act: any, i: number) => (
                            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{ACTIVITY_ICONS[act.type] || '📌'}</span>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 text-sm">{act.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">{act.type}</span>
                                            <span className="text-[10px] text-slate-400">·</span>
                                            <span className="text-[10px] font-bold text-violet-600">⏱️ {act.duration_minutes} min</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed pl-8">{act.description}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            <span className="text-3xl block mb-2">🎯</span>
                            Activities generated by AI when a student profile is available
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
