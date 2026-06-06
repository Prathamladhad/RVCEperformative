import { NextRequest, NextResponse } from 'next/server'
import { saveJob, saveChapter } from '@/lib/serverDb'
import { generateChapterWithAI } from '@/lib/aiFallback'
import { ProcessingStatus } from '@/lib/types'
import { extractTextFromPdfBuffer } from '@/lib/pdfExtract'
import fs from 'fs'
import path from 'path'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
    let file: File | null = null
    let textContent = ''
    let classLevel = 6
    let subject = 'science'
    let board = 'ncert'
    let title = 'New Chapter'
    const tempJobId = `job-${Date.now()}`

    try {
        const formData = await request.formData()
        file = formData.get('file') as File | null
        textContent = (formData.get('text') as string) || ''
        classLevel = Number(formData.get('class_level')) || 6
        subject = (formData.get('subject') as string) || 'science'
        board = (formData.get('board') as string) || 'ncert'
        title = file
            ? file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
            : (textContent.slice(0, 50) || 'Paste Study Chapter')

        // ── Read file bytes IMMEDIATELY while the File is still readable ──
        let pdfBuffer: Buffer | null = null
        if (file) {
            pdfBuffer = Buffer.from(await file.arrayBuffer())
        }

        // Try the backend first
        console.log(`Attempting to upload to backend: ${BACKEND_URL}/upload`)
        const backendFormData = new FormData()
        if (pdfBuffer && file) {
            // Re-create a Blob from the already-read buffer so the body isn't consumed
            const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' })
            backendFormData.append('file', blob, file.name)
        } else if (textContent) {
            backendFormData.append('text', textContent)
        }

        let finalJobId = tempJobId
        let backendSuccess = false

        try {
            const queryParams = new URLSearchParams({
                class_level: classLevel.toString(),
                subject: subject,
                board: board
            })
            const backendResponse = await fetch(`${BACKEND_URL}/upload?${queryParams.toString()}`, {
                method: 'POST',
                body: backendFormData,
                signal: AbortSignal.timeout(12000)
            })

            if (backendResponse.ok) {
                const responseData = await backendResponse.json()
                finalJobId = responseData.job_id || responseData.id || tempJobId
                console.log(`Backend upload succeeded. Received Job ID: ${finalJobId}`)

                const initialStatus: ProcessingStatus = {
                    stage: 'extracting',
                    progress: 10,
                    message: 'Processing started on backend...',
                    chunk_current: 0,
                    chunk_total: 0
                }
                saveJob(finalJobId, initialStatus, { title, subject, class_level: classLevel, board })
                backendSuccess = true
            } else {
                console.warn(`Backend returned status ${backendResponse.status}, falling back to AI pipeline...`)
            }
        } catch (backendErr) {
            console.warn('Backend unreachable. Using AI fallback pipeline.', backendErr)
        }

        // Save PDF to disk
        if (pdfBuffer) {
            try {
                const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
                if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
                fs.writeFileSync(path.join(uploadsDir, `${finalJobId}.pdf`), pdfBuffer)
            } catch (fsErr) {
                console.error('Failed to save PDF locally:', fsErr)
            }
        }

        if (backendSuccess) {
            return NextResponse.json({ chapter_id: finalJobId, job_id: finalJobId })
        }

        // ── AI Fallback pipeline ──────────────────────────────────────────
        const jobId = `job-fallback-${Date.now()}`

        if (pdfBuffer) {
            try {
                const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
                fs.writeFileSync(path.join(uploadsDir, `${jobId}.pdf`), pdfBuffer)
            } catch { /* ignore */ }
        }

        const metadata = { title, subject, class_level: classLevel, board }
        saveJob(jobId, {
            stage: 'extracting',
            progress: 10,
            message: 'Starting AI processing pipeline...',
            chunk_current: 0,
            chunk_total: 0
        }, metadata, true)

        // Capture these values now — they must be closed over before async
        const capturedPdfBuffer = pdfBuffer
        const capturedFilename = file?.name || 'uploaded.pdf'
        const capturedText = textContent

        const processWithAI = async () => {
            try {
                let textToProcess = capturedText

                if (capturedPdfBuffer && !textToProcess) {
                    saveJob(jobId, {
                        stage: 'extracting',
                        progress: 20,
                        message: 'Extracting text from PDF...',
                        chunk_current: 0,
                        chunk_total: 0
                    }, metadata, true)

                    // Direct in-process extraction — no HTTP self-call
                    textToProcess = await extractTextFromPdfBuffer(capturedPdfBuffer, capturedFilename)
                    console.log(`[process] Extracted ${textToProcess.length} chars from PDF`)
                }

                if (!textToProcess || textToProcess.trim().length < 50) {
                    throw new Error(
                        'No readable text found in the uploaded file. ' +
                        'Please use a digital (text-based) PDF, or paste the chapter text directly.'
                    )
                }

                const chunkCount = Math.max(1, Math.ceil(textToProcess.length / 3000))
                saveJob(jobId, {
                    stage: 'simplifying',
                    progress: 40,
                    message: `Processing ${chunkCount} section${chunkCount > 1 ? 's' : ''} with AI...`,
                    chunk_current: 0,
                    chunk_total: chunkCount
                }, metadata, true)

                const chapterData = await generateChapterWithAI(textToProcess, {
                    title,
                    subject,
                    class_level: classLevel,
                    board,
                    id: jobId
                })

                saveChapter(chapterData)

                saveJob(jobId, {
                    stage: 'complete',
                    progress: 100,
                    message: `Chapter processed! ${chapterData.chunks.length} sections created.`,
                    chunk_current: chapterData.chunks.length,
                    chunk_total: chapterData.chunks.length
                }, metadata, true)

                console.log(`[process] Complete: ${chapterData.chunks.length} chunks for Job ${jobId}`)

            } catch (fallbackError) {
                const message = fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
                console.error('[process] AI fallback failed:', message)
                saveJob(jobId, {
                    stage: 'error',
                    progress: 0,
                    message: `Processing failed: ${message}`,
                    chunk_current: 0,
                    chunk_total: 0
                }, metadata, true)
            }
        }

        processWithAI()

        return NextResponse.json({ chapter_id: jobId, job_id: jobId })

    } catch (error) {
        console.error('Fatal error in process route:', error)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }
}
