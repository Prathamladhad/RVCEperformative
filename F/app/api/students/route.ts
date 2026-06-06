import { NextRequest, NextResponse } from 'next/server'
import { getAllStudents, saveStudent } from '@/lib/serverDb'

export async function GET() {
    try {
        const students = getAllStudents()
        return NextResponse.json(students)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, name, age, profile, metrics } = body

        if (!id || !name) {
            return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 })
        }

        const newStudent = {
            id,
            name,
            age: age || 9,
            profile: profile || 'custom',
            metrics: metrics || {
                attentionSpanSec: 300,
                readingWpm: 150,
                focusDurationSec: 300,
                mistakesPerQuiz: 0,
                recentStress: 0.1,
                completedLessons: 0,
                focusCoins: 0,
                xpPoints: 0
            },
            logs: []
        }

        saveStudent(newStudent)
        return NextResponse.json(newStudent)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to register student' }, { status: 500 })
    }
}
