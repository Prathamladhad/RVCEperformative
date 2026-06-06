import { ChapterData, ChunkObject } from './types'

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

// ── Guards ────────────────────────────────────────────────────────────────────

/**
 * Returns true if the text looks like it's just a filename / title guess
 * rather than real extracted PDF content.
 * This prevents Gemini from fabricating content from a filename.
 */
function isPlaceholderPrompt(text: string): boolean {
    const trimmed = text.trim()

    // Empty or near-empty
    if (trimmed.length < 30) return true

    // Very short filename/title-like text should be rejected.
    // We allow longer prompt strings because fallback recovery may intentionally use them.
    if (/^[\w\s\-_,;:()]+(\.pdf|\.txt)?$/i.test(trimmed) && trimmed.split(/\s+/).length < 10) {
        return true
    }

    return false
}

// ── Text chunking ─────────────────────────────────────────────────────────────

/**
 * Split large text into chunks of ~3000 chars on paragraph/sentence boundaries.
 * Each chunk will be processed independently by Gemini.
 */
function splitIntoChunks(text: string, maxChars = 3000): string[] {
    if (text.length <= maxChars) return [text]

    const chunks: string[] = []
    const paragraphs = text.split(/\n{2,}/)
    let current = ''

    for (const para of paragraphs) {
        const trimmed = para.trim()
        if (!trimmed) continue
        if ((current + '\n\n' + trimmed).length > maxChars && current.length > 0) {
            chunks.push(current.trim())
            current = trimmed
        } else {
            current = current ? current + '\n\n' + trimmed : trimmed
        }
    }
    if (current.trim()) chunks.push(current.trim())

    // If any single chunk still exceeds limit, cut on sentence boundaries
    const finalChunks: string[] = []
    for (const chunk of chunks) {
        if (chunk.length <= maxChars) { finalChunks.push(chunk); continue }
        const sentences = chunk.split(/(?<=[.!?])\s+/)
        let sub = ''
        for (const s of sentences) {
            if ((sub + ' ' + s).length > maxChars && sub.length > 0) {
                finalChunks.push(sub.trim())
                sub = s
            } else {
                sub = sub ? sub + ' ' + s : s
            }
        }
        if (sub.trim()) finalChunks.push(sub.trim())
    }

    return finalChunks.filter(c => c.trim().length > 30)
}

// ── Single-chunk Gemini call ──────────────────────────────────────────────────

