"use client"

import Link from 'next/link'

export default function AIHeader({ profile }: { profile: string | null }) {
    return (
        <header className="bg-white rounded-lg p-4 flex items-center justify-between border">
            <div>
                <div className="text-sm text-gray-500">AI Assistant</div>
                <div className="text-xl font-bold">Your adaptive learning dashboard</div>
                <div className="text-xs text-gray-600">{profile ? `Profile: ${profile}` : 'No profile selected'}</div>
            </div>

            <div className="flex items-center gap-3">
                <Link href="/personalize" className="px-3 py-2 border rounded">Personalize</Link>
                <button className="px-3 py-2 bg-brand-purple text-white rounded">AI Help</button>
            </div>
        </header>
    )
}
