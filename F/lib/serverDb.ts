import fs from 'fs'
import path from 'path'
import { ChapterData, ProcessingStatus } from './types'

const DB_FILE = path.join(process.cwd(), 'chapters_db.json')

interface DbSchema {
    chapters: Record<string, ChapterData>
    jobs: Record<string, {
        status: ProcessingStatus
        metadata: {
            title: string
            subject: string
            class_level: number
            board: string
        }
        fallback?: boolean // set if processed by local AI fallback
    }>
    students?: Record<string, StudentData>
}

export interface StudentData {
    id: string
    name: string
    age: number
    profile: string
    metrics?: {
        attentionSpanSec: number
        readingWpm: number
        focusDurationSec: number
        mistakesPerQuiz: number
        recentStress: number
        completedLessons: number
        focusCoins: number
        xpPoints: number
    }
    logs: LogEntry[]
    recommendedPlan?: string
}

export interface LogEntry {
    id: string
    studentId: string
    date: string
    scores: Record<string, number>
    notes?: string
}


function initDb(): DbSchema {
    if (!fs.existsSync(DB_FILE)) {
        const initial: DbSchema = { chapters: {}, jobs: {} }
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8')
        return initial
    }
    try {
        const content = fs.readFileSync(DB_FILE, 'utf-8')
        return JSON.parse(content)
    } catch (e) {
        console.error('Failed to parse database file, resetting', e)
        const initial: DbSchema = { chapters: {}, jobs: {} }
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8')
        return initial
    }
}

export function saveChapter(chapter: ChapterData) {
    const db = initDb()
    db.chapters[chapter.chapter_id] = chapter
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

export function getChapterFromDb(chapterId: string): ChapterData | null {
    const db = initDb()
    return db.chapters[chapterId] || null
}

export function getAllChapters(): ChapterData[] {
    const db = initDb()
    return Object.values(db.chapters).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
}

export function deleteChapterFromDb(chapterId: string) {
    const db = initDb()
    delete db.chapters[chapterId]
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

export function saveJob(jobId: string, status: ProcessingStatus, metadata: any, fallback = false) {
    const db = initDb()
    db.jobs[jobId] = { status, metadata, fallback }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

export function getJob(jobId: string) {
    const db = initDb()
    return db.jobs[jobId] || null
}

export function getAllJobs() {
    const db = initDb()
    return db.jobs
}

export function saveStudent(student: StudentData) {
    const db = initDb()
    if (!db.students) db.students = {}
    db.students[student.id] = student
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

export function getStudentFromDb(studentId: string): StudentData | null {
    const db = initDb()
    if (!db.students) return null
    return db.students[studentId] || null
}

export function getAllStudents(): StudentData[] {
    const db = initDb()
    if (!db.students || Object.keys(db.students).length === 0) {
        // Return default seed students if db is empty
        return [
            { id: 's1', name: 'Rohan Sharma', age: 9, profile: 'ADHD / High Energy', logs: [] },
            { id: 's2', name: 'Aisha Patel', age: 8, profile: 'Dyslexia / Audio-Learner', logs: [] },
            { id: 's3', name: 'Kabir Sen', age: 10, profile: 'Autism / Structured Flow', logs: [] }
        ]
    }
    return Object.values(db.students)
}

export function saveStudentMetricsLog(studentId: string, log: LogEntry) {
    const db = initDb()
    if (!db.students) db.students = {}
    if (!db.students[studentId]) {
        db.students[studentId] = {
            id: studentId,
            name: `Student ${studentId.slice(-4)}`,
            age: 9,
            profile: 'custom',
            logs: []
        }
    }
    
    if (!db.students[studentId].logs) db.students[studentId].logs = []
    db.students[studentId].logs.push(log)
    
    // Update active metrics
    if (log.scores) {
        if (!db.students[studentId].metrics) {
            db.students[studentId].metrics = {
                attentionSpanSec: 240,
                readingWpm: 150,
                focusDurationSec: 300,
                mistakesPerQuiz: 1,
                recentStress: 0.2,
                completedLessons: 1,
                focusCoins: 10,
                xpPoints: 50
            }
        }
        
        const m = db.students[studentId].metrics!
        if (log.scores.marks !== undefined) {
             m.mistakesPerQuiz = log.scores.marks >= 90 ? 0 : log.scores.marks >= 75 ? 1 : 2
             m.readingWpm = log.scores.wpm !== undefined ? log.scores.wpm : m.readingWpm
        }
        if (log.scores.confidence !== undefined) {
             m.recentStress = Math.max(0, parseFloat((1 - (log.scores.confidence / 10)).toFixed(2)))
        }
        m.completedLessons += 1
        m.xpPoints += 20
        m.focusCoins += 5
    }
    
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

export function getStudentMetricsLogs(studentId: string): LogEntry[] {
    const db = initDb()
    if (!db.students || !db.students[studentId] || !db.students[studentId].logs || db.students[studentId].logs.length === 0) {
        // Return default seeds for display
        const defaultLogs = [
            { id: 'l1', studentId: 's1', date: '2026-05-25', scores: { marks: 75, participation: 6, projects: 5, activities: 8, confidence: 7 }, notes: 'Good focus during the morning science burst.' },
            { id: 'l2', studentId: 's1', date: '2026-05-27', scores: { marks: 80, participation: 8, projects: 7, activities: 9, confidence: 8 }, notes: 'Excellent participation during interactive quizzes.' },
            { id: 'l3', studentId: 's1', date: '2026-05-29', scores: { marks: 85, participation: 7, projects: 8, activities: 7, confidence: 9 }, notes: 'Very high confidence today. One-task-at-a-time helped him stay on track.' },
            { id: 'l4', studentId: 's2', date: '2026-05-24', scores: { marks: 70, participation: 7, projects: 6, activities: 5, confidence: 6 }, notes: 'Used text-to-speech to complete the NCERT reading unit.' },
            { id: 'l5', studentId: 's2', date: '2026-05-26', scores: { marks: 78, participation: 8, projects: 8, activities: 6, confidence: 7 }, notes: 'Spaced review cycles helped reinforce vocabulary matches.' },
            { id: 'l6', studentId: 's2', date: '2026-05-28', scores: { marks: 82, participation: 9, projects: 9, activities: 7, confidence: 8 }, notes: 'Read with OpenDyslexic font.' }
        ]
        return defaultLogs.filter(l => l.studentId === studentId)
    }
    return db.students[studentId].logs
}

export function saveStudentPlan(studentId: string, plan: string) {
    const db = initDb()
    if (!db.students) db.students = {}
    if (!db.students[studentId]) {
        db.students[studentId] = {
            id: studentId,
            name: `Student ${studentId.slice(-4)}`,
            age: 9,
            profile: 'custom',
            logs: []
        }
    }
    db.students[studentId].recommendedPlan = plan
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

export function getStudentPlan(studentId: string): string | null {
    const db = initDb()
    if (!db.students || !db.students[studentId]) return null
    return db.students[studentId].recommendedPlan || null
}

