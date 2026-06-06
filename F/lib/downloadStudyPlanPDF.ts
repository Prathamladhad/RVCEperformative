export async function downloadStudyPlanPDF(planJson: string) {
    let plan: any
    try {
        plan = JSON.parse(planJson)
    } catch {
        return
    }
    if (!plan || !plan.cognitiveScore) return

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 16
    const pageWidth = 210
    const contentWidth = pageWidth - margin * 2
    let y = 18

    const checkPage = (needed = 10) => {
        if (y + needed > 282) { doc.addPage(); y = 18 }
    }

    // Header bar
    doc.setFillColor(109, 40, 217)
    doc.rect(0, 0, 210, 13, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('NeuroAdapt AI  ─  Personalised Study Plan', margin, 9)

    // Title
    y = 22
    doc.setTextColor(20, 20, 40)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(`Study Plan for ${plan.studentName || 'Student'}`, contentWidth)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 8 + 1

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(110, 110, 130)
    doc.text(`Profile: ${plan.profile || 'General'}  |  Chapter: ${plan.chapterTitle || '—'}  |  Generated: ${new Date(plan.generatedAt || Date.now()).toLocaleDateString()}`, margin, y)
    y += 4
    doc.setDrawColor(200, 200, 225)
    doc.line(margin, y, 210 - margin, y)
    y += 7

    // ─── Cognitive Score ───
    doc.setFillColor(245, 243, 255)
    doc.roundedRect(margin, y - 3, contentWidth, 22, 3, 3, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(109, 40, 217)
    doc.text(`Cognitive Score: ${plan.cognitiveScore}/100  (${plan.cogLevel || ''})`, margin + 4, y + 5)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 80)
    const scoreLines = doc.splitTextToSize(plan.scoreMessage || '', contentWidth - 8)
    doc.text(scoreLines, margin + 4, y + 11)
    y += 26

    // ─── Cognitive Metrics Table ───
    if (plan.cognitiveMetrics && plan.cognitiveMetrics.length > 0) {
        checkPage(14)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(40, 40, 60)
        doc.text('Cognitive Performance Metrics', margin, y)
        y += 5

        // Table header
        doc.setFillColor(109, 40, 217)
        doc.rect(margin, y, contentWidth, 6, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text('Metric', margin + 2, y + 4)
        doc.text('Value', margin + 60, y + 4)
        doc.text('Level', margin + 90, y + 4)
        doc.text('Insight', margin + 120, y + 4)
        y += 7

        plan.cognitiveMetrics.forEach((m: any, i: number) => {
            const insightLines = doc.splitTextToSize(m.insight || '', contentWidth - 122)
            const rowH = Math.max(8, insightLines.length * 4 + 4)
            checkPage(rowH + 2)

            if (i % 2 === 0) {
                doc.setFillColor(248, 245, 255)
                doc.rect(margin, y - 1, contentWidth, rowH, 'F')
            }
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(60, 40, 100)
            doc.text(m.metric || '', margin + 2, y + 4)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(30, 30, 50)
            doc.text(m.value || '', margin + 60, y + 4)
            doc.setTextColor(100, 60, 180)
            doc.text(m.level || '', margin + 90, y + 4)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(70, 70, 90)
            doc.text(insightLines, margin + 120, y + 4)
            y += rowH
        })
        y += 5
    }

    // ─── Daily Routine Table ───
    if (plan.dailyRoutine && plan.dailyRoutine.length > 0) {
        checkPage(14)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(40, 40, 60)
        doc.text('Recommended Daily Routine', margin, y)
        y += 5

        doc.setFillColor(5, 150, 105)
        doc.rect(margin, y, contentWidth, 6, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text('Time', margin + 2, y + 4)
        doc.text('Activity', margin + 40, y + 4)
        doc.text('Type', margin + 90, y + 4)
        doc.text('What To Do', margin + 120, y + 4)
        y += 7

        plan.dailyRoutine.forEach((r: any, i: number) => {
            const descLines = doc.splitTextToSize(r.description || '', contentWidth - 122)
            const rowH = Math.max(8, descLines.length * 4 + 4)
            checkPage(rowH + 2)

            if (i % 2 === 0) {
                doc.setFillColor(236, 253, 245)
                doc.rect(margin, y - 1, contentWidth, rowH, 'F')
            }
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(20, 100, 70)
            doc.text(r.time || '', margin + 2, y + 4)
            doc.setTextColor(30, 30, 50)
            doc.text(doc.splitTextToSize(r.activity || '', 45), margin + 40, y + 4)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(80, 80, 100)
            doc.text(r.type || '', margin + 90, y + 4)
            doc.setTextColor(50, 50, 70)
            doc.text(descLines, margin + 120, y + 4)
            y += rowH
        })
        y += 5
    }

    // ─── Study Tips ───
    if (plan.tips && plan.tips.length > 0) {
        checkPage(14)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(40, 40, 60)
        doc.text('Personalised Study Tips', margin, y)
        y += 5

        plan.tips.forEach((tip: string, i: number) => {
            const tipLines = doc.splitTextToSize(`${i + 1}.  ${tip}`, contentWidth - 5)
            checkPage(tipLines.length * 4 + 4)
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(60, 60, 80)
            if (i % 2 === 0) {
                doc.setFillColor(255, 250, 235)
                doc.rect(margin, y - 1, contentWidth, tipLines.length * 4 + 3, 'F')
            }
            doc.text(tipLines, margin + 2, y + 3)
            y += tipLines.length * 4 + 3
        })
        y += 4
    }

    // ─── Recommendations ───
    if (plan.recommendations && plan.recommendations.length > 0) {
        checkPage(14)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(40, 40, 60)
        doc.text('Personalised Recommendations', margin, y)
        y += 5

        plan.recommendations.forEach((rec: string, i: number) => {
            const recLines = doc.splitTextToSize(`→  ${rec}`, contentWidth - 3)
            checkPage(recLines.length * 4 + 4)
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(5, 100, 80)
            if (i % 2 === 0) {
                doc.setFillColor(236, 253, 245)
                doc.rect(margin, y - 1, contentWidth, recLines.length * 4 + 3, 'F')
            }
            doc.text(recLines, margin + 2, y + 3)
            y += recLines.length * 4 + 3
        })
    }

    // Footer on all pages
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFontSize(7)
        doc.setTextColor(160, 160, 180)
        doc.text(
            `NeuroAdapt AI  •  Personalised Study Plan for ${plan.studentName || 'Student'}  •  Page ${p} of ${totalPages}`,
            margin, 293
        )
    }

    const safeName = (plan.studentName || 'student').replace(/[^a-z0-9]/gi, '_').toLowerCase()
    doc.save(`neuroadapt_study_plan_${safeName}.pdf`)
}
