export interface ChunkObject {
    chunk_id: string
    original_text: string
    simplified_text: string
    key_terms: string[]
    syllable_map: Record<string, string>
    phonetic_map: Record<string, string>
    core_facts: string[]
    objective: string
    numbers: string[]
    numbers_plain: string[]
    glossary: Record<string, string>
    word_count: number
}

export interface ChapterData {
    chapter_id: string
    title: string
    subject: string
    class_level: number
    board: string
    chunks: ChunkObject[]
    created_at: string
    approved: boolean
}

export interface StudentPrefs {
    font: 'opendyslexic' | 'lexend' | 'system'
    fontSize: number
    lineHeight: number
    letterSpacing: number
    background: 'cream' | 'white' | 'blue' | 'dark' | 'sensory' | 'warm'
    showRuler: boolean
    ttsSpeed: number
    ttsAutoPlay: boolean
    contrast?: 'standard' | 'high'
    motion?: 'normal' | 'reduced'
    voiceNarration?: boolean
    speechRate?: number
}

export interface ProcessingStatus {
    stage: 'idle' | 'extracting' | 'cleaning' | 'chunking' | 'identifying' | 'simplifying' | 'rendering' | 'complete' | 'error'
    progress: number
    message: string
    chunk_current: number
    chunk_total: number
}

export interface UploadMetadata {
    file?: File
    text?: string
    class_level: number
    subject: string
    board: string
}
