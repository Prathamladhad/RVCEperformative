/**
 * exportChunksPDF — Dyslexia-Optimised Chunked Chapter PDF Exporter
 *
 * Produces a structured, accessible PDF from processed chapter chunks.
 * Includes: cover page → per-chunk sections → consolidated glossary appendix → core facts summary.
 */

import type { ChapterData, ChunkObject } from './types'

export interface ExportOptions {
  includeOriginal?: boolean
  includeGlossary?: boolean
  includeCoreFacts?: boolean
  includeObjectives?: boolean
  studentName?: string
}

// Hex colours mapped to jsPDF RGB arrays
const PURPLE   = [109, 40, 217] as const
const TEAL     = [5, 150, 105]  as const
const DARK     = [20, 20, 40]   as const
const MUTED    = [110, 110, 130] as const
const WHITE    = [255, 255, 255] as const
const LAVENDER = [245, 243, 255] as const
const MINT     = [236, 253, 245] as const
const AMBER    = [255, 250, 235] as const

export async function exportChunksPDF(
  chapter: ChapterData,
  options: ExportOptions = {}
): Promise<void> {
  const {
    includeOriginal = false,
    includeGlossary = true,
    includeCoreFacts = true,
    includeObjectives = true,
    studentName,
  } = options

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW   = 210
  const margin  = 16
  const cW      = pageW - margin * 2   // content width = 178
  let y         = 0

  // ── helpers ──────────────────────────────────────────────────────────────

  const newPage = () => { doc.addPage(); y = 20 }

  const ensureSpace = (needed: number) => {
    if (y + needed > 280) newPage()
  }

  const setColor = (rgb: readonly [number, number, number], type: 'text' | 'fill' | 'draw' = 'text') => {
    if (type === 'text')  doc.setTextColor(rgb[0], rgb[1], rgb[2])
    if (type === 'fill')  doc.setFillColor(rgb[0], rgb[1], rgb[2])
    if (type === 'draw')  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
  }

  const wrappedText = (
    text: string,
    x: number,
    startY: number,
    maxW: number,
    lineH = 4.5
  ): number => {
    const lines = doc.splitTextToSize(text, maxW)
    doc.text(lines, x, startY)
    return startY + lines.length * lineH
  }

  // ── COVER PAGE ────────────────────────────────────────────────────────────

  // Purple header bar
  setColor(PURPLE, 'fill')
  doc.rect(0, 0, pageW, 18, 'F')
  setColor(WHITE)
  doc.setFontSize(10).setFont('helvetica', 'bold')
  doc.text('NeuroAdapt AI  ·  Dyslexia-Optimised Study Document', margin, 12)

  y = 36
  setColor(DARK)
  doc.setFontSize(22).setFont('helvetica', 'bold')
  y = wrappedText(chapter.title, margin, y, cW, 9) + 4

  doc.setFontSize(9).setFont('helvetica', 'normal')
  setColor(MUTED)
  doc.text(
    `Subject: ${chapter.subject}  |  Class: ${chapter.class_level}  |  Board: ${(chapter.board || '').toUpperCase()}`,
    margin, y
  )
  y += 5
  doc.text(`Sections: ${chapter.chunks.length}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, margin, y)
  if (studentName) {
    y += 5
    doc.text(`Prepared for: ${studentName}`, margin, y)
  }
  y += 7

  setColor([220, 210, 240], 'draw')
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // Quick summary box
  setColor(LAVENDER, 'fill')
  doc.roundedRect(margin, y - 2, cW, 28, 3, 3, 'F')
  doc.setFontSize(8).setFont('helvetica', 'bold')
  setColor(PURPLE)
  doc.text('📚  About This Document', margin + 5, y + 5)
  doc.setFontSize(7.5).setFont('helvetica', 'normal')
  setColor([60, 60, 80])
  y = wrappedText(
    'This document has been transformed by NeuroAdapt AI for students with dyslexia, ADHD, autism, and other learning differences. ' +
    'Each section includes a simplified version, key vocabulary, and a glossary. ' +
    'The consolidated glossary at the end lists all terms alphabetically.',
    margin + 5, y + 11, cW - 10, 4
  )
  y += 8

  // ── PER-CHUNK SECTIONS ────────────────────────────────────────────────────

  chapter.chunks.forEach((chunk: ChunkObject, idx: number) => {
    newPage()

    // Section header badge
    setColor(PURPLE, 'fill')
    doc.roundedRect(margin - 2, y - 4, cW + 4, 11, 2, 2, 'F')
    doc.setFontSize(10).setFont('helvetica', 'bold')
    setColor(WHITE)
    doc.text(`Section ${idx + 1}  of  ${chapter.chunks.length}`, margin + 2, y + 4)
    y += 14

    // Objective
    if (includeObjectives && chunk.objective) {
      ensureSpace(12)
      setColor(LAVENDER, 'fill')
      doc.roundedRect(margin, y - 2, cW, 10, 2, 2, 'F')
      doc.setFontSize(7.5).setFont('helvetica', 'bolditalic')
      setColor(PURPLE)
      const objLines = doc.splitTextToSize(`🎯  ${chunk.objective}`, cW - 6)
      doc.text(objLines, margin + 3, y + 4)
      y += objLines.length * 4 + 6
    }

    // Original text (optional)
    if (includeOriginal && chunk.original_text) {
      ensureSpace(10)
      doc.setFontSize(7.5).setFont('helvetica', 'bold')
      setColor([60, 60, 80])
      doc.text('Original Text:', margin, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      setColor([70, 70, 90])
      const origLines = doc.splitTextToSize(chunk.original_text, cW)
      ensureSpace(origLines.length * 4 + 4)
      doc.text(origLines, margin, y)
      y += origLines.length * 4 + 5
    }

    // Simplified text — green box
    if (chunk.simplified_text) {
      const simplLines = doc.splitTextToSize(chunk.simplified_text, cW - 8)
      const boxH = simplLines.length * 4.5 + 10
      ensureSpace(boxH + 4)
      setColor(MINT, 'fill')
      doc.roundedRect(margin, y - 2, cW, boxH, 2, 2, 'F')
      doc.setFontSize(7.5).setFont('helvetica', 'bold')
      setColor(TEAL)
      doc.text('✅  Simplified (Dyslexia-Friendly):', margin + 4, y + 5)
      y += 9
      doc.setFont('helvetica', 'normal')
      setColor([20, 80, 60])
      doc.text(simplLines, margin + 4, y)
      y += simplLines.length * 4.5 + 6
    }

    // Key terms pill strip
    if (chunk.key_terms && chunk.key_terms.length > 0) {
      ensureSpace(10)
      doc.setFontSize(7.5).setFont('helvetica', 'bold')
      setColor([60, 60, 80])
      doc.text('Key Terms:', margin, y)
      doc.setFont('helvetica', 'normal')
      setColor([100, 60, 180])
      const termsLine = doc.splitTextToSize(chunk.key_terms.join('  •  '), cW - 26)
      doc.text(termsLine, margin + 26, y)
      y += Math.max(5, termsLine.length * 4) + 3
    }

    // Core facts
    if (includeCoreFacts && chunk.core_facts && chunk.core_facts.length > 0) {
      ensureSpace(10)
      doc.setFontSize(7.5).setFont('helvetica', 'bold')
      setColor([60, 60, 80])
      doc.text('Core Facts:', margin, y)
      y += 4
      chunk.core_facts.forEach((fact, fi) => {
        const factLines = doc.splitTextToSize(`${fi + 1}. ${fact}`, cW - 4)
        ensureSpace(factLines.length * 4 + 2)
        if (fi % 2 === 0) {
          setColor(AMBER, 'fill')
          doc.rect(margin, y - 1, cW, factLines.length * 4 + 2, 'F')
        }
        doc.setFont('helvetica', 'normal')
        setColor([60, 50, 20])
        doc.text(factLines, margin + 2, y + 2)
        y += factLines.length * 4 + 2
      })
      y += 3
    }

    // Per-chunk mini glossary
    if (includeGlossary && chunk.glossary && Object.keys(chunk.glossary).length > 0) {
      ensureSpace(12)
      doc.setFontSize(7.5).setFont('helvetica', 'bold')
      setColor([60, 60, 80])
      doc.text('📖  Glossary (this section):', margin, y)
      y += 4

      Object.entries(chunk.glossary).forEach(([term, def]) => {
        const defLines = doc.splitTextToSize(String(def), cW - 30)
        const rowH = Math.max(6, defLines.length * 4 + 2)
        ensureSpace(rowH + 2)
        doc.setFont('helvetica', 'bold')
        setColor([80, 40, 160])
        doc.text(`${term}:`, margin + 3, y + 4)
        doc.setFont('helvetica', 'normal')
        setColor([60, 60, 80])
        doc.text(defLines, margin + 30, y + 4)
        y += rowH
      })
      y += 3
    }

    // Section divider
    setColor([220, 210, 240], 'draw')
    ensureSpace(4)
    doc.line(margin, y, pageW - margin, y)
    y += 6
  })

  // ── CONSOLIDATED GLOSSARY APPENDIX ────────────────────────────────────────

  if (includeGlossary) {
    newPage()

    setColor(TEAL, 'fill')
    doc.rect(0, y - 10, pageW, 16, 'F')
    setColor(WHITE)
    doc.setFontSize(12).setFont('helvetica', 'bold')
    doc.text('📖  Consolidated Glossary  (All Sections)', margin, y)
    y += 14

    // Collect and deduplicate all glossary terms across chunks
    const allTerms: Record<string, string> = {}
    chapter.chunks.forEach(chunk => {
      if (chunk.glossary) {
        Object.entries(chunk.glossary).forEach(([term, def]) => {
          if (!allTerms[term.toLowerCase()]) {
            allTerms[term.toLowerCase()] = `${term}: ${def}`
          }
        })
      }
    })

    const sorted = Object.values(allTerms).sort((a, b) => a.localeCompare(b))

    if (sorted.length === 0) {
      doc.setFontSize(8).setFont('helvetica', 'italic')
      setColor(MUTED)
      doc.text('No glossary terms were found in this chapter.', margin, y)
      y += 8
    } else {
      sorted.forEach((entry, i) => {
        const lines = doc.splitTextToSize(entry, cW - 4)
        const rowH  = Math.max(7, lines.length * 4 + 3)
        ensureSpace(rowH + 2)

        if (i % 2 === 0) {
          setColor(LAVENDER, 'fill')
          doc.rect(margin, y - 1, cW, rowH, 'F')
        }
        doc.setFontSize(7).setFont('helvetica', 'normal')
        setColor([60, 40, 100])
        doc.text(lines, margin + 3, y + 3)
        y += rowH
      })
    }
  }

  // ── CORE FACTS SUMMARY PAGE ───────────────────────────────────────────────

  if (includeCoreFacts) {
    const allFacts: string[] = []
    chapter.chunks.forEach(chunk => {
      if (chunk.core_facts) allFacts.push(...chunk.core_facts)
    })

    if (allFacts.length > 0) {
      newPage()

      setColor(PURPLE, 'fill')
      doc.rect(0, y - 10, pageW, 16, 'F')
      setColor(WHITE)
      doc.setFontSize(12).setFont('helvetica', 'bold')
      doc.text('🔑  Core Facts Summary  (Quick Revision)', margin, y)
      y += 14

      allFacts.forEach((fact, i) => {
        const lines = doc.splitTextToSize(`${i + 1}.  ${fact}`, cW - 4)
        const rowH  = Math.max(7, lines.length * 4 + 3)
        ensureSpace(rowH + 2)

        if (i % 2 === 0) {
          setColor(AMBER, 'fill')
          doc.rect(margin, y - 1, cW, rowH, 'F')
        }
        doc.setFontSize(7).setFont('helvetica', 'normal')
        setColor([60, 50, 20])
        doc.text(lines, margin + 3, y + 3)
        y += rowH
      })
    }
  }

  // ── FOOTER ON ALL PAGES ───────────────────────────────────────────────────

  const totalPages: number = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(6.5).setFont('helvetica', 'normal')
    setColor(MUTED)
    const footerText = studentName
      ? `NeuroAdapt AI  •  ${chapter.title}  •  Prepared for ${studentName}  •  Page ${p} of ${totalPages}`
      : `NeuroAdapt AI  •  ${chapter.title}  •  Page ${p} of ${totalPages}`
    doc.text(footerText, margin, 293)
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────

  const safeName = (chapter.title || 'chapter').replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const suffix   = studentName ? `_${studentName.replace(/\s+/g, '_').toLowerCase()}` : ''
  doc.save(`neuroadapt_${safeName}${suffix}.pdf`)
}
