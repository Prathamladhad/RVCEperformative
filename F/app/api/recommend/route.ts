import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

// ── Static fallback resources ────────────────────────────────────────────────
const STATIC_RESOURCES: Record<string, Record<number, any>> = {
    science: {
        6: { youtube: [{ title: "Basic Biology Explained", channel: "Kurzgesagt", url: "https://www.youtube.com/results?search_query=class+6+science+biology+NCERT" }, { title: "Physics for Kids", channel: "SciShow Kids", url: "https://www.youtube.com/results?search_query=class+6+physics+NCERT" }, { title: "Simple Chemistry", channel: "TED-Ed", url: "https://www.youtube.com/results?search_query=class+6+chemistry+NCERT" }], nptel: [{ title: "Introductory Biology (IIT Madras)", platform: "NPTEL", url: "https://nptel.ac.in/courses/102106068" }], khan: [{ title: "Biology – All About Life", platform: "Khan Academy", url: "https://www.khanacademy.org/science/biology" }] },
        7: { youtube: [{ title: "Photosynthesis Explained", channel: "Amoeba Sisters", url: "https://www.youtube.com/results?search_query=photosynthesis+class+7+NCERT" }, { title: "Solar System", channel: "Crash Course Kids", url: "https://www.youtube.com/results?search_query=solar+system+class+7+NCERT" }], nptel: [{ title: "General Biology I (IIT Madras)", platform: "NPTEL", url: "https://nptel.ac.in/courses/102106068" }], khan: [{ title: "Life Sciences", platform: "Khan Academy", url: "https://www.khanacademy.org/science" }] },
        8: { youtube: [{ title: "Cell Biology", channel: "Amoeba Sisters", url: "https://www.youtube.com/results?search_query=cell+biology+class+8+NCERT" }, { title: "Force & Pressure", channel: "Vedantu", url: "https://www.youtube.com/results?search_query=force+pressure+class+8+NCERT" }], nptel: [{ title: "Physics II (IIT Bombay)", platform: "NPTEL", url: "https://nptel.ac.in/courses/115101117" }], khan: [{ title: "Biology", platform: "Khan Academy", url: "https://www.khanacademy.org/science/biology" }] },
        9: { youtube: [{ title: "Matter in Our Surroundings", channel: "Physics Wallah", url: "https://www.youtube.com/results?search_query=matter+surroundings+class+9+NCERT" }, { title: "Motion Class 9", channel: "NCERT Official", url: "https://www.youtube.com/results?search_query=motion+class+9+NCERT" }], nptel: [{ title: "Physics Advanced (IIT Madras)", platform: "NPTEL", url: "https://nptel.ac.in/courses/115106093" }], khan: [{ title: "Advanced Biology", platform: "Khan Academy", url: "https://www.khanacademy.org/science/biology" }] },
        10: { youtube: [{ title: "Chemical Reactions Class 10", channel: "Physics Wallah", url: "https://www.youtube.com/results?search_query=chemical+reactions+class+10+NCERT" }, { title: "Electricity Class 10", channel: "Vedantu", url: "https://www.youtube.com/results?search_query=electricity+class+10+NCERT" }], nptel: [{ title: "General Biology III (IIT Madras)", platform: "NPTEL", url: "https://nptel.ac.in/courses/102106068" }], khan: [{ title: "AP Biology", platform: "Khan Academy", url: "https://www.khanacademy.org/science/ap-biology" }] },
    },
    maths: {
        6: { youtube: [{ title: "Number Systems Class 6", channel: "Vedantu", url: "https://www.youtube.com/results?search_query=number+system+class+6+NCERT+maths" }, { title: "Basic Geometry", channel: "Math Antics", url: "https://www.youtube.com/results?search_query=geometry+class+6+NCERT" }], nptel: [{ title: "Mathematics Basics (IIT Bombay)", platform: "NPTEL", url: "https://nptel.ac.in/courses/111104137" }], khan: [{ title: "Arithmetic and Pre-Algebra", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic" }] },
        7: { youtube: [{ title: "Simple Equations", channel: "Physics Wallah", url: "https://www.youtube.com/results?search_query=simple+equations+class+7+NCERT" }, { title: "Triangles Class 7", channel: "Unacademy", url: "https://www.youtube.com/results?search_query=triangles+class+7+NCERT" }], nptel: [{ title: "Mathematics Algebra (IIT Bombay)", platform: "NPTEL", url: "https://nptel.ac.in/courses/111104137" }], khan: [{ title: "Pre-Algebra", platform: "Khan Academy", url: "https://www.khanacademy.org/math/pre-algebra" }] },
        8: { youtube: [{ title: "Linear Equations Class 8", channel: "Vedantu", url: "https://www.youtube.com/results?search_query=linear+equations+class+8+NCERT" }, { title: "Mensuration", channel: "Khan Academy India", url: "https://www.youtube.com/results?search_query=mensuration+class+8+NCERT" }], nptel: [{ title: "Mathematics Algebra & Geometry", platform: "NPTEL", url: "https://nptel.ac.in/courses/111104137" }], khan: [{ title: "Algebra 1", platform: "Khan Academy", url: "https://www.khanacademy.org/math/algebra" }] },
        9: { youtube: [{ title: "Polynomials Class 9", channel: "Physics Wallah", url: "https://www.youtube.com/results?search_query=polynomials+class+9+NCERT" }, { title: "Coordinate Geometry", channel: "3Blue1Brown", url: "https://www.youtube.com/results?search_query=coordinate+geometry+class+9+NCERT" }], nptel: [{ title: "Mathematics Advanced", platform: "NPTEL", url: "https://nptel.ac.in/courses/111104137" }], khan: [{ title: "Algebra 2", platform: "Khan Academy", url: "https://www.khanacademy.org/math/algebra2" }] },
        10: { youtube: [{ title: "Quadratic Equations Class 10", channel: "Vedantu", url: "https://www.youtube.com/results?search_query=quadratic+equations+class+10+NCERT" }, { title: "Trigonometry Class 10", channel: "Physics Wallah", url: "https://www.youtube.com/results?search_query=trigonometry+class+10+NCERT" }], nptel: [{ title: "Mathematics Calculus (IIT Delhi)", platform: "NPTEL", url: "https://nptel.ac.in/courses/111102064" }], khan: [{ title: "Precalculus", platform: "Khan Academy", url: "https://www.khanacademy.org/math/precalculus" }] },
    }
}

function getStaticFallback(subject: string, classLevel: number) {
    return STATIC_RESOURCES[subject.toLowerCase()]?.[classLevel] || {
        youtube: [{ title: `${subject} Class ${classLevel} NCERT`, channel: "YouTube Search", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' class ' + classLevel + ' NCERT')}` }],
        nptel: [{ title: "NPTEL Courses", platform: "NPTEL", url: "https://nptel.ac.in" }],
        khan: [{ title: "Khan Academy", platform: "Khan Academy", url: "https://www.khanacademy.org" }]
    }
}

// ── Gemini direct fallback ────────────────────────────────────────────────────
async function getGeminiRecommendations(subject: string, classLevel: number, metrics: any) {
    if (!GEMINI_API_KEY) return null

    const profile = metrics?.profile || 'general learner'
    const readingWpm = metrics?.readingWpm || 150
    const mistakes = metrics?.mistakesPerQuiz || 0
    const stress = metrics?.recentStress || 0.1
    const completed = metrics?.completedLessons || 0

    const prompt = `You are an expert educational psychologist specialising in neurodivergent learning for NCERT/CBSE curriculum.

A student needs personalised learning recommendations:
- Subject: ${subject} (Class ${classLevel}, NCERT/CBSE)
- Learning Profile: ${profile}
- Reading Speed: ${readingWpm} WPM
- Quiz Mistakes: ${mistakes}
- Stress Level (0-1): ${stress}
- Completed Lessons: ${completed}

Generate a structured recommendation plan as JSON:
{
  "difficulty": "easy" | "intermediate" | "advanced",
  "tips": ["tip 1 (max 12 words)", "tip 2", "tip 3", "tip 4"],
  "adaptations": ["adaptation_key"],
  "profile_insight": "2 sentence personalised insight",
  "ai_powered": true,
  "youtube_searches": [
    {"title": "Video title for Class ${classLevel} ${subject}", "search_query": "class ${classLevel} ${subject} NCERT specific topic", "reason": "why this helps"},
    {"title": "Video title 2", "search_query": "class ${classLevel} ${subject} NCERT another topic", "reason": "why"},
    {"title": "Video title 3", "search_query": "class ${classLevel} ${subject} NCERT third topic", "reason": "why"}
  ],
  "activities": [
    {"name": "Activity name", "type": "visual|auditory|kinesthetic|structured", "description": "How to do it in 15 words", "duration_minutes": 15},
    {"name": "Activity 2", "type": "auditory", "description": "Description", "duration_minutes": 20}
  ],
  "study_timeline": {
    "total_days": 14,
    "daily_minutes": 30,
    "weekly_schedule": [
      {"day": "Monday", "focus": "topic", "activity": "what to do", "duration_minutes": 30},
      {"day": "Tuesday", "focus": "topic", "activity": "what to do", "duration_minutes": 30},
      {"day": "Wednesday", "focus": "topic", "activity": "what to do", "duration_minutes": 30},
      {"day": "Thursday", "focus": "topic", "activity": "what to do", "duration_minutes": 30},
      {"day": "Friday", "focus": "topic", "activity": "what to do", "duration_minutes": 30},
      {"day": "Saturday", "focus": "Review", "activity": "self quiz", "duration_minutes": 45},
      {"day": "Sunday", "focus": "Rest", "activity": "watch one video", "duration_minutes": 20}
    ],
    "checkpoints": [{"day": 7, "task": "mid-review task"}, {"day": 14, "task": "final assessment"}]
  }
}
Return ONLY the JSON object.`

    try {
        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
            }),
            signal: AbortSignal.timeout(20000)
        })

        if (!res.ok) return null
        const data = await res.json()
        const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!jsonStr) return null

        const parsed = JSON.parse(jsonStr)

        // Convert youtube_searches to resources format
        const staticBase = getStaticFallback(subject, classLevel)
        const youtubeResources = (parsed.youtube_searches || []).map((ys: any) => ({
            title: ys.title,
            channel: 'YouTube Search',
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(ys.search_query || '')}`
        }))

        return {
            ...parsed,
            resources: {
                youtube: youtubeResources.length > 0 ? youtubeResources : staticBase.youtube,
                nptel: staticBase.nptel,
                khan: staticBase.khan
            }
        }
    } catch (e) {
        console.error('[recommend API] Gemini call failed:', e)
        return null
    }
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
function buildRuleBasedRecommendations(subject: string, classLevel: number, metrics: any) {
    const staticResources = getStaticFallback(subject, classLevel)
    const profile = (metrics?.profile || '').toLowerCase()
    const readingWpm = metrics?.readingWpm || 150
    const mistakes = metrics?.mistakesPerQuiz || 0
    const stress = metrics?.recentStress || 0.1
    const completed = metrics?.completedLessons || 0

    const tips: string[] = []
    const adaptations: string[] = []
    const activities: any[] = []
    let difficulty = 'intermediate'

    if (readingWpm < 100) {
        difficulty = 'easy'
        tips.push('📖 Focus on shorter videos (under 8 minutes) and visual content')
        adaptations.push('visual_heavy')
    } else if (readingWpm > 200) {
        difficulty = 'advanced'
        tips.push('⚡ Challenge yourself with detailed NPTEL lectures')
        adaptations.push('text_heavy')
    }

    if (profile.includes('dyslexia') || profile.includes('dyslexic')) {
        tips.push('📚 Use OpenDyslexic font and TTS narration for all reading')
        tips.push('🎧 Listen to the chapter first before reading it independently')
        adaptations.push('dyslexia_friendly')
        activities.push({ name: 'Audio-first learning', type: 'auditory', description: 'Listen to the chapter narration, then read along.', duration_minutes: 15 })
    } else if (profile.includes('adhd')) {
        tips.push('⏱️ Use Pomodoro: 15 min study + 5 min movement break')
        tips.push('🎮 Use interactive Khan Academy exercises to maintain engagement')
        adaptations.push('short_format')
        activities.push({ name: 'Pomodoro Study Burst', type: 'structured', description: 'Study 15 min → take a 5 min movement break → repeat 3 times.', duration_minutes: 20 })
    } else if (profile.includes('autism') || profile.includes('autistic')) {
        tips.push('📋 Create a visual checklist of each chapter topic before starting')
        tips.push('🧠 Follow the same structured sequence every study session')
        adaptations.push('structured_format')
        activities.push({ name: 'Topic checklist mapping', type: 'structured', description: 'List all chapter objectives. Tick each one as you master it.', duration_minutes: 10 })
    }

    if (stress > 0.7) tips.push('😌 High stress: take breaks and try gamified learning apps')
    if (mistakes > 5) tips.push('🎯 Review basics first before moving to harder topics')
    if (completed > 10) tips.push('🌟 Great progress! Try supplementary NPTEL resources')

    const weeklySchedule = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => ({
        day,
        focus: ['Introduction & key terms', 'Core concepts reading', 'Practice problems', 'Visual/video study', 'Self-quiz', 'Review & revision', 'Rest & video'][i],
        activity: i === 5 ? 'Self-quiz + glossary review' : i === 6 ? 'Watch one recommended video' : 'Read → Summarise → Repeat',
        duration_minutes: i === 5 ? 45 : i === 6 ? 20 : 30
    }))

    return {
        difficulty,
        tips,
        adaptations,
        activities,
        profile_insight: `This student benefits from ${profile || 'structured'} learning approaches. Resources have been tailored to their reading pace and engagement style.`,
        ai_powered: false,
        resources: staticResources,
        study_timeline: {
            total_days: 14,
            daily_minutes: 30,
            weekly_schedule: weeklySchedule,
            checkpoints: [
                { day: 7, task: `Self-assessment on first half of ${subject} Class ${classLevel} topics` },
                { day: 14, task: `Full chapter review and mock test` }
            ]
        },
        study_plan: {
            duration_days: 14,
            total_study_hours: 7,
            daily_sessions: weeklySchedule
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { subject, class_level: classLevel, metrics } = body

        if (!subject || !classLevel) {
            return NextResponse.json({ error: 'subject and class_level are required' }, { status: 400 })
        }

        // 1. Try Python backend first
        try {
            const backendRes = await fetch(`${BACKEND_URL}/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, class_level: classLevel, metrics }),
                signal: AbortSignal.timeout(10000)
            })
            if (backendRes.ok) {
                const data = await backendRes.json()
                return NextResponse.json(data)
            }
        } catch (backendErr) {
            console.warn('[recommend API] Backend unavailable, falling back to Gemini')
        }

        // 2. Try Gemini directly
        const geminiResult = await getGeminiRecommendations(subject, classLevel, metrics)
        if (geminiResult) {
            return NextResponse.json({
                subject,
                class_level: classLevel,
                ...geminiResult,
                study_plan: {
                    duration_days: 14,
                    total_study_hours: 7,
                    daily_sessions: geminiResult.study_timeline?.weekly_schedule || []
                }
            })
        }

        // 3. Rule-based static fallback
        const fallback = buildRuleBasedRecommendations(subject, classLevel, metrics)
        return NextResponse.json({ subject, class_level: classLevel, ...fallback })

    } catch (error) {
        console.error('[recommend API] Fatal error:', error)
        return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject') || 'science'
    const classLevel = parseInt(searchParams.get('class_level') || '6')

    const fallback = buildRuleBasedRecommendations(subject, classLevel, null)
    return NextResponse.json({ subject, class_level: classLevel, ...fallback })
}
