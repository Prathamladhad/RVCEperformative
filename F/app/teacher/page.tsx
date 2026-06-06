'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UploadPanel } from '@/components/teacher/UploadPanel'
import { ProcessingStatus } from '@/components/teacher/ProcessingStatus'
import { ChapterCard } from '@/components/teacher/ChapterCard'
import { RecommendationCard } from '@/components/ai/RecommendationPanel'
import { uploadAndProcess, listChapters, getProcessingStatus } from '@/lib/api'
import { UploadMetadata, ChapterData, ProcessingStatus as Status } from '@/lib/types'
import { Toast } from '@/components/shared/Toast'
import { ARPdfViewer } from '@/components/shared/ARPdfViewer'


export default function TeacherPage() {
    const router = useRouter()
    const [chapters, setChapters] = useState<ChapterData[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [currentChapterId, setCurrentChapterId] = useState<string | null>(null)
    const [showRecommendations, setShowRecommendations] = useState(false)
    const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(null)
    const [processingStatus, setProcessingStatus] = useState<Status>({
        stage: 'idle',
        progress: 0,
        message: '',
        chunk_current: 0,
        chunk_total: 0,
    })
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
    const [arViewerOpen, setArViewerOpen] = useState(false)
    const [backendConnected, setBackendConnected] = useState<'checking' | 'connected' | 'disconnected'>('checking')

    // Check backend connection health status
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/health`, {
                    signal: AbortSignal.timeout(2000)
                })
                if (res.ok) {
                    setBackendConnected('connected')
                } else {
                    setBackendConnected('disconnected')
                }
            } catch {
                setBackendConnected('disconnected')
            }
        }
        
        checkConnection()
        const interval = setInterval(checkConnection, 5000)
        return () => clearInterval(interval)
    }, [])

    // Load chapters on mount
    useEffect(() => {
        const loadChapters = async () => {
            try {
                const data = await listChapters()
                setChapters(data)
            } catch (error) {
                console.error('Failed to load chapters:', error)
                setToast({ message: 'Failed to load chapters', type: 'error' })
            } finally {
                setLoading(false)
            }
        }

        loadChapters()
    }, [])

    // Poll processing status
    useEffect(() => {
        if (!processing || !currentChapterId) return

        let active = true
        let inFlight = false

        const poll = async () => {
            if (!active) return
            if (inFlight) return

            inFlight = true
            try {
                const status = await getProcessingStatus(currentChapterId)
                if (!active) return
                
                setProcessingStatus(status)

                if (status.stage === 'complete') {
                    setProcessing(false)
                    router.push(`/teacher/review/${currentChapterId}`)
                    setToast({ message: 'Chapter processed successfully!', type: 'success' })
                    return
                } else if (status.stage === 'error') {
                    setProcessing(false)
                    setToast({ message: `Processing error: ${status.message}`, type: 'error' })
                    return
                }
            } catch (error) {
                console.error('Failed to check status:', error)
            } finally {
                inFlight = false
                if (active && processing) {
                    setTimeout(poll, 1500) // Poll again after 1.5s
                }
            }
        }

        poll()

        return () => {
            active = false
        }
    }, [processing, currentChapterId, router])

    const handleUpload = async (metadata: UploadMetadata) => {
        try {
            setUploading(true)
            const result = await uploadAndProcess(metadata)
            setCurrentChapterId(result.chapter_id)
            setProcessing(true)
            setProcessingStatus({
                stage: 'extracting',
                progress: 5,
                message: 'Starting extraction...',
                chunk_current: 0,
                chunk_total: 0,
            })
        } catch (error) {
            console.error('Upload error:', error)
            setToast({
                message: error instanceof Error ? error.message : 'Upload failed',
                type: 'error',
            })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-3 justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">👨‍🏫</span>
                                <h1 className="text-3xl font-bold text-dark-text">Teacher Dashboard</h1>
                            </div>
                            
                            {/* Connection Indicator */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white shadow-sm text-xs font-semibold self-start sm:self-auto sm:ml-4">
                                <span className={`h-2.5 w-2.5 rounded-full ${
                                    backendConnected === 'connected' ? 'bg-emerald-500 animate-pulse' :
                                    backendConnected === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
                                }`} />
                                <span className="text-gray-700">
                                    {backendConnected === 'connected' ? 'Backend Active' :
                                     backendConnected === 'checking' ? 'Checking Backend...' : 'Backend Offline'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    backendConnected === 'connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                    {backendConnected === 'connected' ? 'Qwen 2.5 (7B)' : 'Local Gemini Fallback'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://amazing-lolly-64924a.netlify.app/"
                                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                            >
                                📊 Dashboard
                            </a>
                            <a
                                href="/"
                                className="text-brand-purple hover:text-brand-purple/80 font-medium text-sm"
                            >
                                ← Back
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">

                {/* ─── AR PDF Viewer Feature Card ─── */}
                <div
                    className="mb-10 rounded-3xl overflow-hidden relative"
                    style={{
                        background: 'linear-gradient(135deg, #1a0533 0%, #0d1233 50%, #001233 100%)',
                        border: '1px solid rgba(139,92,246,0.25)',
                        boxShadow: '0 0 40px rgba(139,92,246,0.1)',
                    }}
                >
                    {/* Glow orbs */}
                    <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
                    <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)' }} />

                    <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Icon */}
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                            style={{
                                background: 'rgba(139,92,246,0.15)',
                                border: '1px solid rgba(139,92,246,0.35)',
                                boxShadow: '0 0 20px rgba(139,92,246,0.2)',
                            }}
                        >
                            🔮
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}
                                >
                                    NEW
                                </span>
                                <h2 className="text-white font-extrabold text-lg">AR PDF Text Overlay</h2>
                            </div>
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                Upload any PDF, activate your camera, and project the extracted text as augmented reality floating overlays on the live feed — perfect for classroom demonstrations.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {['📄 PDF Text Extraction', '📷 Live Camera Feed', '🧠 OpenCV Processing', '✨ AR Text Overlays', '🎨 Interactive Highlights'].map(tag => (
                                    <span
                                        key={tag}
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Launch Button */}
                        <button
                            onClick={() => setArViewerOpen(true)}
                            className="flex-shrink-0 px-6 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                boxShadow: '0 0 25px rgba(124,58,237,0.4)',
                            }}
                        >
                            🚀 Launch AR Viewer
                        </button>
                    </div>
                </div>

                {/* Upload Section */}
                {!processing && (
                    <div className="mb-12">
                        <UploadPanel onSubmit={handleUpload} isLoading={uploading} />
                    </div>
                )}

                {/* Processing Status */}
                {processing && (
                    <div className="mb-12">
                        <ProcessingStatus status={processingStatus} />
                    </div>
                )}

                {/* Chapters List */}
                {!loading && !processing && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-dark-text">
                                Your Chapters ({chapters.length})
                            </h2>
                            {chapters.length > 0 && !showRecommendations && (
                                <button
                                    onClick={() => {
                                        setShowRecommendations(true)
                                        setSelectedChapter(chapters[0])
                                    }}
                                    className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:bg-brand-purple/90 transition-colors text-sm"
                                >
                                    💡 View Recommendations
                                </button>
                            )}
                        </div>

                        {/* Recommendations Panel */}
                        {showRecommendations && selectedChapter && (
                            <div className="mb-8 relative">
                                <button
                                    onClick={() => setShowRecommendations(false)}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
                                >
                                    ✕
                                </button>
                                <RecommendationCard
                                    subject={selectedChapter.subject}
                                    classLevel={selectedChapter.class_level}
                                />
                            </div>
                        )}

                        {chapters.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {chapters.map((chapter) => (
                                    <ChapterCard
                                        key={chapter.chapter_id}
                                        chapter={chapter}
                                        shareCode={chapter.approved ? chapter.chapter_id.slice(0, 6) : undefined}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-600 text-lg">No chapters yet. Upload your first NCERT chapter above!</p>
                            </div>
                        )}
                    </div>
                )}

                {loading && !processing && (
                    <div className="text-center py-12">
                        <div className="inline-block">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple" />
                        </div>
                    </div>
                )}
            </main>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* AR PDF Viewer Modal */}
            <ARPdfViewer
                isOpen={arViewerOpen}
                onClose={() => setArViewerOpen(false)}
                mode="teacher"
            />
        </div>
    )
}
