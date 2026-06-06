import { NextRequest, NextResponse } from 'next/server'
import { getStudentMetricsLogs, saveStudentMetricsLog } from '@/lib/serverDb'
import { LogEntry } from '@/lib/serverDb'

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const studentId = params.id
        const logs = getStudentMetricsLogs(studentId)
        return NextResponse.json(logs)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const studentId = params.id
        const body = await request.json()
        const { scores, notes } = body

        if (!scores) {
            return NextResponse.json({ error: 'Scores are required' }, { status: 400 })
        }

        const log: LogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            studentId,
            date: new Date().toISOString().split('T')[0],
            scores,
            notes
        }

        saveStudentMetricsLog(studentId, log)
        return NextResponse.json(log)
    } catch (e) {
        console.error('Error saving metrics log:', e)
        return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
    }
}
