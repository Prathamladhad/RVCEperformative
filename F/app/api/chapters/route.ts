import { NextResponse } from 'next/server'
import { getAllChapters } from '@/lib/serverDb'

export async function GET() {
    try {
        // Return chapters saved in our local server database
        const chapters = getAllChapters()
        return NextResponse.json(chapters)
    } catch (error) {
        console.error('List chapters error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch chapters' },
            { status: 500 }
        )
    }
}
