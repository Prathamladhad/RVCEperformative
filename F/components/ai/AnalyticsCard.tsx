"use client"

export default function AnalyticsCard({ title, value, unit, note }: { title: string; value: number; unit?: string; note?: string }) {
    return (
        <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-500">{title}</div>
            <div className="text-2xl font-bold">{value}{unit && <span className="text-sm">{unit}</span>}</div>
            {note && <div className="text-xs text-gray-600 mt-1">{note}</div>}
        </div>
    )
}
