'use client'

import { useMemo } from 'react'

interface CognitiveMetric {
    metric: string
    value: string
    level: string
    insight: string
}

interface RoutineEntry {
    time: string
    activity: string
    duration: string
    type: string
    description: string
}

interface StudyPlan {
    studentName: string
    cognitiveScore: number
    cogLevel: string
    scoreMessage: string
    chapterTitle: string
    profile: string
    cognitiveMetrics: CognitiveMetric[]
    dailyRoutine: RoutineEntry[]
    tips: string[]
    recommendations: string[]
    generatedAt?: string
}

interface StudyPlanCardProps {
    planJson: string
    isDark?: boolean
    onDownloadPDF?: () => void
}

const typeColors: Record<string, string> = {
    'Core Learning':   'bg-violet-100 text-violet-700 border-violet-200',
    'Review':          'bg-sky-100 text-sky-700 border-sky-200',
    'Break':           'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Assessment':      'bg-amber-100 text-amber-700 border-amber-200',
    'Planning':        'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Preparation':     'bg-rose-100 text-rose-700 border-rose-200',
    'Reinforcement':   'bg-teal-100 text-teal-700 border-teal-200',
}

const typeColorsDark: Record<string, string> = {
    'Core Learning':   'bg-violet-900/40 text-violet-300 border-violet-800/40',
    'Review':          'bg-sky-900/40 text-sky-300 border-sky-800/40',
    'Break':           'bg-emerald-900/40 text-emerald-300 border-emerald-800/40',
    'Assessment':      'bg-amber-900/40 text-amber-300 border-amber-800/40',
    'Planning':        'bg-indigo-900/40 text-indigo-300 border-indigo-800/40',
    'Preparation':     'bg-rose-900/40 text-rose-300 border-rose-800/40',
    'Reinforcement':   'bg-teal-900/40 text-teal-300 border-teal-800/40',
}

const metricIcons: Record<string, string> = {
    'Overall Cognitive Score': '🧠',
    'Reading Speed': '⚡',
    'Attention & Focus': '🎯',
    'Attention': '🎯',
    'Comfort & Focus': '🛡️',
    'Comfort & Focus Score': '🛡️',
    'Quiz Accuracy': '✅',
    'Session Duration': '⏱️',
}

const levelColors = (level: string, dark: boolean) => {
    const l = level.toLowerCase()
    if (l.includes('excellent') || l.includes('advanced') || l.includes('strong') || l.includes('high'))
        return dark ? 'text-emerald-400' : 'text-emerald-600'
    if (l.includes('good') || l.includes('proficient') || l.includes('moderate'))
        return dark ? 'text-sky-400' : 'text-sky-600'
    if (l.includes('average') || l.includes('fair') || l.includes('developing'))
        return dark ? 'text-amber-400' : 'text-amber-600'
    return dark ? 'text-rose-400' : 'text-rose-600'
}

const scoreBarWidth = (score: number) => `${Math.min(100, Math.max(4, score))}%`

const scoreGradient = (score: number) =>
    score >= 80 ? 'from-emerald-400 to-teal-400' :
    score >= 65 ? 'from-sky-400 to-indigo-400' :
    score >= 50 ? 'from-amber-400 to-orange-400' :
    'from-rose-400 to-pink-400'

