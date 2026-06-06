'use client'

import { useState, useCallback, useEffect } from 'react'
import { StudentPrefs } from '@/lib/types'
import { getStudentPrefs, saveStudentPrefs, resetStudentPrefs } from '@/lib/storage'

export function useAccessibility() {
    const [prefs, setPrefs] = useState<StudentPrefs>({
        font: 'opendyslexic',
        fontSize: 18,
        lineHeight: 1.5,
        letterSpacing: 0.05,
        background: 'cream',
        showRuler: true,
        ttsSpeed: 1,
        ttsAutoPlay: false,
    })
    const [mounted, setMounted] = useState(false)

    // Load preferences from localStorage on mount
    useEffect(() => {
        const loaded = getStudentPrefs()
        // Force specifications
        loaded.font = 'opendyslexic'
        loaded.fontSize = Math.max(16, loaded.fontSize)
        loaded.lineHeight = 1.5
        setPrefs(loaded)
        applyPrefsToDOM(loaded)
        setMounted(true)
    }, [])

    const updatePref = useCallback(
        <K extends keyof StudentPrefs>(key: K, value: StudentPrefs[K]) => {
            const updated = { ...prefs, [key]: value }
            // Force specs
            updated.font = 'opendyslexic'
            updated.lineHeight = 1.5
            setPrefs(updated)
            saveStudentPrefs(updated)
            applyPrefsToDOM(updated)
        },
        [prefs]
    )

    const reset = useCallback(() => {
        resetStudentPrefs()
        const defaults = getStudentPrefs()
        defaults.font = 'opendyslexic'
        defaults.fontSize = 18
        defaults.lineHeight = 1.5
        defaults.background = 'cream'
        setPrefs(defaults)
        applyPrefsToDOM(defaults)
    }, [])

    return {
        prefs,
        updatePref,
        reset,
        mounted,
    }
}

function applyPrefsToDOM(prefs: StudentPrefs): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Primary Font: OpenDyslexic (This must be applied globally to all text)
    const fontMap = {
        opendyslexic: "'OpenDyslexic', 'Lexend', system-ui, -apple-system, sans-serif",
        lexend: "'OpenDyslexic', 'Lexend', system-ui, -apple-system, sans-serif",
        system: "'OpenDyslexic', 'Lexend', system-ui, -apple-system, sans-serif",
    }
    root.style.setProperty('--font-primary', fontMap.opendyslexic)

    // Base Font Size: 18px (Ensures text is large enough)
    const sizeVal = Math.max(16, prefs.fontSize)
    root.style.fontSize = `${sizeVal}px`
    root.style.setProperty('--font-size', `${sizeVal}px`)

    // Line Height (Leading): 1.5
    root.style.setProperty('--line-height', '1.5')

    // Letter spacing (in em)
    root.style.setProperty('--letter-spacing', `${prefs.letterSpacing}em`)

    // Background colors: Soft Cream #FFFFE5 or Soft Peach #FFE5B4
    const bgMap = {
        cream: '#FFFFE5',
        white: '#FFFFE5',
        blue: '#FFFFE5',
        dark: '#FFFFE5',
        sensory: '#FFFFE5',
        warm: '#FFE5B4',
    }
    const bgVal = bgMap[prefs.background] || bgMap.cream
    
    // Low-Contrast and Anti-Glare specifications
    root.style.setProperty('--bg-page', bgVal)
    root.style.setProperty('--bg-container', '#FEFAF0')
    root.style.setProperty('--color-text', '#1A1A1A')
    root.style.setProperty('--border-color', '#DCD7BA')

    // Colorblind safe accents (Okabe-Ito parameterization)
    root.style.setProperty('--color-blue', '#0072B2')
    root.style.setProperty('--color-orange', '#E69F00')
    root.style.setProperty('--color-teal', '#009E73')
    root.style.setProperty('--color-purple', '#CC79A7')
    root.style.setProperty('--color-sky', '#56B4E9')
    root.style.setProperty('--color-vermillion', '#D55E00')

    // Force left text align on all containers
    root.style.setProperty('text-align', 'left')

    // Apply to body
    document.body.style.fontFamily = fontMap.opendyslexic
    document.body.style.fontSize = `${sizeVal}px`
    document.body.style.lineHeight = '1.5'
    document.body.style.letterSpacing = `${prefs.letterSpacing}em`
    document.body.style.backgroundColor = bgVal
    document.body.style.color = '#1A1A1A'
    document.body.style.textAlign = 'left'
}
