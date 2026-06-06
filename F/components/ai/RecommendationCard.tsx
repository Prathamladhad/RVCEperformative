"use client"

export default function RecommendationCard({ title, description, confidence }: { title: string; description: string; confidence?: number }) {
    return (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="font-semibold">{title}</div>
                <div className="text-xs text-gray-500">Conf: {confidence ? Math.round(confidence * 100) + '%' : '—'}</div>
            </div>
            <div className="text-sm text-gray-600 mt-2">{description}</div>
            <div className="mt-4 flex gap-2">
                <button className="px-3 py-1 bg-accent-teal text-white rounded">Try</button>
                <button className="px-3 py-1 border rounded">Save</button>
            </div>
        </div>
    )
}