async function processChunkWithGemini(
    chunkText: string,
    metadata: { title: string; subject: string; class_level: number; board: string },
    chunkIndex: number,
    systemPrompt: string,
    apiKey: string
): Promise<any[]> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const prompt = `Metadata:
Title: ${metadata.title}
Subject: ${metadata.subject}
Class: ${metadata.class_level}
Board: ${metadata.board}
Chunk: ${chunkIndex + 1}

Text to process:
${chunkText}

Response JSON (array of chunk objects only, no wrapper object):`

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Content:\n${prompt}` }] }],
            generationConfig: { responseMimeType: 'application/json' }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API call failed for chunk ${chunkIndex}: ${errorText}`)
    }

    const data = await response.json()
    const jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!jsonString) throw new Error(`Gemini returned empty response for chunk ${chunkIndex}`)

    const parsed = JSON.parse(jsonString)

    // Gemini may return either an array directly or an object with a "chunks" key
    if (Array.isArray(parsed)) return parsed
    if (parsed.chunks && Array.isArray(parsed.chunks)) return parsed.chunks
    return [parsed] // single chunk wrapped in array
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function generateChapterWithAI(
    inputText: string,
    metadata: { title: string; subject: string; class_level: number; board: string; id: string },
    studentMetrics?: StudentMetrics
): Promise<ChapterData> {
    const apiKey = process.env.GEMINI_API_KEY
    const isKeyConfigured = apiKey && apiKey !== 'undefined' && apiKey !== 'null' && apiKey.trim() !== ''
    if (!isKeyConfigured) {
        console.warn(`[aiFallback] GEMINI_API_KEY is not configured or invalid (${apiKey}). Returning dummy fallback chunks.`)
        const textChunks = splitIntoChunks(inputText, 3000)
        const chunks: ChunkObject[] = textChunks.map((textChunk, idx) => {
            const cleanText = textChunk.replace(/\s+/g, ' ')
            const sentences = cleanText.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [cleanText]
            const words = cleanText.replace(/[.,!?;:—]/g, '').split(/\s+/).filter(w => w.length > 5)
            const keyTerms = Array.from(new Set(words)).slice(0, 4)
            const glossary: Record<string, string> = {}
            keyTerms.forEach(term => {
                glossary[term] = `Vocabulary term: "${term}"`
            })
            return {
                chunk_id: `chunk-fallback-${idx}`,
                original_text: cleanText,
                simplified_text: cleanText,
                key_terms: keyTerms,
                syllable_map: {},
                phonetic_map: {},
                core_facts: sentences.slice(0, 3).map(s => s.trim()),
                objective: sentences[0] || 'Understand this section.',
                numbers: [],
                numbers_plain: [],
                glossary,
                word_count: cleanText.split(/\s+/).filter(Boolean).length
            }
        })
        return {
            chapter_id: metadata.id,
            title: metadata.title,
            subject: metadata.subject,
            class_level: metadata.class_level,
            board: metadata.board,
            chunks,
            created_at: new Date().toISOString(),
            approved: false
        }
    }

    // ── Guard: reject placeholder / filename-only prompts ──────────────
    if (isPlaceholderPrompt(inputText)) {
        throw new Error(
            `The text provided is too short or appears to be a placeholder (filename/title only). ` +
            `Please upload a PDF with readable text content, or paste the chapter text directly. ` +
            `Input was: "${inputText.slice(0, 100)}..."`
        )
    }

    // ── Build system prompt ─────────────────────────────────────────────
    let customizationPrompt = ''
    if (studentMetrics) {
        const { readingWpm, profile } = studentMetrics
        customizationPrompt += '\nTailor the content to a student with the following characteristics:'
        if (profile) {
            customizationPrompt += `\n- Cognitive Style/Profile: ${profile}`
            const lp = profile.toLowerCase()
            if (lp.includes('adhd')) {
                customizationPrompt += '\n  * ADHD/High Energy: Break content into very small, action-oriented segments. Use vivid, engaging examples.'
            } else if (lp.includes('dyslexia') || lp.includes('dyslexic')) {
                customizationPrompt += '\n  * Dyslexia: Write simplified sentences. Use direct, clear structures, avoiding passive voice.'
            } else if (lp.includes('autism') || lp.includes('autistic')) {
                customizationPrompt += '\n  * Autism/Structured Flow: Use logical progressions, literal explanations, no idioms or ambiguous language.'
            }
        }
        if (readingWpm !== undefined && readingWpm > 0) {
            if (readingWpm < 120) {
                customizationPrompt += `\n- Reading Speed: ${readingWpm} WPM (Low). CRITICAL: max 8 words per sentence, basic vocabulary.`
            } else if (readingWpm < 180) {
                customizationPrompt += `\n- Reading Speed: ${readingWpm} WPM (Moderate). Max 12 words per sentence.`
            }
        }
    }

    const systemPrompt = `You are an expert educational AI specialised in neurodivergent pedagogy.
Your task is to convert the provided text into a highly structured, dyslexia-friendly, ADHD-friendly chapter.

IMPORTANT: Process ONLY the text provided. Do NOT invent or add information not present in the input.

Format output as a JSON ARRAY of chunk objects (NOT wrapped in any outer object):
[
  {
    "chunk_id": "unique-chunk-id-1",
    "original_text": "The original paragraph text exactly as it appeared",
    "simplified_text": "Simplified, dyslexia-friendly version using short sentences (max 12 words each). Active voice only. Phonetic guides for hard words (e.g. pho·to·syn·the·sis).",
    "key_terms": ["Term1", "Term2"],
    "core_facts": ["Key fact from the text", "Another key fact"],
    "objective": "A simple 1-sentence learning objective for this section.",
    "glossary": {
      "Term1": "Plain-language definition",
      "Term2": "Plain-language definition"
    }
  }
]

Rules:
1. ONLY use information from the provided text — do not hallucinate or invent content.
2. Each chunk should cover 2-4 sentences of the original text.
3. Simplified text must use short sentences, active voice, and simple vocabulary.
4. Glossary should only include terms that appear in the original text.${customizationPrompt}`

    // ── Split text into manageable chunks ──────────────────────────────
    const textChunks = splitIntoChunks(inputText, 3000)
    console.log(`[aiFallback] Processing ${textChunks.length} text chunks for "${metadata.title}"`)

    // ── Process each chunk (with status updates via console) ────────────
    const allGeneratedChunks: any[] = []

    for (let i = 0; i < textChunks.length; i++) {
        console.log(`[aiFallback] Processing chunk ${i + 1}/${textChunks.length} (${textChunks[i].length} chars)`)
        try {
            const chunkResults = await processChunkWithGemini(
                textChunks[i],
                metadata,
                i,
                systemPrompt,
                apiKey
            )
            allGeneratedChunks.push(...chunkResults)
            console.log(`[aiFallback] Chunk ${i + 1} produced ${chunkResults.length} sections`)
        } catch (chunkErr) {
            console.error(`[aiFallback] Chunk ${i + 1} failed:`, chunkErr)
            // Add a fallback chunk so the pipeline doesn't lose the text
            allGeneratedChunks.push({
                chunk_id: `chunk-fallback-${i}`,
                original_text: textChunks[i].slice(0, 500),
                simplified_text: textChunks[i].slice(0, 500),
                key_terms: [],
                core_facts: [],
                objective: `Understand content from section ${i + 1}.`,
                glossary: {}
            })
        }
    }

    // ── Normalise chunk structure ───────────────────────────────────────
    const chunks: ChunkObject[] = allGeneratedChunks.map((c: any, idx: number) => {
        const simplified = c.simplified_text || c.original_text || 'No text content.'
        return {
            chunk_id: c.chunk_id || `chunk-${idx}`,
            original_text: c.original_text || simplified,
            simplified_text: simplified,
            key_terms: c.key_terms || [],
            syllable_map: c.syllable_map || {},
            phonetic_map: c.phonetic_map || {},
            core_facts: c.core_facts || [],
            objective: c.objective || 'Understand this section of the lesson.',
            numbers: c.numbers || [],
            numbers_plain: c.numbers_plain || [],
            glossary: c.glossary || {},
            word_count: simplified.split(/\s+/).filter(Boolean).length
        }
    })

    if (chunks.length === 0) {
        throw new Error('Gemini returned no chunks. The PDF text may be too short or unreadable.')
    }

    console.log(`[aiFallback] Total: ${chunks.length} sections generated for "${metadata.title}"`)

    return {
        chapter_id: metadata.id,
        title: metadata.title,
        subject: metadata.subject,
        class_level: metadata.class_level,
        board: metadata.board,
        chunks,
        created_at: new Date().toISOString(),
        approved: false
    }
}
