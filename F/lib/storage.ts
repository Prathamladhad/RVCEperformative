import { StudentPrefs } from './types'

const PREFS_KEY = 'neuroadapt_student_prefs'
const PROGRESS_KEY = 'neuroadapt_progress'
const CHAPTERS_KEY = 'neuroadapt_chapters_cache'

const DEFAULT_PREFS: StudentPrefs = {
    font: 'opendyslexic',
    fontSize: 18,
    lineHeight: 1.8,
    letterSpacing: 0.05,
    background: 'cream',
    showRuler: true,
    ttsSpeed: 1,
    ttsAutoPlay: false,
}

export function getStudentPrefs(): StudentPrefs {
    if (typeof window === 'undefined') return DEFAULT_PREFS

    try {
        const stored = localStorage.getItem(PREFS_KEY)
        return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS
    } catch {
        return DEFAULT_PREFS
    }
}

export function saveStudentPrefs(prefs: Partial<StudentPrefs>): void {
    if (typeof window === 'undefined') return

    try {
        const current = getStudentPrefs()
        const updated = { ...current, ...prefs }
        localStorage.setItem(PREFS_KEY, JSON.stringify(updated))
    } catch (error) {
        console.error('Failed to save student preferences:', error)
    }
}

export function resetStudentPrefs(): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.removeItem(PREFS_KEY)
    } catch (error) {
        console.error('Failed to reset student preferences:', error)
    }
}

export function getChapterProgress(chapterId: string): {
    currentChunkIndex: number
    completedChunks: string[]
} {
    if (typeof window === 'undefined') return { currentChunkIndex: 0, completedChunks: [] }

    try {
        const progress = localStorage.getItem(`${PROGRESS_KEY}_${chapterId}`)
        return progress
            ? JSON.parse(progress)
            : { currentChunkIndex: 0, completedChunks: [] }
    } catch {
        return { currentChunkIndex: 0, completedChunks: [] }
    }
}

export function saveChapterProgress(
    chapterId: string,
    currentChunkIndex: number,
    completedChunks: string[]
): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(
            `${PROGRESS_KEY}_${chapterId}`,
            JSON.stringify({ currentChunkIndex, completedChunks })
        )
    } catch (error) {
        console.error('Failed to save chapter progress:', error)
    }
}

export function cacheChapterData(chapterId: string, data: any): void {
    if (typeof window === 'undefined') return

    try {
        const cache = JSON.parse(localStorage.getItem(CHAPTERS_KEY) || '{}')
        cache[chapterId] = {
            data,
            timestamp: Date.now(),
        }
        localStorage.setItem(CHAPTERS_KEY, JSON.stringify(cache))
    } catch (error) {
        console.error('Failed to cache chapter data:', error)
    }
}

export function getCachedChapterData(chapterId: string): any | null {
    if (typeof window === 'undefined') return null

    try {
        const cache = JSON.parse(localStorage.getItem(CHAPTERS_KEY) || '{}')
        const cached = cache[chapterId]

        if (!cached) return null

        const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000
        if (isExpired) {
            delete cache[chapterId]
            localStorage.setItem(CHAPTERS_KEY, JSON.stringify(cache))
            return null
        }

        return cached.data
    } catch {
        return null
    }
}

export function clearChapterCache(chapterId?: string): void {
    if (typeof window === 'undefined') return

    try {
        if (chapterId) {
            const cache = JSON.parse(localStorage.getItem(CHAPTERS_KEY) || '{}')
            delete cache[chapterId]
            localStorage.setItem(CHAPTERS_KEY, JSON.stringify(cache))
        } else {
            localStorage.removeItem(CHAPTERS_KEY)
        }
    } catch (error) {
        console.error('Failed to clear chapter cache:', error)
    }
}
