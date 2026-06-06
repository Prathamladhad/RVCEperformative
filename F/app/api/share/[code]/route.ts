import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(
    _request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const response = await fetch(`${BACKEND_URL}/share/${params.code}`, {
            method: 'GET',
            cache: 'no-store',
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Chapter not found or not shared' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Share code error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch chapter' },
            { status: 500 }
        )
    }
}
