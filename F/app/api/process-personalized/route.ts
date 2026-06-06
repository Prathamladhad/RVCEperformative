import { NextRequest, NextResponse } from 'next/server'
import { getChapterFromDb, getStudentFromDb } from '@/lib/serverDb'
import { generateChapterWithAI } from '@/lib/aiFallback'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { chapterId, studentId, studentMetrics: bodyMetrics } = body

        if (!chapterId) {
            return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 })
        }

        let resolvedChapterId = chapterId
        if (resolvedChapterId && resolvedChapterId.length === 6) {
            const localMatch = getChapterFromDb(resolvedChapterId)
            if (localMatch) {
                resolvedChapterId = localMatch.chapter_id
            } else {
                try {
                    console.log(`Resolving share code ${resolvedChapterId} in process-personalized route...`)
                    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
                    const shareRes = await fetch(`${BACKEND_URL}/share/${resolvedChapterId}`, {
                        method: 'GET',
                        cache: 'no-store',
                        signal: AbortSignal.timeout(5000)
                    })
                    if (shareRes.ok) {
                        const sharedChapter = await shareRes.json()
                        if (sharedChapter && sharedChapter.chapter_id) {
                            saveChapter(sharedChapter)
                            resolvedChapterId = sharedChapter.chapter_id
                        }
                    }
                } catch (shareErr) {
                    console.warn(`Failed to resolve share code in personalization route:`, shareErr)
                }
            }
        }

        const baseChapter = getChapterFromDb(resolvedChapterId)
        if (!baseChapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
        }

        // Get student metrics
        let studentMetrics = bodyMetrics
        if (!studentMetrics && studentId) {
            const student = getStudentFromDb(studentId)
            if (student) {
                studentMetrics = {
                    profile: student.profile,
                    readingWpm: student.metrics?.readingWpm || 150,
                    attentionSpanSec: student.metrics?.attentionSpanSec || 300,
                    recentStress: student.metrics?.recentStress || 0.1
                }
            }
        }

        // Fallback default metrics if none could be resolved
        if (!studentMetrics) {
            studentMetrics = {
                profile: 'ADHD / High Energy',
                readingWpm: 120,
                attentionSpanSec: 240
            }
        }

        // Reconstruct the full text from the chunks to re-simplify personalized for the student
        const fullText = baseChapter.chunks.map(chunk => chunk.original_text || chunk.simplified_text).join('\n\n')

        // If no Gemini API key is configured, return the pre-simplified base chapter directly
        const apiKey = process.env.GEMINI_API_KEY
        const isKeyConfigured = apiKey && apiKey !== 'undefined' && apiKey !== 'null' && apiKey.trim() !== ''
        if (!isKeyConfigured) {
            console.warn(`[process-personalized] GEMINI_API_KEY is not configured or invalid (${apiKey}). Returning pre-simplified base chapter.`)
            return NextResponse.json(baseChapter)
        }

        try {
            const personalizedChapter = await generateChapterWithAI(fullText, {
                title: baseChapter.title,
                subject: baseChapter.subject,
                class_level: baseChapter.class_level,
                board: baseChapter.board,
                id: baseChapter.chapter_id
            }, studentMetrics)

            return NextResponse.json(personalizedChapter)
        } catch (aiErr) {
            console.error('[process-personalized] Local AI personalization failed, falling back to pre-simplified base chapter:', aiErr)
            return NextResponse.json(baseChapter)
        }

    } catch (e) {
        console.error('Error generating personalized chapter:', e)
        return NextResponse.json({ error: 'Failed to generate personalized chapter' }, { status: 500 })
    }
}
