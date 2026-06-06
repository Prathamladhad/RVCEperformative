import { ChapterData, ProcessingStatus, UploadMetadata } from './types'

export interface StudentMetrics {
    attentionSpanSec?: number
    readingWpm?: number
    focusDurationSec?: number
    mistakesPerQuiz?: number
    recentStress?: number
    completedLessons?: number
    focusCoins?: number
    xpPoints?: number
    profile?: string
}

export interface Recommendation {
    subject: string
    class_level: number
    resources: {
        youtube?: Array<{ title: string; channel: string; url: string }>
        nptel?: Array<{ title: string; platform: string; url: string }>
        khan?: Array<{ title: string; platform: string; url: string }>
    }
    tips: string[]
    difficulty: string
    adaptations: string[]
    study_plan?: any
    activities?: Array<{
        name: string
        type: 'visual' | 'auditory' | 'kinesthetic' | 'structured'
        description: string
        duration_minutes: number
    }>
    study_timeline?: {
        total_days: number
        daily_minutes: number
        weekly_schedule: Array<{
            day: string
            focus: string
            activity: string
            duration_minutes: number
        }>
        checkpoints: Array<{ day: number; task: string }>
    }
    profile_insight?: string
    ai_powered?: boolean
}

export async function uploadAndProcess(metadata: UploadMetadata & { file?: File; text?: string }): Promise<{ chapter_id: string }> {
    const formData = new FormData()

    if (metadata.file) {
        formData.append('file', metadata.file)
    } else if (metadata.text) {
        formData.append('text', metadata.text)
    } else {
        throw new Error('Either file or text must be provided')
    }

    formData.append('class_level', metadata.class_level.toString())
    formData.append('subject', metadata.subject)
    formData.append('board', metadata.board)

    const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
    })

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
}

export async function getProcessingStatus(chapterId: string): Promise<ProcessingStatus> {
    const response = await fetch(`/api/processing-status/${chapterId}`)

    if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`)
    }

    return response.json()
}

export async function getChapter(chapterId: string): Promise<ChapterData> {
    const response = await fetch(`/api/chapters/${chapterId}`)

    if (!response.ok) {
        throw new Error(`Failed to fetch chapter: ${response.statusText}`)
    }

    return response.json()
}

export async function listChapters(): Promise<ChapterData[]> {
    const response = await fetch('/api/chapters')

    if (!response.ok) {
        throw new Error(`Failed to fetch chapters: ${response.statusText}`)
    }

    return response.json()
}

export async function approveChapter(chapterId: string): Promise<ChapterData> {
    const response = await fetch(`/api/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
    })

    if (!response.ok) {
        throw new Error(`Failed to approve chapter: ${response.statusText}`)
    }

    return response.json()
}

export async function updateChunkText(
    chapterId: string,
    chunkId: string,
    simplifiedText: string
): Promise<void> {
    const response = await fetch(`/api/chapters/${chapterId}/chunks/${chunkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simplified_text: simplifiedText }),
    })

    if (!response.ok) {
        throw new Error(`Failed to update chunk: ${response.statusText}`)
    }
}

export async function getChapterByCode(shareCode: string): Promise<ChapterData> {
    const response = await fetch(`/api/share/${shareCode}`)

    if (!response.ok) {
        throw new Error(`Chapter not found or not shared`)
    }

    return response.json()
}

export async function downloadChapterPDF(
    chapterId: string,
    includeOriginal: boolean = false,
    includeGlossary: boolean = true
): Promise<Blob> {
    const params = new URLSearchParams({
        include_original: includeOriginal.toString(),
        include_glossary: includeGlossary.toString(),
    })

    const response = await fetch(`/api/export-pdf/${chapterId}?${params}`)

    if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`)
    }

    return response.blob()
}

export async function getRecommendations(
    subject: string,
    classLevel: number,
    metrics?: StudentMetrics
): Promise<Recommendation> {
    const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subject: subject.toLowerCase(),
            class_level: classLevel,
            metrics: metrics || null,
        }),
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`)
    }

    return response.json()
}
