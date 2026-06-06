import { NextRequest, NextResponse } from 'next/server'
import { getChapterFromDb, saveChapter, getJob } from '@/lib/serverDb'
import { generateChapterWithAI } from '@/lib/aiFallback'
import { ChapterData } from '@/lib/types'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// Helper function to parse backend HTML into a valid structured ChapterData object
function parseHtmlToChapterData(html: string, metadata: { title: string; subject: string; class_level: number; board: string; id: string }): ChapterData {
    let paragraphs: string[] = []
    
    // Extract paragraphs from HTML structure
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
    let match
    while ((match = pRegex.exec(html)) !== null) {
        const text = match[1].replace(/<[^>]*>/g, '').trim()
        if (text) paragraphs.push(text)
    }
    
    // Fallback if no <p> tags are found (e.g. raw text or other tags)
    if (paragraphs.length === 0) {
        const cleanText = html.replace(/<[^>]*>/g, '').trim()
        paragraphs = cleanText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    }

    // If still empty, construct a single chunk with the full html stripped of tags
    if (paragraphs.length === 0) {
        paragraphs = [html.replace(/<[^>]*>/g, '').trim() || 'No readable text content.']
    }
    
    const chunks = paragraphs.map((text, idx) => {
        const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [text]
        const cleanText = text.replace(/\s+/g, ' ')
        
        // Extract 3-5 nouns or longer words as key terms
        const words = cleanText.replace(/[.,!?;:—]/g, '').split(/\s+/).filter(w => w.length > 5)
        const keyTerms = Array.from(new Set(words)).slice(0, 4)
        
        const coreFacts = sentences.slice(0, 3).map(s => s.trim())
        
        const glossary: Record<string, string> = {}
        keyTerms.forEach(term => {
            glossary[term] = `Important vocabulary term in this section: "${term}"`
        })

        return {
            chunk_id: `chunk-${idx}`,
            original_text: cleanText,
            simplified_text: cleanText,
            key_terms: keyTerms,
            syllable_map: {},
            phonetic_map: {},
            core_facts: coreFacts,
            objective: sentences[0] || 'Learn about this section.',
            numbers: [],
            numbers_plain: [],
            glossary: glossary,
            word_count: cleanText.split(/\s+/).length
        }
    })

    // Extract title from <h1> if available
    let title = metadata.title
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/i
    const h1Match = h1Regex.exec(html)
    if (h1Match && h1Match[1]) {
        title = h1Match[1].replace(/<[^>]*>/g, '').trim()
    }

    return {
        chapter_id: metadata.id,
        title: title || 'Condensed Chapter',
        subject: metadata.subject || 'science',
        class_level: metadata.class_level || 6,
        board: metadata.board || 'NCERT',
        chunks: chunks.length > 0 ? chunks : [{
            chunk_id: 'chunk-0',
            original_text: 'No text extracted',
            simplified_text: 'No text extracted from document.',
            key_terms: [],
            syllable_map: {},
            phonetic_map: {},
            core_facts: [],
            objective: 'Learn about this section.',
            numbers: [],
            numbers_plain: [],
            glossary: {},
            word_count: 0
        }],
        created_at: new Date().toISOString(),
        approved: false
    }
}

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const chapterId = params.id
        
        // 1. First, check if chapter already exists in our local server database
        const localChapter = getChapterFromDb(chapterId)
        if (localChapter) {
            return NextResponse.json(localChapter)
        }

        // 2. Check if there's metadata stored for this job
        const job = getJob(chapterId)
        const jobMetadata = job ? job.metadata : {
            title: 'New Chapter',
            subject: 'science',
            class_level: 6,
            board: 'NCERT'
        }

        // 3. Fetch from the backend result route
        console.log(`Fetching structured chapter result from backend: ${BACKEND_URL}/result/${chapterId}/structured`)
        let chapterData: ChapterData | null = null

        try {
            const response = await fetch(`${BACKEND_URL}/result/${chapterId}/structured`, {
                method: 'GET',
                cache: 'no-store',
                signal: AbortSignal.timeout(45000)
            })

            if (response.ok) {
                const structuredData = await response.json()
                chapterData = {
                    chapter_id: structuredData.chapter_id,
                    title: structuredData.title,
                    subject: structuredData.subject,
                    class_level: structuredData.class_level,
                    board: structuredData.board,
                    chunks: structuredData.chunks,
                    created_at: structuredData.created_at || new Date().toISOString(),
                    approved: structuredData.approved || false
                }
                console.log(`Successfully fetched structured data from backend. Chunks count: ${chapterData.chunks.length}`)
            } else {
                console.warn(`Backend structured result endpoint failed with status ${response.status}. Trying HTML fallback...`)
            }
        } catch (structuredErr) {
            console.warn(`Backend structured result endpoint unreachable. Trying HTML fallback...`, structuredErr)
        }

        if (!chapterData) {
            console.log(`Fetching legacy HTML chapter result from backend: ${BACKEND_URL}/result/${chapterId}`)
            const response = await fetch(`${BACKEND_URL}/result/${chapterId}`, {
                method: 'GET',
                cache: 'no-store',
                signal: AbortSignal.timeout(10000)
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch backend HTML result: status ${response.status}`)
            }

            const resultData = await response.json()
            const html = resultData.html || ''
            console.log(`Backend HTML result received. Length: ${html.length} chars.`)

            chapterData = parseHtmlToChapterData(html, {
                title: jobMetadata.title,
                subject: jobMetadata.subject,
                class_level: jobMetadata.class_level,
                board: jobMetadata.board,
                id: chapterId
            })
        }

        saveChapter(chapterData)
        return NextResponse.json(chapterData)

    } catch (error) {
        console.error('Get chapter API error, attempting fallback recovery:', error)
        
        // Final fallback: try to generate a fallback chapter using AI so the frontend displays correctly
        const chapterId = params.id
        const job = getJob(chapterId)
        
        if (job) {
            try {
                console.log(`Generating direct AI fallback for chapter: ${job.metadata.title}`)
                const placeholderText = `Please write a comprehensive study guide about "${job.metadata.title}" suitable for Class ${job.metadata.class_level} ${job.metadata.subject.toUpperCase()} students under the ${job.metadata.board.toUpperCase()} board.`
                const chapterData = await generateChapterWithAI(placeholderText, {
                    title: job.metadata.title,
                    subject: job.metadata.subject,
                    class_level: job.metadata.class_level,
                    board: job.metadata.board,
                    id: chapterId
                })
                saveChapter(chapterData)
                return NextResponse.json(chapterData)
            } catch (fallbackError) {
                console.error('Failed to create AI fallback chapter:', fallbackError)
            }
        }

        return NextResponse.json(
            { error: 'Failed to fetch chapter content' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const chapterId = params.id
        const localChapter = getChapterFromDb(chapterId)

        if (!localChapter) {
            return NextResponse.json(
                { error: 'Chapter not found in local server database' },
                { status: 404 }
            )
        }

        // Merge properties (e.g. approved: true)
        const updatedChapter = {
            ...localChapter,
            ...body
        }

        saveChapter(updatedChapter)
        return NextResponse.json(updatedChapter)
    } catch (error) {
        console.error('Update chapter API error:', error)
        return NextResponse.json(
            { error: 'Failed to update chapter' },
            { status: 500 }
        )
    }
}
