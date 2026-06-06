'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChapterData } from '@/lib/types'
import { getChapter } from '@/lib/api'
import { getCachedChapterData, cacheChapterData } from '@/lib/storage'

export function useChapter(chapterId: string, studentId?: string | null) {
    const [chapter, setChapter] = useState<ChapterData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchChapter = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            // Check cache first (only for non-personalized base chapters)
            if (!studentId) {
                const cached = getCachedChapterData(chapterId)
                if (cached) {
                    setChapter(cached)
                    setLoading(false)
                    return
                }
            }

            // Fetch from API
            let data: ChapterData
            if (studentId) {
                const res = await fetch('/api/process-personalized', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chapterId, studentId })
                })
                if (!res.ok) {
                    throw new Error('Failed to personalize chapter')
                }
                data = await res.json()
            } else {
                data = await getChapter(chapterId)
                cacheChapterData(chapterId, data)
            }
            
            setChapter(data)
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch chapter')
            setError(error)
        } finally {
            setLoading(false)
        }
    }, [chapterId, studentId])

    useEffect(() => {
        fetchChapter()
    }, [fetchChapter])

    return {
        chapter,
        loading,
        error,
        refetch: fetchChapter,
    }
}
