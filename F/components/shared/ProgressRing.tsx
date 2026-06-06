'use client'

interface ProgressRingProps {
    progress: number
    size?: number
    strokeWidth?: number
    label?: string
}

export function ProgressRing({
    progress,
    size = 100,
    strokeWidth = 4,
    label,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    return (
        <div className="flex flex-col items-center gap-2">
            <svg height={size} width={size} className="transform -rotate-90">
                <circle
                    stroke="#E5E7EB"
                    fill="none"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke="#534AB7"
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="transition-all duration-300"
                />
            </svg>
            {label && (
                <span className="text-sm font-medium text-dark-text">{label}</span>
            )}
        </div>
    )
}
