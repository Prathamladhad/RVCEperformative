'use client'

import { ProcessingStatus as Status } from '@/lib/types'

const STAGE_LABELS: Record<string, { name: string; icon: string }> = {
    extracting: { name: 'Extracting PDF', icon: '📄' },
    cleaning: { name: 'Cleaning text', icon: '🧹' },
    chunking: { name: 'Chunking', icon: '📑' },
    identifying: { name: 'Identifying concepts', icon: '🎯' },
    simplifying: { name: 'Simplifying', icon: '✨' },
    rendering: { name: 'Rendering', icon: '🎨' },
    complete: { name: 'Complete!', icon: '✓' },
}

interface ProcessingStatusProps {
    status: Status
}

export function ProcessingStatus({ status }: ProcessingStatusProps) {
    const stageLabel = STAGE_LABELS[status.stage] || { name: 'Processing...', icon: '⏳' }
    const estimatedTime = Math.max(60 - Math.floor(status.progress / 2), 10)

    return (
        <div className="w-full space-y-6 p-6 bg-white rounded-lg shadow">
            <h3 className="text-xl font-bold text-dark-text">Processing your chapter...</h3>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-dark-text">{status.progress}%</span>
                    <span className="text-sm text-gray-600">{stageLabel.name}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-brand-purple h-full transition-all duration-500 animate-pulse-bar"
                        style={{ width: `${status.progress}%` }}
                    />
                </div>
            </div>

            {/* Stage Indicators */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
                {Object.entries(STAGE_LABELS).map(([key, { icon }]) => {
                    const stages = ['extracting', 'cleaning', 'chunking', 'identifying', 'simplifying', 'rendering', 'complete']
                    const stageIndex = stages.indexOf(key)
                    const currentStageIndex = stages.indexOf(status.stage)
                    const isCompleted = stageIndex < currentStageIndex
                    const isActive = stageIndex === currentStageIndex

                    return (
                        <div
                            key={key}
                            className={`flex flex-col items-center p-2 rounded-lg transition-all ${isActive
                                    ? 'bg-brand-purple/20 scale-105'
                                    : isCompleted
                                        ? 'bg-accent-teal/20'
                                        : 'bg-gray-100'
                                }`}
                        >
                            <span className="text-2xl">{icon}</span>
                            <span className="text-xs text-dark-text text-center mt-1 font-medium">{key}</span>
                        </div>
                    )
                })}
            </div>

            {/* Chunk Progress */}
            {status.chunk_total > 0 && (
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Simplifying chunk {status.chunk_current} of {status.chunk_total}
                    </p>
                </div>
            )}

            {/* Message */}
            {status.message && (
                <p className="text-center text-sm text-gray-600">{status.message}</p>
            )}

            {/* Estimated Time */}
            {status.stage !== 'complete' && status.stage !== 'error' && (
                <p className="text-center text-xs text-gray-500">
                    ⏱️ Estimated time remaining: {estimatedTime}s
                </p>
            )}

            {/* Error State */}
            {status.stage === 'error' && (
                <div className="bg-error-red/10 border border-error-red rounded-lg p-3">
                    <p className="text-error-red font-medium text-sm">
                        Error: {status.message || 'Processing failed'}
                    </p>
                </div>
            )}
        </div>
    )
}
