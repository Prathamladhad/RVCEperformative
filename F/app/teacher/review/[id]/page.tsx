'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BeforeAfterView } from '@/components/teacher/BeforeAfterView'
import { useChapter } from '@/hooks/useChapter'
import { approveChapter, updateChunkText } from '@/lib/api'
import { Toast } from '@/components/shared/Toast'
import { exportChunksPDF } from '@/lib/exportChunksPDF'

async function downloadChapterPDF(chapter: any) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = 210
    const margin = 18
    const contentWidth = pageWidth - margin * 2
    let y = 20

    const checkPage = (needed = 10) => {
        if (y + needed > 280) { doc.addPage(); y = 20 }
    }

    // Title header
    doc.setFillColor(109, 40, 217)
    doc.rect(0, 0, 210, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('NeuroAdapt AI — Processed Textbook Chapter', margin, 9.5)
    y = 22

    doc.setTextColor(30, 30, 40)
    doc.setFontSize(17)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(chapter.title, contentWidth)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 8 + 2

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(110, 110, 130)
    doc.text(`Subject: ${chapter.subject}  |  Class: ${chapter.class_level}  |  Board: ${(chapter.board || '').toUpperCase()}  |  Chunks: ${chapter.chunks?.length || 0}`, margin, y)
    y += 5
    doc.setDrawColor(200, 200, 220)
    doc.line(margin, y, 210 - margin, y)
    y += 6

    ;(chapter.chunks || []).forEach((chunk: any, idx: number) => {
        checkPage(30)

        // Chunk header
        doc.setFillColor(245, 243, 255)
        doc.roundedRect(margin - 2, y - 4, contentWidth + 4, 10, 2, 2, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(109, 40, 217)
        doc.text(`Section ${idx + 1}`, margin, y + 3)
        y += 11

        // Objective
        if (chunk.objective) {
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bolditalic')
            doc.setTextColor(80, 80, 100)
            const objLines = doc.splitTextToSize(`Objective: ${chunk.objective}`, contentWidth)
            checkPage(objLines.length * 4 + 3)
            doc.text(objLines, margin, y)
            y += objLines.length * 4 + 3
        }

        // Original text
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(60, 60, 80)
        doc.text('Original Text:', margin, y)
        y += 4
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(50, 50, 70)
        const origLines = doc.splitTextToSize(chunk.original_text || '', contentWidth)
        checkPage(origLines.length * 4 + 4)
        doc.text(origLines, margin, y)
        y += origLines.length * 4 + 4

        // AI simplified text
        doc.setFillColor(236, 253, 245)
        const simplLines = doc.splitTextToSize(chunk.simplified_text || '', contentWidth - 4)
        const boxH = simplLines.length * 4 + 8
        checkPage(boxH + 4)
        doc.roundedRect(margin, y - 2, contentWidth, boxH, 2, 2, 'F')
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(5, 150, 105)
        doc.text('AI Simplified (Dyslexia-Friendly):', margin + 2, y + 3)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(20, 80, 60)
        doc.text(simplLines, margin + 2, y)
        y += simplLines.length * 4 + 6

        // Key terms
        if (chunk.key_terms && chunk.key_terms.length > 0) {
            checkPage(8)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(60, 60, 80)
            doc.text('Key Terms: ', margin, y)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100, 60, 180)
            const termsText = chunk.key_terms.join('  •  ')
            const termLines = doc.splitTextToSize(termsText, contentWidth - 22)
            doc.text(termLines, margin + 22, y)
            y += Math.max(4, termLines.length * 4) + 3
        }

        // Glossary
        if (chunk.glossary && Object.keys(chunk.glossary).length > 0) {
            checkPage(10)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(60, 60, 80)
            doc.text('Glossary:', margin, y)
            y += 4
            Object.entries(chunk.glossary).forEach(([term, def]) => {
                checkPage(6)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(80, 40, 160)
                doc.text(`${term}:`, margin + 3, y)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(60, 60, 80)
                const defLines = doc.splitTextToSize(String(def), contentWidth - 30)
                doc.text(defLines, margin + 25, y)
                y += Math.max(4, defLines.length * 4) + 1
            })
            y += 2
        }

        y += 4
        doc.setDrawColor(220, 210, 240)
        checkPage(2)
        doc.line(margin, y, 210 - margin, y)
        y += 6
    })

    // Footer on last page
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFontSize(7)
        doc.setTextColor(160, 160, 180)
        doc.text(`NeuroAdapt AI  •  Generated ${new Date().toLocaleDateString()}  •  Page ${p} of ${totalPages}`, margin, 293)
    }

    const safeName = (chapter.title || 'chapter').replace(/[^a-z0-9]/gi, '_').toLowerCase()
    doc.save(`neuroadapt_${safeName}.pdf`)
}

