import { NextRequest, NextResponse } from 'next/server'
import { saveStudentPlan } from '@/lib/serverDb'

// Compute an overall cognitive score from 0-100
function computeCognitiveScore(params: {
    score?: number
    wpm?: number
    comfortScore?: number
    attentionSpanScore?: number
    durationSec?: number
}): number {
    const { score, wpm, comfortScore, attentionSpanScore } = params
    const weights: number[] = []
    const values: number[] = []

    if (score !== undefined) { values.push(score); weights.push(0.35) }
    if (wpm !== undefined) {
        const wpmNorm = Math.min(100, Math.max(0, ((wpm - 80) / 120) * 100))
        values.push(wpmNorm); weights.push(0.25)
    }
    if (comfortScore !== undefined) { values.push(comfortScore); weights.push(0.20) }
    if (attentionSpanScore !== undefined) { values.push(attentionSpanScore); weights.push(0.20) }

    if (values.length === 0) return 60
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    const weighted = values.reduce((sum, v, i) => sum + v * weights[i], 0)
    return Math.round(weighted / totalWeight)
}

// Build the structured fallback plan as JSON
function buildFallbackPlan(params: {
    studentName: string
    profile: string
    cognitiveScore: number
    cogLevel: string
    score?: number
    wpm?: number
    comfortScore?: number
    attentionSpanScore?: number
    durationSec?: number
    chapterTitle: string
    profileGuidance: string
}) {
    const { studentName, profile, cognitiveScore, cogLevel, score, wpm, comfortScore, attentionSpanScore, durationSec, chapterTitle } = params
    const p = profile.toLowerCase()
    const isADHD = p.includes('adhd')
    const isDyslexia = p.includes('dyslexia') || p.includes('dyslexic')
    const isAutism = p.includes('autism') || p.includes('autistic')
    const isAnxiety = p.includes('anxiety')

    const sessionMin = isADHD ? 15 : 25
    const breakMin = isADHD ? 8 : 5

    const scoreLevel =
        cognitiveScore >= 80 ? 'Excellent' :
        cognitiveScore >= 65 ? 'Good' :
        cognitiveScore >= 50 ? 'Developing' : 'Needs Support'

    const scoreMsg =
        cognitiveScore >= 80 ? 'You are performing excellently! Keep up this great momentum.' :
        cognitiveScore >= 65 ? 'You are making solid progress. Focus on the areas below to grow further.' :
        cognitiveScore >= 50 ? 'You are developing well. A structured routine will help you improve steadily.' :
        'You need extra support right now. Short, gentle sessions will help rebuild your confidence.'

    // Speed rating
    const speedRating =
        wpm === undefined ? 'Not measured' :
        wpm >= 200 ? 'Advanced' :
        wpm >= 150 ? 'Proficient' :
        wpm >= 100 ? 'Average' : 'Below Average'

    // Attention rating
    const attentionRating =
        attentionSpanScore === undefined ? 'Not measured' :
        attentionSpanScore >= 80 ? 'Excellent' :
        attentionSpanScore >= 60 ? 'Good' :
        attentionSpanScore >= 40 ? 'Fair' : 'Needs Work'

    // Focus rating (comfort score proxy)
    const focusRating =
        comfortScore === undefined ? 'Not measured' :
        comfortScore >= 85 ? 'High Focus' :
        comfortScore >= 70 ? 'Moderate Focus' :
        comfortScore >= 55 ? 'Low Focus' : 'Distracted'

    const cognitiveMetrics = [
        {
            metric: 'Overall Cognitive Score',
            value: `${cognitiveScore} / 100`,
            level: cogLevel,
            insight: scoreMsg
        },
        {
            metric: 'Reading Speed',
            value: wpm !== undefined ? `${wpm} WPM` : 'Not measured',
            level: speedRating,
            insight: wpm !== undefined && wpm < 120
                ? 'Use text-to-speech support to supplement reading daily.'
                : wpm !== undefined && wpm < 160
                ? 'Practice timed reading drills to build fluency.'
                : 'Excellent reading speed. Maintain with diverse texts.'
        },
        {
            metric: 'Attention & Focus',
            value: attentionSpanScore !== undefined ? `${attentionSpanScore}%` : 'Not measured',
            level: attentionRating,
            insight: attentionSpanScore !== undefined && attentionSpanScore < 60
                ? 'Short timed sessions and movement breaks will strengthen attention.'
                : 'Good attention span. Pomodoro sessions will maintain this.'
        },
        {
            metric: 'Comfort & Focus Score',
            value: comfortScore !== undefined ? `${comfortScore}%` : 'Not measured',
            level: focusRating,
            insight: comfortScore !== undefined && comfortScore < 70
                ? 'Enable accessibility tools like reading ruler and TTS to improve comfort.'
                : 'Great use of adaptive tools. Continue using them consistently.'
        },
        {
            metric: 'Quiz Accuracy',
            value: score !== undefined ? `${score}%` : 'Not measured',
            level: score === undefined ? 'N/A' : score >= 80 ? 'Strong' : score >= 60 ? 'Average' : 'Needs Practice',
            insight: score !== undefined && score < 70
                ? 'Review core facts and glossary terms before each session.'
                : 'Strong recall. Continue using spaced repetition to lock in knowledge.'
        },
        {
            metric: 'Session Duration',
            value: durationSec !== undefined ? `${Math.round(durationSec / 60)} min` : 'Not measured',
            level: durationSec === undefined ? 'N/A' : durationSec > 1800 ? 'Long' : durationSec > 900 ? 'Moderate' : 'Short',
            insight: durationSec !== undefined && durationSec < 600
                ? 'Try to extend sessions gradually to build stamina.'
                : 'Good session length. Balance with proper breaks.'
        }
    ]

    const dailyRoutine = [
        {
            time: '8:45 AM – 9:00 AM',
            activity: 'Morning Warm-Up',
            duration: '15 min',
            type: 'Preparation',
            description: isADHD
                ? 'Do 10 jumping jacks then review yesterday\'s key terms with flashcards.'
                : isDyslexia
                ? 'Listen to the chapter summary with text-to-speech. Write 3 key words you remember.'
                : 'Review yesterday\'s glossary silently. Write 3 things you remember.'
        },
        {
            time: `9:00 AM – 9:${sessionMin < 10 ? '0' : ''}${sessionMin} AM`,
            activity: 'Active Study Block 1',
            duration: `${sessionMin} min`,
            type: 'Core Learning',
            description: `Read one simplified section of ${chapterTitle}. Highlight the main idea and 2 key terms.`
        },
        {
            time: `9:${sessionMin} AM – 9:${sessionMin + breakMin} AM`,
            activity: isADHD ? 'Movement Break' : 'Calm Break',
            duration: `${breakMin} min`,
            type: 'Break',
            description: isADHD
                ? 'Walk around, stretch, or do 5 star jumps. No screens.'
                : isAnxiety
                ? '4-7-8 breathing: inhale 4 counts, hold 7, exhale 8. Repeat 3 times.'
                : 'Step away from the screen. Drink water and look at something distant.'
        },
        {
            time: `9:${sessionMin + breakMin} AM – 10:00 AM`,
            activity: 'Vocabulary Practice',
            duration: `${20 - breakMin} min`,
            type: 'Reinforcement',
            description: isDyslexia
                ? 'Spell each glossary word aloud. Break it into syllables. Write a simple sentence using it.'
                : 'Create a mini glossary card for each new term. Write definition in your own words.'
        },
        {
            time: '10:00 AM – 10:10 AM',
            activity: 'Snack & Recharge',
            duration: '10 min',
            type: 'Break',
            description: 'Have a healthy snack. Step outside briefly if possible. No study tasks.'
        },
        {
            time: `10:10 AM – 10:${10 + sessionMin} AM`,
            activity: 'Active Study Block 2',
            duration: `${sessionMin} min`,
            type: 'Core Learning',
            description: `Read the next section of ${chapterTitle}. After reading, close the book and write 3 facts from memory.`
        },
        {
            time: '2:00 PM – 2:20 PM',
            activity: 'Afternoon Review',
            duration: '20 min',
            type: 'Review',
            description: isADHD
                ? 'Do a speed quiz: answer 5 flashcard questions in 10 minutes. Gamify it!'
                : 'Re-read today\'s simplified notes. Summarize each section in one sentence.'
        },
        {
            time: '2:20 PM – 2:30 PM',
            activity: 'Creative Break',
            duration: '10 min',
            type: 'Break',
            description: isADHD
                ? 'Draw a mind-map or doodle. Movement is key — try dancing to one song!'
                : 'Listen to calming music or do a gentle stretch. No screens.'
        },
        {
            time: '2:30 PM – 3:00 PM',
            activity: 'Practice Quiz',
            duration: '30 min',
            type: 'Assessment',
            description: `Complete the interactive quiz on your dashboard for ${chapterTitle}. Review any wrong answers immediately.`
        },
        {
            time: '6:00 PM – 6:15 PM',
            activity: 'Evening Wind-Down',
            duration: '15 min',
            type: 'Review',
            description: 'Skim through today\'s simplified notes one final time. Write one thing you learned and one question you still have.'
        },
        {
            time: '6:15 PM – 6:30 PM',
            activity: 'Reflection & Planning',
            duration: '15 min',
            type: 'Planning',
            description: 'Write tomorrow\'s 3 study goals in your notebook. Celebrate what you accomplished today!'
        }
    ]

    const tips = isADHD ? [
        'Use a physical timer for every study block — make it a game to beat the clock.',
        'Keep your study space clear. One book, one pen, nothing else on the desk.',
        'Reward yourself after every 2 completed blocks — a small treat or 5 minutes of a favourite activity.',
        'Alternate between different subject topics to keep engagement high.',
        'Use colour coding: different highlighter colours for definitions, facts, and examples.',
        'Record yourself summarizing a section — play it back while exercising.'
    ] : isDyslexia ? [
        'Always listen to the text-to-speech version before attempting to read it yourself.',
        'Use the OpenDyslexic font on all screens and the reading ruler for tracking.',
        'Spell words aloud and clap each syllable to build phonological memory.',
        'Write summaries using voice recording apps if handwriting is difficult.',
        'Ask your teacher for printed copies in a larger font with 1.5x line spacing.',
        'Pair each new word with a drawing or image in your notebook.'
    ] : isAutism ? [
        'Follow this routine at the exact same time every day — consistency is your superpower.',
        'Create a visual schedule with checkboxes for each study block.',
        'Use noise-cancelling headphones or earplugs to control sensory input during study.',
        'Stick to one subject per session to avoid task-switching overwhelm.',
        'Take sensory regulation breaks: fidget toys, weighted blanket, or quiet room.',
        'Use precise, literal instructions for yourself: write exactly what you will do next.'
    ] : isAnxiety ? [
        'Start each session with 3 deep breaths before opening any book.',
        'Write a "worry list" before studying — park your anxieties on paper, then focus.',
        'Use gentle timers with soft sounds — avoid harsh alarm bells.',
        'Celebrate small wins loudly: "I read one section today — that is real progress!"',
        'If you feel stuck, skip and come back — not finishing one question is perfectly fine.',
        'Talk to your teacher or parent if anxiety is affecting your ability to focus.'
    ] : [
        'Use spaced repetition: review material after 1 day, 3 days, 7 days, and 14 days.',
        'Test yourself before re-reading — retrieval practice beats passive re-reading.',
        'Use the Feynman Technique: explain each concept as if teaching a 10-year-old.',
        'Study in the same place and at the same time daily to build a learning habit.',
        'Celebrate every chapter completed — you earn XP and Focus Coins each time!',
        'If you feel overwhelmed, use the breathing exercise tool on your dashboard.'
    ]

    const recommendations = [
        score !== undefined && score < 70
            ? `Quiz accuracy is ${score}%. Prioritise reviewing core facts and completing the glossary quiz daily before moving to new material.`
            : null,
        wpm !== undefined && wpm < 120
            ? `Reading speed is ${wpm} WPM (below average). Enable text-to-speech for every chapter and practice timed reading exercises 3 times per week.`
            : null,
        attentionSpanScore !== undefined && attentionSpanScore < 60
            ? `Attention flow is at ${attentionSpanScore}%. Use ${sessionMin}-minute study blocks with mandatory breaks. The Pomodoro timer on your dashboard is configured for this.`
            : null,
        comfortScore !== undefined && comfortScore < 70
            ? `Comfort score is ${comfortScore}%. Activate the reading ruler and text-to-speech on every reading session to boost accessibility support.`
            : null,
        `This study plan is specifically designed for your ${profile} cognitive profile. Stick to the time blocks consistently for at least 2 weeks to see measurable improvement.`,
        `Because your cognitive score is ${cognitiveScore} in this evaluation, this study plan is designed to be better suited to your learning pace and rhythm.`
    ].filter(Boolean) as string[]

    return {
        studentName,
        cognitiveScore,
        cogLevel: scoreLevel,
        scoreMessage: scoreMsg,
        chapterTitle,
        profile,
        cognitiveMetrics,
        dailyRoutine,
        tips,
        recommendations,
        generatedAt: new Date().toISOString()
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            studentId,
            studentName,
            profile,
            score,
            wpm,
            comfortScore,
            attentionSpanScore,
            chapterTitle,
            durationSec
        } = body

        const cognitiveScore = computeCognitiveScore({ score, wpm, comfortScore, attentionSpanScore, durationSec })
        const cogLevel =
            cognitiveScore >= 80 ? 'Excellent' :
            cognitiveScore >= 65 ? 'Good' :
            cognitiveScore >= 50 ? 'Developing' : 'Needs Support'

        let profileGuidance = ''
        if (profile) {
            const p = profile.toLowerCase()
            if (p.includes('adhd')) profileGuidance = 'ADHD student: short bursts, movement breaks, gamified language.'
            else if (p.includes('dyslexia')) profileGuidance = 'Dyslexia: audio methods, phonetic practice, multi-sensory.'
            else if (p.includes('autism')) profileGuidance = 'Autism: predictable routine, literal explanations, sensory breaks.'
            else if (p.includes('anxiety')) profileGuidance = 'Anxiety: calm language, breathing breaks, no time pressure.'
            else if (p.includes('slow')) profileGuidance = 'Slow learner: repetition, concrete examples, longer time per topic.'
        }

        // Try Gemini API first
        let structuredPlan: any = null
        const apiKey = process.env.GEMINI_API_KEY

        if (apiKey) {
            try {
                const geminiPrompt = `You are an expert educational psychologist specializing in neurodivergent learners.
Generate a personalized study plan as a JSON object for a student with these details:

Student Name: ${studentName || 'Student'}
Profile: ${profile || 'General'}
Profile Guidance: ${profileGuidance || 'General learner'}
Chapter: ${chapterTitle || 'Recent Chapter'}
Cognitive Score: ${cognitiveScore}/100 (${cogLevel})
Quiz Accuracy: ${score !== undefined ? score + '%' : 'Not available'}
Reading Speed: ${wpm !== undefined ? wpm + ' WPM' : 'Not available'}
Comfort Score: ${comfortScore !== undefined ? comfortScore + '%' : 'Not available'}
Attention Span: ${attentionSpanScore !== undefined ? attentionSpanScore + '%' : 'Not available'}
Session Duration: ${durationSec ? Math.round(durationSec / 60) + ' minutes' : 'Not available'}

Return ONLY a valid JSON object with this exact structure (no markdown):
{
  "studentName": "string",
  "cognitiveScore": number,
  "cogLevel": "string",
  "scoreMessage": "string (warm encouraging message about the score)",
  "chapterTitle": "string",
  "profile": "string",
  "cognitiveMetrics": [
    {
      "metric": "string (e.g. Reading Speed)",
      "value": "string (e.g. 120 WPM)",
      "level": "string (e.g. Average)",
      "insight": "string (1-2 sentence actionable insight)"
    }
  ],
  "dailyRoutine": [
    {
      "time": "string (e.g. 9:00 AM – 9:25 AM)",
      "activity": "string",
      "duration": "string (e.g. 25 min)",
      "type": "string (Core Learning | Break | Review | Assessment | Planning | Preparation | Reinforcement)",
      "description": "string (1-2 sentences of what to do)"
    }
  ],
  "tips": ["string (actionable study tip 1)", "string (tip 2)", "string (tip 3)", "string (tip 4)", "string (tip 5)"],
  "recommendations": ["string (personalized recommendation 1)", "string (rec 2)", "string (rec 3)"],
  "generatedAt": "string (ISO date)"
}

Make the cognitiveMetrics array have exactly 5 entries covering: Overall Cognitive Score, Reading Speed, Attention, Comfort & Focus, Quiz Accuracy.
Make the dailyRoutine have 8-12 entries covering morning, afternoon, and evening.
Make tips array have exactly 5-6 entries tailored to the ${profile || 'general'} profile.
Make recommendations array have 3-5 personalized entries based on the student's data.
Include this exact phrase in scoreMessage: "Because your cognitive score is ${cognitiveScore} in this evaluation, this study plan is designed to be better suited to your learning pace and rhythm."`

                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: geminiPrompt }] }],
                            generationConfig: { responseMimeType: 'application/json' }
                        }),
                        signal: AbortSignal.timeout(30000)
                    }
                )

                if (geminiRes.ok) {
                    const geminiData = await geminiRes.json()
                    const jsonStr = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
                    if (jsonStr) {
                        structuredPlan = JSON.parse(jsonStr)
                        structuredPlan.cognitiveScore = cognitiveScore // ensure correct score
                        structuredPlan.generatedAt = new Date().toISOString()
                    }
                }
            } catch (geminiErr: any) {
                console.warn('Gemini plan generation failed, using fallback:', geminiErr.message)
            }
        }

        // Use fallback if Gemini failed
        if (!structuredPlan) {
            structuredPlan = buildFallbackPlan({
                studentName: studentName || 'Student',
                profile: profile || 'general',
                cognitiveScore,
                cogLevel,
                score,
                wpm,
                comfortScore,
                attentionSpanScore,
                durationSec,
                chapterTitle: chapterTitle || 'Recent Chapter',
                profileGuidance
            })
        }

        // Save plan as JSON string to DB
        if (studentId) {
            try { saveStudentPlan(studentId, JSON.stringify(structuredPlan)) } catch (_) {}
        }

        return NextResponse.json({
            plan: JSON.stringify(structuredPlan),
            cognitiveScore,
            cogLevel,
            structured: structuredPlan
        })
    } catch (error: any) {
        console.error('Generate plan error:', error)
        return NextResponse.json({ error: 'Failed to generate study plan.' }, { status: 500 })
    }
}
