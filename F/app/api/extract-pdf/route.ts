/**
 * /api/extract-pdf — Server-side PDF Text Extraction
 *
 * Accepts a PDF file upload and extracts real text using pdf-parse.
 * Falls back to a clean error (never hallucinates from filename).
 *
 * Called by /api/process when it needs to extract text from an uploaded PDF
 * before passing it to the Gemini AI fallback pipeline.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Chunk a large string into smaller pieces on sentence/paragraph boundaries.
 * This keeps context intact while staying within LLM token limits.
 */
function chunkText(text: string, maxCharsPerChunk = 3500): string[] {
    if (!text || text.trim().length === 0) return []
    if (text.length <= maxCharsPerChunk) return [text.trim()]

    const chunks: string[] = []

    // Try to split on paragraph breaks first
    const paragraphs = text.split(/\n{2,}/)
    let current = ''

    for (const para of paragraphs) {
        const trimmed = para.trim()
        if (!trimmed) continue

        if ((current + '\n\n' + trimmed).length > maxCharsPerChunk && current.length > 0) {
            chunks.push(current.trim())
            current = trimmed
        } else {
            current = current ? current + '\n\n' + trimmed : trimmed
        }
    }

    if (current.trim()) chunks.push(current.trim())

    // If any chunk is still too large, further split on sentence boundaries
    const finalChunks: string[] = []
    for (const chunk of chunks) {
        if (chunk.length <= maxCharsPerChunk) {
            finalChunks.push(chunk)
            continue
        }
        // Split on sentence endings
        const sentences = chunk.split(/(?<=[.!?])\s+/)
        let subChunk = ''
        for (const sentence of sentences) {
            if ((subChunk + ' ' + sentence).length > maxCharsPerChunk && subChunk.length > 0) {
                finalChunks.push(subChunk.trim())
                subChunk = sentence
            } else {
                subChunk = subChunk ? subChunk + ' ' + sentence : sentence
            }
        }
        if (subChunk.trim()) finalChunks.push(subChunk.trim())
    }

    return finalChunks.filter(c => c.trim().length > 20) // Filter out trivially small chunks
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        console.log(`[extract-pdf] Extracting text from ${file.name} (${buffer.length} bytes)`)

        // ── Strategy 1: pdf-parse (pure JS, works in Next.js) ──────────
        let extractedText = ''
        let strategy = 'none'

        try {
            // Dynamic import — pdf-parse has both CJS and ESM builds
            const pdfParseModule = await import('pdf-parse')
            const pdfParse = (pdfParseModule as any).default || pdfParseModule
            const pdfData = await pdfParse(buffer, {
                // Limit pages to first 50 to avoid memory issues
                max: 50
            })

            extractedText = pdfData.text || ''
            strategy = 'pdf-parse'

            console.log(`[extract-pdf] pdf-parse extracted ${extractedText.length} chars from ${pdfData.numpages} pages`)
        } catch (pdfParseErr) {
            console.error('[extract-pdf] pdf-parse failed:', pdfParseErr)
        }

        // ── Strategy 2: Raw stream heuristic (improved) ─────────────────
        if (extractedText.trim().length < 100) {
            console.log('[extract-pdf] pdf-parse yielded < 100 chars, trying improved heuristic extraction')
            try {
                const fullString = buffer.toString('latin1')
                let heuristicText = ''

                // BT ... ET blocks (standard PDF text operators)
                const btBlocks = fullString.match(/BT[\s\S]*?ET/g) || []
                for (const block of btBlocks) {
                    // Extract text from Tj and TJ operators
                    const tjMatches = block.match(/\(([^)\\]|\\.)*\)\s*Tj/g) || []
                    for (const m of tjMatches) {
                        const txt = m.match(/\(([^)\\]|\\.)*\)/)
                        if (txt) {
                            heuristicText += txt[0].slice(1, -1)
                                .replace(/\\n/g, '\n')
                                .replace(/\\r/g, '')
                                .replace(/\\t/g, ' ')
                                .replace(/\\\(/g, '(')
                                .replace(/\\\)/g, ')')
                                .replace(/\\\\/g, '\\')
                                + ' '
                        }
                    }
                }

                if (heuristicText.trim().length > extractedText.trim().length) {
                    extractedText = heuristicText
                    strategy = 'heuristic'
                    console.log(`[extract-pdf] Heuristic extracted ${extractedText.length} chars`)
                }
            } catch (heuristicErr) {
                console.error('[extract-pdf] Heuristic extraction failed:', heuristicErr)
            }
        }

        // ── Result ──────────────────────────────────────────────────────
        const cleanText = extractedText
            .replace(/\x00/g, '')           // remove null bytes
            .replace(/[^\S\n]{3,}/g, ' ')   // collapse whitespace
            .replace(/\n{4,}/g, '\n\n')     // normalise blank lines
            .trim()

        if (cleanText.length < 50) {
            console.warn('[extract-pdf] All strategies yielded < 50 chars — likely scanned/image PDF')
            return NextResponse.json({
                success: false,
                error: 'scanned_pdf',
                message: 'This PDF appears to be scanned or image-only. Text extraction failed. Please provide a digital PDF or paste the text directly.',
                chars: 0,
                chunks: [],
                strategy: 'none'
            })
        }

        const chunks = chunkText(cleanText)

        console.log(`[extract-pdf] Extraction complete: ${cleanText.length} chars → ${chunks.length} chunks (strategy: ${strategy})`)

        return NextResponse.json({
            success: true,
            text: cleanText,
            chunks,
            chars: cleanText.length,
            chunk_count: chunks.length,
            strategy,
            filename: file.name
        })

    } catch (error) {
        console.error('[extract-pdf] Fatal error:', error)
        return NextResponse.json(
            { error: 'PDF extraction failed', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
