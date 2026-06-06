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

        const baseChapter = getChapterFromDb(chapterId)
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

        console.log(`Generating personalized chapter for student ID: ${studentId || 'default'}, Profile: ${studentMetrics.profile}, WPM: ${studentMetrics.readingWpm}`)

        const personalizedChapter = await generateChapterWithAI(fullText, {
            title: baseChapter.title,
            subject: baseChapter.subject,
            class_level: baseChapter.class_level,
            board: baseChapter.board,
            id: baseChapter.chapter_id
        }, studentMetrics)

        return NextResponse.json(personalizedChapter)

    } catch (e) {
        console.error('Error generating personalized chapter:', e)
        return NextResponse.json({ error: 'Failed to generate personalized chapter' }, { status: 500 })
    }
}
