import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const chapterId = params.id
    const { searchParams } = new URL(request.url)
    
    try {
        const backendResponse = await fetch(`${BACKEND_URL}/export-pdf/${chapterId}?${searchParams.toString()}`, {
            method: 'GET',
            cache: 'no-store'
        })

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: `Backend failed with status ${backendResponse.status}` },
                { status: backendResponse.status }
            )
        }

        const pdfBuffer = await backendResponse.arrayBuffer()
        
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="chapter_${chapterId}.pdf"`
            }
        })
    } catch (error) {
        console.error('Export PDF API error:', error)
        return NextResponse.json(
            { error: 'Failed to export PDF' },
            { status: 500 }
        )
    }
}
