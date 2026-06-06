"use client"

type ProfileCardProps = {
    title: string
    summary: string
    active: boolean
    onHover: () => void
    onClick: () => void
}

export default function ProfileCard({ title, summary, active, onHover, onClick }: ProfileCardProps) {
    return (
        <button
            type="button"
            onMouseEnter={onHover}
            onFocus={onHover}
            onClick={onClick}
            className={`w-full text-left rounded-3xl border p-4 transition-shadow duration-300 ${
                active
                    ? 'border-brand-purple bg-brand-purple/10 shadow-lg shadow-brand-purple/10'
                    : 'border-slate-200 bg-white shadow-sm hover:border-brand-purple/50 hover:shadow-md'
            }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{summary}</p>
                </div>
                {active && <span className="rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-brand-purple">Active</span>}
            </div>
        </button>
    )
}
