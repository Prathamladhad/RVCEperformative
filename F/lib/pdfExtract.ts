import type { Buffer } from 'buffer'

function cleanText(raw: string): string {
    return raw
        .replace(/\x00/g, '')
        .replace(/[\t ]{2,}/g, ' ')
        .replace(/\n{4,}/g, '\n\n')
        .trim()
}

function decodePdfString(raw: string): string {
    return raw
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\b/g, '\b')
        .replace(/\\f/g, '\f')
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
}

function looksLikePdfMetadata(text: string): boolean {
    const trimmed = text.trim()
    if (!trimmed) return false

    const pdfMarkers = [
        /\/(Author|Creator|Producer|CreationDate|ModDate|Title|Pages|Font|Subtype|Filter|Length|Resources|MediaBox|Contents|Catalog)\b/,
        /\bobj\b/,
        /\bendobj\b/,
        /<<|>>/,
        /\/Type\s*\/Page/,
        /\/Filter\b/
    ]

    const markerCount = pdfMarkers.reduce((count, pattern) => count + (pattern.test(trimmed) ? 1 : 0), 0)
    if (markerCount >= 3) return true

    const slashLineCount = (trimmed.match(/^\s*\/\w+/gm) || []).length
    if (slashLineCount >= 3) return true

    const wordCount = trimmed.split(/\s+/).filter(Boolean).length
    const pdfKeywordCount = (trimmed.match(/\b(?:obj|endobj|stream|endstream|xref|trailer|<<|>>|\/Type|\/Length|\/Filter|\/Font)\b/g) || []).length
    return pdfKeywordCount > Math.max(3, Math.floor(wordCount * 0.1))
}

function extractTextFromPdfOperators(source: string): string {
    let text = ''

    const btBlocks = source.match(/BT[\s\S]*?ET/g) || []
    for (const block of btBlocks) {
        const strings = [...block.matchAll(/\(([^\\)]|\\.)*\)/g)]
        for (const match of strings) {
            text += decodePdfString(match[0].slice(1, -1)) + ' '
        }

        const arrayStrings = [...block.matchAll(/\[([^\]]*)\]\s*TJ/g)]
        for (const match of arrayStrings) {
            const inner = match[1]
            const parts = [...inner.matchAll(/\(([^\\)]|\\.)*\)/g)]
            for (const part of parts) {
                text += decodePdfString(part[0].slice(1, -1))
            }
            text += ' '
        }
    }

    const asciiRuns = source.match(/[\x20-\x7E]{80,}/g) || []
    for (const run of asciiRuns) {
        if (!run.includes('endstream') && !run.includes('/Font')) {
            text += run + ' '
        }
    }

    return text.trim()
}

async function extractTextWithPdfParse(buffer: Buffer): Promise<{ text: string; pages: number }> {
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = (pdfParseModule as any).default || pdfParseModule

    const data = await pdfParse(buffer, {
        max: 50
    })

    return {
        text: (data.text || '').trim(),
        pages: Number(data.numpages || 0)
    }
}

async function extractTextWithCustomPageRender(buffer: Buffer): Promise<{ text: string; pages: number }> {
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = (pdfParseModule as any).default || pdfParseModule

    const data = await pdfParse(buffer, {
        max: 50,
        pagerender: async (pageData: any) => {
            const renderOptions = { normalizeWhitespace: true, disableCombineTextItems: false }
            const textContent = await pageData.getTextContent(renderOptions)
            let lastY: number | null = null
            let pageText = ''

            for (const item of textContent.items || []) {
                const transform = item.transform || item.transformMatrix || []
                const y: number | null = typeof transform[5] === 'number' ? transform[5] : lastY
                if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
                    pageText += '\n'
                }
                pageText += item.str || ''
                lastY = y
            }

            return pageText
        }
    })

    return {
        text: (data.text || '').trim(),
        pages: Number(data.numpages || 0)
    }
}

export async function extractTextFromPdfBuffer(buffer: Buffer, filename: string): Promise<string> {
    const isPdf = buffer.slice(0, 4).toString('utf8') === '%PDF'
    if (!isPdf) {
        throw new Error(`File "${filename}" is not a valid PDF document.`)
    }

    let extracted = ''
    let pages = 0

    try {
        const result = await extractTextWithPdfParse(buffer)
        extracted = result.text
        pages = result.pages
        console.log(`[pdfExtract] pdf-parse returned ${extracted.length} chars from ${pages} page(s)`)
    } catch (err) {
        console.warn('[pdfExtract] pdf-parse initial extraction failed:', err)
    }

    if (extracted.trim().length >= 100 && !looksLikePdfMetadata(extracted)) {
        return cleanText(extracted)
    }

    if (looksLikePdfMetadata(extracted)) {
        console.warn('[pdfExtract] pdf-parse extracted PDF metadata only; ignoring that result.')
        extracted = ''
    }

    try {
        const fallbackResult = await extractTextWithCustomPageRender(buffer)
        if (fallbackResult.text.trim().length > extracted.trim().length) {
            extracted = fallbackResult.text
            pages = fallbackResult.pages
        }
        console.log(`[pdfExtract] pdf-parse custom render returned ${extracted.length} chars from ${pages} page(s)`)
    } catch (err) {
        console.warn('[pdfExtract] pdf-parse custom render extraction failed:', err)
    }

    if (extracted.trim().length >= 100 && !looksLikePdfMetadata(extracted)) {
        return cleanText(extracted)
    }

    if (looksLikePdfMetadata(extracted)) {
        console.warn('[pdfExtract] custom render extracted PDF metadata only; ignoring that result.')
        extracted = ''
    }

    const rawText = extractTextFromPdfOperators(buffer.toString('latin1'))
    console.log(`[pdfExtract] heuristic operator extraction returned ${rawText.length} chars`)
    if (rawText.trim().length >= 100 && !looksLikePdfMetadata(rawText)) {
        return cleanText(rawText)
    }

    throw new Error(
        `Could not extract readable text from "${filename}". ` +
        `This PDF looks like it may contain scanned pages or embedded images rather than selectable text. ` +
        `Please use a digital (text-based) PDF, or paste the chapter text directly.`
    )
}
