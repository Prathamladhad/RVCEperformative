'use client'

import { useState, useCallback, useEffect } from 'react'
import { getChapterProgress, saveChapterProgress } from '@/lib/storage'

export function useReading(chapterId: string, totalChunks: number) {
    const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
    const [completedChunks, setCompletedChunks] = useState<string[]>([])
    const [ttsActive, setTtsActive] = useState(false)
    const [ttsPlaying, setTtsPlaying] = useState(false)
    const [activeWordIndex, setActiveWordIndex] = useState(-1)

    // Load progress from localStorage on mount
    useEffect(() => {
        const progress = getChapterProgress(chapterId)
        setCurrentChunkIndex(progress.currentChunkIndex)
        setCompletedChunks(progress.completedChunks)
    }, [chapterId])

    const saveProgress = useCallback(
        (chunkIndex: number, completed: string[]) => {
            saveChapterProgress(chapterId, chunkIndex, completed)
        },
        [chapterId]
    )

    const nextChunk = useCallback(() => {
        if (currentChunkIndex < totalChunks - 1) {
            const newIndex = currentChunkIndex + 1
            setCurrentChunkIndex(newIndex)
            saveProgress(newIndex, completedChunks)
        }
    }, [currentChunkIndex, totalChunks, completedChunks, saveProgress])

    const prevChunk = useCallback(() => {
        if (currentChunkIndex > 0) {
            const newIndex = currentChunkIndex - 1
            setCurrentChunkIndex(newIndex)
            saveProgress(newIndex, completedChunks)
        }
    }, [currentChunkIndex, completedChunks, saveProgress])

    const markComplete = useCallback(
        (chunkId: string) => {
            if (!completedChunks.includes(chunkId)) {
                const updated = [...completedChunks, chunkId]
                setCompletedChunks(updated)
                saveProgress(currentChunkIndex, updated)
            }
        },
        [completedChunks, currentChunkIndex, saveProgress]
    )

    const startTTS = useCallback(() => {
        setTtsActive(true)
        setTtsPlaying(true)
    }, [])

    const pauseTTS = useCallback(() => {
        setTtsPlaying(false)
    }, [])

    const resumeTTS = useCallback(() => {
        setTtsPlaying(true)
    }, [])

    const stopTTS = useCallback(() => {
        setTtsActive(false)
        setTtsPlaying(false)
        setActiveWordIndex(-1)
    }, [])

    const setActiveWord = useCallback((index: number) => {
        setActiveWordIndex(index)
    }, [])

    const progressPercentage = Math.round((currentChunkIndex / totalChunks) * 100)

    return {
        currentChunkIndex,
        setCurrentChunkIndex,
        completedChunks,
        ttsActive,
        ttsPlaying,
        activeWordIndex,
        nextChunk,
        prevChunk,
        markComplete,
        startTTS,
        pauseTTS,
        resumeTTS,
        stopTTS,
        setActiveWord,
        progressPercentage,
    }
}
