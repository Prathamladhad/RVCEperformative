import { NextRequest, NextResponse } from 'next/server'
import { getJob, saveJob, saveChapter } from '@/lib/serverDb'
import { generateChapterWithAI } from '@/lib/aiFallback'
import { ProcessingStatus } from '@/lib/types'
import { extractTextFromPdfBuffer } from '@/lib/pdfExtract'
import fs from 'fs'
import path from 'path'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/**
 * Attempt to recover a job that the backend lost track of.
 * Reads the saved PDF from disk (if any) and processes it with the AI pipeline.
 * Never uses a placeholder/title-only prompt.
 */
async function recoverJobWithAI(jobId: string, metadata: { title: string; subject: string; class_level: number; board: string }) {
    try {
        // Try to read the saved PDF file from disk
        const pdfPath = path.join(process.cwd(), 'public', 'uploads', `${jobId}.pdf`)
        let textToProcess = ''

        if (fs.existsSync(pdfPath)) {
            try {
                const pdfBuffer = fs.readFileSync(pdfPath)
                console.log(`[status-recovery] Found saved PDF for job ${jobId} (${pdfBuffer.length} bytes), extracting...`)
                textToProcess = await extractTextFromPdfBuffer(pdfBuffer, `${jobId}.pdf`)
                console.log(`[status-recovery] Extracted ${textToProcess.length} chars from saved PDF`)
            } catch (extractErr) {
                console.warn('[status-recovery] PDF extraction failed:', extractErr)
            }
        }

        if (!textToProcess || textToProcess.length < 50) {
            throw new Error(
                'No readable text could be recovered from the uploaded file. ' +
                'Please re-upload the PDF or paste the chapter text directly.'
            )
        }

        const chapterData = await generateChapterWithAI(textToProcess, {
            title: metadata.title,
            subject: metadata.subject,
            class_level: metadata.class_level,
            board: metadata.board,
            id: jobId
        })

        saveChapter(chapterData)
        saveJob(jobId, {
            stage: 'complete',
            progress: 100,
            message: `Chapter recovered and processed! ${chapterData.chunks.length} sections created.`,
            chunk_current: chapterData.chunks.length,
            chunk_total: chapterData.chunks.length
        }, metadata, true)

        console.log(`[status-recovery] Recovery complete for job ${jobId}: ${chapterData.chunks.length} chunks`)
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error(`[status-recovery] Recovery failed for job ${jobId}:`, message)
        saveJob(jobId, {
            stage: 'error',
            progress: 0,
            message: `Recovery failed: ${message}`,
            chunk_current: 0,
            chunk_total: 0
        }, metadata, true)
    }
}

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const jobId = params.id

    try {
        // 1. ── Local AI fallback job — return immediately ──────────────
        const localJob = getJob(jobId)
        if (localJob?.fallback) {
            return NextResponse.json(localJob.status)
        }

        // 2. ── Try the Python backend status endpoint ──────────────────
        console.log(`Polling backend status for Job ID: ${jobId} at ${BACKEND_URL}/status/${jobId}`)

        let backendData: any = null
        let backendOk = false

        try {
            const response = await fetch(`${BACKEND_URL}/status/${jobId}`, {
                method: 'GET',
                cache: 'no-store',
                signal: AbortSignal.timeout(6000)
            })

            if (response.ok) {
                backendData = await response.json()
                backendOk = true
                console.log(`Backend status response:`, backendData)
            } else {
                // Backend returned 404 or other error — don't throw, just fall through
                console.warn(`Backend status returned ${response.status} for job ${jobId} — using local fallback`)
            }
        } catch (fetchErr) {
            console.warn(`Backend unreachable for job ${jobId} status poll — using local fallback`)
        }

        // 3. ── If backend is unreachable or returned 404 ──────────────
        if (!backendOk) {
            // If we have a completed local status, return it
            if (localJob?.status.stage === 'complete') {
                return NextResponse.json(localJob.status)
            }

            // If job was already running in local fallback, return current status
            if (localJob?.fallback) {
                return NextResponse.json(localJob.status)
            }

            // Transition to AI recovery — read the saved PDF from disk
            if (localJob && !localJob.fallback) {
                console.warn(`Connection to backend lost for Job ${jobId}. Transitioning to AI recovery...`)

                const recoveryStatus: ProcessingStatus = {
                    stage: 'extracting',
                    progress: 20,
                    message: 'Backend unavailable. Reading your PDF locally...',
                    chunk_current: 0,
                    chunk_total: 0
                }
                saveJob(jobId, recoveryStatus, localJob.metadata, true)

                recoverJobWithAI(jobId, localJob.metadata)

                return NextResponse.json(recoveryStatus)
            }

            // No local record either — return a generic waiting status
            return NextResponse.json({
                stage: 'simplifying',
                progress: 30,
                message: 'Processing in progress...',
                chunk_current: 0,
                chunk_total: 0
            } as ProcessingStatus)
        }

        // 4. ── Normalize backend status response ──────────────────────
        const backendStatus = (backendData.status || backendData.stage || 'processing').toLowerCase()

        if (backendStatus === 'completed' || backendStatus === 'complete' || backendStatus === 'success') {
            const completeStatus: ProcessingStatus = {
                stage: 'complete',
                progress: 100,
                message: 'Processing complete!',
                chunk_current: 1,
                chunk_total: 1
            }
            if (localJob) saveJob(jobId, completeStatus, localJob.metadata, false)
            return NextResponse.json(completeStatus)
        }

        if (backendStatus === 'failed' || backendStatus === 'error') {
            console.warn(`Job ${jobId} failed on backend. Initiating AI recovery...`)

            if (localJob && !localJob.fallback) {
                const recoveryStatus: ProcessingStatus = {
                    stage: 'extracting',
                    progress: 25,
                    message: 'Backend processing failed. Recovering with local AI...',
                    chunk_current: 0,
                    chunk_total: 0
                }
                saveJob(jobId, recoveryStatus, localJob.metadata, true)
                recoverJobWithAI(jobId, localJob.metadata)
                return NextResponse.json(recoveryStatus)
            }

            return NextResponse.json({
                stage: 'error',
                progress: 0,
                message: backendData.message || 'Processing failed on backend.',
                chunk_current: 0,
                chunk_total: 0
            } as ProcessingStatus)
        }

        // Still running — increment progress counter
        const currentProgress = localJob ? Math.min(localJob.status.progress + 5, 90) : 30
        const runningStatus: ProcessingStatus = {
            stage: 'simplifying',
            progress: currentProgress,
            message: backendData.message || 'Processing in progress...',
            chunk_current: backendData.chunk_current || 0,
            chunk_total: backendData.chunk_total || 0
        }
        if (localJob) saveJob(jobId, runningStatus, localJob.metadata, false)
        return NextResponse.json(runningStatus)

    } catch (error) {
        console.error('Processing status route error:', error)

        // Last-resort: return whatever local status we have
        const localJob = getJob(jobId)
        if (localJob) {
            return NextResponse.json(localJob.status)
        }

        return NextResponse.json(
            { stage: 'error', progress: 0, message: 'Failed to fetch status', chunk_current: 0, chunk_total: 0 },
            { status: 500 }
        )
    }
}
