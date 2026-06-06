import { NextRequest, NextResponse } from 'next/server'
import { getChapterFromDb, saveChapter } from '@/lib/serverDb'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; chunkId: string } }
) {
    try {
        const body = await request.json()
        const { id: chapterId, chunkId } = params

        const localChapter = getChapterFromDb(chapterId)
        if (!localChapter) {
            return NextResponse.json(
                { error: 'Chapter not found in local server database' },
                { status: 404 }
            )
        }

        // Update the specific chunk
        const updatedChunks = localChapter.chunks.map((chunk) => {
            if (chunk.chunk_id === chunkId) {
                return {
                    ...chunk,
                    ...body
                }
            }
            return chunk
        })

        const updatedChapter = {
            ...localChapter,
            chunks: updatedChunks
        }

        saveChapter(updatedChapter)
        return NextResponse.json(updatedChapter)
    } catch (error) {
        console.error('Update chunk error:', error)
        return NextResponse.json(
            { error: 'Failed to update chunk' },
            { status: 500 }
        )
    }
}