export default function ReviewPage({
    params,
}: {
    params: { id: string }
}) {
    const router = useRouter()
    const { chapter, loading, error } = useChapter(params.id)
    const [approving, setApproving] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const handleApprove = async () => {
        if (!chapter) return

        try {
            setApproving(true)
            await approveChapter(chapter.chapter_id)
            setToast({ message: 'Chapter approved!', type: 'success' })
            setTimeout(() => {
                router.push('/teacher')
            }, 1500)
        } catch (err) {
            setToast({
                message: err instanceof Error ? err.message : 'Failed to approve',
                type: 'error',
            })
        } finally {
            setApproving(false)
        }
    }

    const handleChunkUpdate = async (chunkId: string, text: string) => {
        try {
            await updateChunkText(params.id, chunkId, text)
            setToast({ message: 'Chunk updated!', type: 'success' })
            // Refresh chapter data
            window.location.reload()
        } catch (err) {
            setToast({
                message: err instanceof Error ? err.message : 'Failed to update',
                type: 'error',
            })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple" />
            </div>
        )
    }

    if (error || !chapter) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <p className="text-error-red font-bold text-lg">Failed to load chapter</p>
                    <button
                        onClick={() => router.push('/teacher')}
                        className="px-6 py-2 bg-brand-purple text-white rounded-lg font-medium"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-dark-text">Review Chapter</h1>
                            <p className="text-gray-600 mt-1">
                                {chapter.title} • {chapter.subject} • Class {chapter.class_level}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/teacher')}
                            className="text-brand-purple hover:text-brand-purple/80 font-medium"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Before After View */}
                <BeforeAfterView
                    chunks={chapter.chunks}
                    onChunkUpdate={handleChunkUpdate}
                />

                {/* Actions */}
                <div className="mt-8 flex flex-wrap gap-4 justify-end">
                    <button
                        onClick={() => router.push('/teacher')}
                        className="px-8 py-3 bg-gray-200 text-dark-text font-bold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => downloadChapterPDF(chapter)}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                        📄 Quick PDF
                    </button>
                    <button
                        onClick={() => exportChunksPDF(chapter, {
                            includeOriginal: true,
                            includeGlossary: true,
                            includeCoreFacts: true,
                            includeObjectives: true,
                        })}
                        className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-violet-200"
                    >
                        📥 Export Full Report
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={approving}
                        className="px-8 py-3 bg-accent-teal text-white font-bold rounded-lg hover:bg-accent-teal/90 disabled:opacity-50 transition-colors"
                    >
                        {approving ? 'Approving...' : '✓ Approve & Share'}
                    </button>
                </div>

                {/* Share Info */}
                {chapter.approved && (
                    <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="font-bold text-dark-text mb-3">Share with Students</h3>
                        <p className="text-gray-700 mb-4">
                            This chapter is approved and ready to share. Students can access it using the code below:
                        </p>
                        <div className="bg-white rounded-lg p-4 border border-green-300 inline-block">
                            <p className="font-mono text-2xl font-bold text-accent-teal">
                                {chapter.chapter_id.slice(0, 6).toUpperCase()}
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={3000}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}