export function StudyPlanCard({ planJson, isDark = false, onDownloadPDF: _onDownloadPDF }: StudyPlanCardProps) {
    const plan: StudyPlan | null = useMemo(() => {
        if (!planJson) return null
        try {
            const parsed = JSON.parse(planJson)
            // Handle both nested and flat formats
            if (parsed.cognitiveMetrics || parsed.dailyRoutine) return parsed as StudyPlan
            return null
        } catch {
            return null
        }
    }, [planJson])

    // If plan is old plain-text format, render simple view
    if (!plan) {
        return (
            <div className={`rounded-2xl p-5 border text-xs leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto ${
                isDark ? 'border-emerald-500/20 bg-emerald-950/20 text-slate-300' : 'border-emerald-200 bg-emerald-50/50 text-slate-700'
            }`}>
                {planJson}
            </div>
        )
    }

    const heading = isDark ? 'text-white' : 'text-slate-900'
    const sub = isDark ? 'text-slate-400' : 'text-slate-500'
    const rowBg = isDark ? 'bg-slate-900/50' : 'bg-slate-50/80'
    const rowAlt = isDark ? 'bg-slate-800/30' : 'bg-white/60'
    const divider = isDark ? 'border-slate-700/50' : 'border-slate-200/70'

    return (
      <div className="space-y-5 text-sm">
        {/* ── Cognitive Score Banner ── */}
        <div
          className={`rounded-2xl p-5 ${isDark ? "bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-700/30" : "bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/70"}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p
                className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-violet-400" : "text-violet-500"}`}
              >
                Cognitive Score
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {plan.cognitiveScore}
                </span>
                <span
                  className={`text-lg font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  /100
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full border ml-1 ${
                    isDark
                      ? "bg-violet-900/50 text-violet-300 border-violet-700/50"
                      : "bg-violet-100 text-violet-700 border-violet-200"
                  }`}
                >
                  {plan.cogLevel}
                </span>
              </div>
              <div className="mt-2 h-2.5 rounded-full overflow-hidden bg-slate-300/30">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${scoreGradient(plan.cognitiveScore)} transition-all duration-700`}
                  style={{ width: scoreBarWidth(plan.cognitiveScore) }}
                />
              </div>
            </div>
            <p
              className={`text-xs leading-relaxed max-w-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              {plan.scoreMessage}
            </p>
          </div>
        </div>

        {/* ── Cognitive Metrics Table ── */}
        {plan.cognitiveMetrics && plan.cognitiveMetrics.length > 0 && (
          <div className={`rounded-2xl overflow-hidden border ${divider}`}>
            <div
              className={`px-4 py-3 border-b ${divider} ${isDark ? "bg-slate-800/80" : "bg-slate-100/80"}`}
            >
              <h4
                className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                📊 Cognitive Performance Metrics
              </h4>
            </div>
            <div
              className="divide-y"
              style={{
                borderColor: isDark
                  ? "rgba(100,116,139,0.2)"
                  : "rgba(226,232,240,0.8)",
              }}
            >
              {plan.cognitiveMetrics.map((m, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-3 items-start ${i % 2 === 0 ? rowBg : rowAlt}`}
                >
                  <span className="text-base mt-0.5">
                    {metricIcons[m.metric] || "📌"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${heading}`}>
                        {m.metric}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${levelColors(m.level, isDark)}`}
                      >
                        {m.level}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 leading-snug ${sub}`}>
                      {m.insight}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-black whitespace-nowrap ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Daily Routine Table ── */}
        {plan.dailyRoutine && plan.dailyRoutine.length > 0 && (
          <div className={`rounded-2xl overflow-hidden border ${divider}`}>
            <div
              className={`px-4 py-3 border-b ${divider} ${isDark ? "bg-slate-800/80" : "bg-slate-100/80"}`}
            >
              <h4
                className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                ⏰ Recommended Daily Routine
              </h4>
            </div>
            <div
              className="divide-y overflow-x-auto"
              style={{
                borderColor: isDark
                  ? "rgba(100,116,139,0.2)"
                  : "rgba(226,232,240,0.8)",
              }}
            >
              {plan.dailyRoutine.map((r, i) => {
                const colorClass =
                  (isDark ? typeColorsDark : typeColors)[r.type] ||
                  (isDark
                    ? "bg-slate-800/40 text-slate-400 border-slate-700/40"
                    : "bg-slate-100 text-slate-600 border-slate-200");
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-[140px_1fr] gap-3 px-4 py-3 ${i % 2 === 0 ? rowBg : rowAlt}`}
                  >
                    <div className="space-y-1">
                      <p
                        className={`text-[10px] font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {r.time}
                      </p>
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${colorClass}`}
                      >
                        {r.type}
                      </span>
                      <p className={`text-[10px] ${sub}`}>{r.duration}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${heading}`}>
                        {r.activity}
                      </p>
                      <p className={`text-[11px] mt-0.5 leading-snug ${sub}`}>
                        {r.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Study Tips ── */}
        {plan.tips && plan.tips.length > 0 && (
          <div
            className={`rounded-2xl p-4 border ${divider} ${isDark ? "bg-slate-800/40" : "bg-amber-50/50"}`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? "text-amber-400" : "text-amber-600"}`}
            >
              💡 Personalised Study Tips
            </h4>
            <ul className="space-y-2">
              {plan.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 text-[10px] font-bold w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center ${
                      isDark
                        ? "bg-amber-900/60 text-amber-400"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-[11px] leading-snug ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Recommendations ── */}
        {plan.recommendations && plan.recommendations.length > 0 && (
          <div
            className={`rounded-2xl p-4 border ${isDark ? "border-emerald-800/40 bg-emerald-950/20" : "border-emerald-200 bg-emerald-50/50"}`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
            >
              🎯 Personalised Recommendations
            </h4>
            <ul className="space-y-2">
              {plan.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">→</span>
                  <span
                    className={`text-[11px] leading-snug ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {rec}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Footer ── */}
        <div className={`flex items-center justify-between pt-1`}>
          <p className={`text-[10px] ${sub}`}>
            {plan.generatedAt
              ? `Generated on ${new Date(plan.generatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </p>
                <button
                    type="button"
                    onClick={() =>
                        window.location.assign(
                            "https://amazing-lolly-64924a.netlify.app/",
                        )
                    }
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${isDark
                            ? "bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-300 border border-indigo-700/50"
                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200"
                        }`}
                >
                    📊 Dashboard
                </button>
        </div>
      </div>
    );
}
