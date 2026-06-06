'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ARPdfViewerProps { isOpen: boolean; onClose: () => void; mode?: 'student' | 'teacher' }
interface FmtLine { emoji: string; text: string }
interface Bubble {
    id: number; word: string; emoji: string
    x: number; y: number; vx: number; vy: number
    r: number; dwell: number; caught: boolean
    explodeAt: number | null; hue: number
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; hue: number }

/* ─────────────────────────────────────────────
   Emoji mapper
───────────────────────────────────────────── */
const EMOJI_RULES: { kw: string[]; e: string }[] = [
    { kw: ['definition','defined','means','is called','refers to','known as'], e: '📖' },
    { kw: ['example','for instance','such as','e.g.','like','illustrat'], e: '💡' },
    { kw: ['note','remember','important','caution','key','must'], e: '⚠️' },
    { kw: ['step','first','second','third','finally','then','next'], e: '👉' },
    { kw: ['?','question','how','why','what','when','where'], e: '❓' },
    { kw: ['result','conclusion','therefore','thus','hence','proves'], e: '✅' },
    { kw: ['formula','equation','=','theorem','law','rule'], e: '🔢' },
    { kw: ['property','characteristic','feature','nature'], e: '🔬' },
    { kw: ['cause','reason','because','due to'], e: '🔗' },
    { kw: ['advantage','benefit','merit','application'], e: '🌟' },
    { kw: ['type','kind','class','category','classification'], e: '📂' },
    { kw: ['process','method','procedure','technique'], e: '⚙️' },
    { kw: ['history','discovered','invented','year'], e: '📅' },
    { kw: ['chapter','topic','section','lesson'], e: '📚' },
]
function lineEmoji(s: string) {
    if (/^\d+[.)]\s/.test(s.trim())) return '🔹'
    if (s.trim() === s.trim().toUpperCase() && s.trim().length > 3 && /[A-Z]/.test(s)) return '📌'
    const lo = s.toLowerCase()
    for (const r of EMOJI_RULES) if (r.kw.some(k => lo.includes(k))) return r.e
    return '•'
}
function fmtLines(raw: string[]): FmtLine[] {
    return raw.filter(l => l.trim().length > 2)
              .map(r => ({ emoji: lineEmoji(r), text: r.replace(/^[\-\*•·▪▸►>]+\s*/, '').trim() }))
}

/* ─────────────────────────────────────────────
   MediaPipe hand skeleton connections
───────────────────────────────────────────── */
// @ts-ignore -- kept for reference; skeleton drawn via SEG_COLOR
const _HAND_CONN: [number, number][] = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17],
]
const TIP_COLOR: Record<number, string> = { 4: '#ff6b6b', 8: '#00ff96', 12: '#60a5fa', 16: '#fbbf24', 20: '#e879f9' }
const SEG_COLOR: [string, [number,number][]][] = [
    ['rgba(255,100,100,0.9)', [[0,1],[1,2],[2,3],[3,4]]],
    ['rgba(0,255,150,0.9)',   [[0,5],[5,6],[6,7],[7,8]]],
    ['rgba(96,165,250,0.9)', [[0,9],[9,10],[10,11],[11,12]]],
    ['rgba(251,191,36,0.9)', [[0,13],[13,14],[14,15],[15,16]]],
    ['rgba(232,121,249,0.9)',[[0,17],[17,18],[18,19],[19,20]]],
    ['rgba(255,255,255,0.4)',[[5,9],[9,13],[13,17]]],
]

const COLORS = [{ v: '#FFFFFF' }, { v: '#FDE68A' }, { v: '#67E8F9' }, { v: '#A3E635' }, { v: '#F9A8D4' }]
const SPD_MAP = { slow: 7000, medium: 3500, fast: 1500 }
const DWELL_MS = 500   // ms to hold finger on bubble to catch (reduced for better responsiveness)

/* ═══════════════════════════════════════════
   Component
═══════════════════════════════════════════ */
export function ARPdfViewer({ isOpen, onClose }: ARPdfViewerProps) {

    /* ── PDF ── */
    const [pdfPages, setPdfPages]       = useState<FmtLine[][]>([])
    const [currentPage, setCurrentPage] = useState(0)
    const [pdfLoading, setPdfLoading]   = useState(false)
    const [pdfFileName, setPdfFileName] = useState<string | null>(null)
    const [dropActive, setDropActive]   = useState(false)

    /* ── Camera ── */
    const [arActive, setArActive]           = useState(false)
    const [cameraError, setCameraError]     = useState<string | null>(null)
    const [cameraLoading, setCameraLoading] = useState(false)
    const [facingFront, setFacingFront]     = useState(true)
    const facingFrontRef = useRef(true)

    /* ── MediaPipe ── */
    const [mpReady, setMpReady]     = useState(false)
    const handsModelRef             = useRef<any>(null)
    const mpBusyRef                 = useRef(false)
    const mpScriptsLoaded           = useRef({ hands: false })

    /* ── Gesture state ── */
    const [fingerPos, setFingerPos]   = useState<{ x: number; y: number } | null>(null)
    const [gesture, setGesture]       = useState<'none' | 'point' | 'pinch' | 'open' | 'fist'>('none')
    const gestureRef                  = useRef<'none' | 'point' | 'pinch' | 'open' | 'fist'>('none')
    const [gestureMsg, setGestureMsg] = useState<string | null>(null)
    const gestureCooldown             = useRef(false)
    const motionHist                  = useRef<{ x: number; y: number; t: number }[]>([])

    /* ── AR overlay (normal mode) ── */
    const [overlayPos, setOverlayPos]     = useState({ x: 30, y: 80 })
    const [handControl, setHandControl]   = useState(false)
    const handCtrlRef                     = useRef(false)
    const [highlights, setHighlights]     = useState<Set<number>>(new Set())
    const [scanLine, setScanLine]         = useState(0)
    const [scanPaused, setScanPaused]     = useState(false)
    const scanIntervalRef                 = useRef<ReturnType<typeof setInterval> | null>(null)
    const isDragging                      = useRef(false)
    const dragOff                         = useRef({ x: 0, y: 0 })

    /* ── Controls ── */
    const [ctrl, setCtrl] = useState({ fontSize: 18, color: '#FFFFFF', opacity: 0.85, scanSpeed: 'medium' as 'slow'|'medium'|'fast', bgBlur: 6 })
    const [showPanel, setShowPanel]       = useState(true)
    const [showControls, setShowControls] = useState(false)

    /* ── GAME ── */
    const [gameMode, setGameMode]         = useState(false)
    const gameModeRef                     = useRef(false)
    const [gamePhase, setGamePhase]       = useState<'idle' | 'countdown' | 'playing' | 'over'>('idle')
    const gamePhaseRef                    = useRef<'idle' | 'countdown' | 'playing' | 'over'>('idle')
    const [score, setScore]               = useState(0)
    const scoreRef                        = useRef(0)
    const [_lives, setLives]               = useState(3)
    const livesRef                        = useRef(3)
    const [_timeLeft, setTimeLeft]         = useState(60)
    const timeLeftRef                     = useRef(60)
    const [countdown, setCountdown]       = useState(3)
    const [caughtWord, setCaughtWord]     = useState<string | null>(null)
    const bubblesRef                      = useRef<Bubble[]>([])
    const particlesRef                    = useRef<Particle[]>([])
    const wordPoolRef                     = useRef<string[]>([])
    const lastSpawnRef                    = useRef(0)
    const lastFrameTimeRef                = useRef(0)
    const gameTimerRef                    = useRef<ReturnType<typeof setInterval> | null>(null)
    const cdTimerRef                      = useRef<ReturnType<typeof setInterval> | null>(null)

    /* ── Refs ── */
    const videoRef     = useRef<HTMLVideoElement>(null)
    const canvasRef    = useRef<HTMLCanvasElement>(null)
    const streamRef    = useRef<MediaStream | null>(null)
    const rafRef       = useRef<number>(0)
    const arWrapRef    = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    /* sync refs with state */
    useEffect(() => { facingFrontRef.current = facingFront }, [facingFront])
    useEffect(() => { handCtrlRef.current = handControl }, [handControl])
    useEffect(() => { gameModeRef.current = gameMode }, [gameMode])

    /* cleanup on close */
    useEffect(() => {
        if (!isOpen) stopAll()
        return () => stopAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    /* scanner */
    useEffect(() => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
        if (!arActive || scanPaused || pdfPages.length === 0 || gameMode) return
        const lc = pdfPages[currentPage]?.length || 1
        scanIntervalRef.current = setInterval(
            () => setScanLine(p => { const n = p + 100 / lc; return n >= 100 ? 0 : n }),
            SPD_MAP[ctrl.scanSpeed] / lc
        )
        return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current) }
    }, [arActive, scanPaused, ctrl.scanSpeed, currentPage, pdfPages, gameMode])

    /* ─────────────────────────────────────────
       MediaPipe initialization
    ───────────────────────────────────────── */
    const tryInitMediaPipe = useCallback(() => {
        const Hands = (window as any).Hands
        if (!Hands || handsModelRef.current) return
        const h = new Hands({
            locateFile: (f: string) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`,
        })
        h.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.78,
            minTrackingConfidence: 0.65,
        })
        h.onResults(onHandResults)
        handsModelRef.current = h
        setMpReady(true)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    /* ─────────────────────────────────────────
       Hand results callback (called by MediaPipe)
    ───────────────────────────────────────── */
    const onHandResults = useCallback((results: any) => {
        mpBusyRef.current = false
        const canvas = canvasRef.current
        const video  = videoRef.current
        if (!canvas || !video || !video.videoWidth) return
        const W = video.videoWidth, H = video.videoHeight
        canvas.width = W; canvas.height = H
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        try {

        /* 1 ── Draw video (mirrored for front cam) */
        ctx.save()
        if (facingFrontRef.current) { ctx.translate(W, 0); ctx.scale(-1, 1) }
        ctx.drawImage(video, 0, 0, W, H)
        ctx.restore()

        let fx: number | null = null
        let fy: number | null = null
        let g: 'none' | 'point' | 'pinch' | 'open' | 'fist' = 'none'

        if (results.multiHandLandmarks?.length > 0) {
            const lm = results.multiHandLandmarks[0] as { x: number; y: number; z: number }[]

            /* 2 ── Draw skeleton */
            drawSkeleton(ctx, lm, W, H)

            /* 3 ── Index fingertip (lm[8]), mirrored */
            const mirrorX = (v: number) => facingFrontRef.current ? (1 - v) * W : v * W
            fx = mirrorX(lm[8].x)
            fy = lm[8].y * H

            /* 4 ── Gesture detection */
            const thumbTip = lm[4]; const indexTip = lm[8]
            const midTip   = lm[12]; const ringTip  = lm[16]; const pinkyTip = lm[20]
            const tx = Math.abs(mirrorX(thumbTip.x) - mirrorX(indexTip.x)) / W
            const ty = Math.abs(thumbTip.y - indexTip.y)
            const pinchDist = Math.hypot(tx, ty)
            const isPinch  = pinchDist < 0.06
            const idxUp    = indexTip.y  < lm[6].y
            const midUp    = midTip.y    < lm[10].y
            const ringUp   = ringTip.y   < lm[14].y
            const pinkyUp  = pinkyTip.y  < lm[18].y
            const allUp    = idxUp && midUp && ringUp && pinkyUp
            const allDown  = !idxUp && !midUp && !ringUp && !pinkyUp

            g = isPinch ? 'pinch'
              : allUp    ? 'open'
              : allDown  ? 'fist'
              : idxUp && !midUp ? 'point'
              : 'none'

            gestureRef.current = g
            setGesture(g)
            setFingerPos({ x: fx / W, y: fy / H })

            /* 5 ── Draw cursor at fingertip */
            drawCursor(ctx, fx, fy, g)

            /* 6 ── Swipe gesture detection (for normal mode page turns) */
            if (!gameModeRef.current && !gestureCooldown.current) {
                const now = Date.now()
                motionHist.current.push({ x: fx / W, y: fy / H, t: now })
                motionHist.current = motionHist.current.filter(p => now - p.t < 550)
                if (motionHist.current.length > 5) {
                    const a = motionHist.current[0]
                    const b = motionHist.current[motionHist.current.length - 1]
                    const dx = b.x - a.x; const dy = b.y - a.y; const dt = b.t - a.t
                    if (Math.abs(dx) > 0.35 && Math.abs(dy) < 0.2 && dt < 450) {
                        gestureCooldown.current = true
                        motionHist.current = []
                        if (dx > 0) { setCurrentPage(p => Math.min((pdfPages.length || 1) - 1, p + 1)); flash('→ Next Page') }
                        else         { setCurrentPage(p => Math.max(0, p - 1)); flash('← Prev Page') }
                        setTimeout(() => { gestureCooldown.current = false }, 1200)
                    }
                    if (dy < -0.32 && Math.abs(dx) < 0.2 && dt < 450) {
                        gestureCooldown.current = true; motionHist.current = []
                        setCtrl(c => ({ ...c, fontSize: Math.min(34, c.fontSize + 2) })); flash('↑ Font +')
                        setTimeout(() => { gestureCooldown.current = false }, 1000)
                    }
                    if (dy > 0.32 && Math.abs(dx) < 0.2 && dt < 450) {
                        gestureCooldown.current = true; motionHist.current = []
                        setCtrl(c => ({ ...c, fontSize: Math.max(12, c.fontSize - 2) })); flash('↓ Font -')
                        setTimeout(() => { gestureCooldown.current = false }, 1000)
                    }
                }
            }

            /* 7 ── Move overlay (hand control mode) */
            if (handCtrlRef.current && !gameModeRef.current) {
                const rect = arWrapRef.current?.getBoundingClientRect()
                if (rect) {
                    const tx2 = (fx / W) * rect.width  - 110
                    const ty2 = (fy / H) * rect.height - 80
                    setOverlayPos(prev => ({
                        x: Math.max(0, Math.min(rect.width  - 220, prev.x * 0.8 + tx2 * 0.2)),
                        y: Math.max(40, Math.min(rect.height - 200, prev.y * 0.8 + ty2 * 0.2)),
                    }))
                }
            }
        } else {
            setFingerPos(null)
            setGesture('none')
            gestureRef.current = 'none'
            /* Redraw plain video when no hand */
        }

        /* 8 ── Game update/draw */
        if (gameModeRef.current && gamePhaseRef.current === 'playing') {
            const now = performance.now()
            const dt  = Math.min(now - lastFrameTimeRef.current, 50)
            lastFrameTimeRef.current = now
            updateGame(ctx, fx, fy, g, W, H, dt)
        }

        } catch (err) {
            // Prevent errors from freezing the canvas pipeline
            console.warn('[AR] Frame error:', err)
        }

    }, [pdfPages.length]) // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Draw hand skeleton ── */
    const drawSkeleton = (ctx: CanvasRenderingContext2D, lm: { x:number;y:number;z:number }[], W: number, H: number) => {
        const pt = (i: number) => ({
            x: facingFrontRef.current ? (1 - lm[i].x) * W : lm[i].x * W,
            y: lm[i].y * H,
        })
        ctx.save()
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        for (const [color, pairs] of SEG_COLOR) {
            ctx.strokeStyle = color
            ctx.shadowColor = color; ctx.shadowBlur = 6
            for (const [a, b] of pairs as [number,number][]) {
                const pa = pt(a), pb = pt(b)
                ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke()
            }
        }
        ctx.shadowBlur = 0
        for (let i = 0; i < 21; i++) {
            const p = pt(i)
            const isTip = [4,8,12,16,20].includes(i)
            const r = isTip ? 8 : (i === 0 ? 6 : 4)
            ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
            ctx.fillStyle = TIP_COLOR[i] ?? 'rgba(255,255,255,0.9)'
            ctx.shadowColor = TIP_COLOR[i] ?? 'white'; ctx.shadowBlur = isTip ? 12 : 0
            ctx.fill()
            if (isTip) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke() }
        }
        ctx.restore()
    }

    /* ── Draw fingertip cursor ── */
    const drawCursor = (ctx: CanvasRenderingContext2D, x: number, y: number, g: string) => {
        const color = g === 'pinch' ? '#ff6b6b' : g === 'open' ? '#fbbf24' : '#00ff96'
        ctx.save()
        ctx.shadowColor = color; ctx.shadowBlur = 24
        ctx.beginPath(); ctx.arc(x, y, g === 'pinch' ? 20 : 15, 0, Math.PI * 2)
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke()
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = color; ctx.fill()
        /* gesture label */
        ctx.shadowBlur = 0; ctx.font = 'bold 12px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.textAlign = 'center'; ctx.fillText(g === 'pinch' ? '🤏' : g === 'open' ? '✋' : g === 'point' ? '☝️' : g === 'fist' ? '✊' : '', x, y - 22)
        ctx.restore()
    }

    /* ─────────────────────────────────────────
       Word Catch Game
    ───────────────────────────────────────── */
    const updateGame = (ctx: CanvasRenderingContext2D, fx: number|null, fy: number|null, _g: string, W: number, H: number, dt: number) => {
        if (W <= 0 || H <= 0) return // guard against invalid canvas dimensions
        const now = performance.now()
        let gameEnded = false

        /* Spawn */
        const spawnGap = Math.max(1000, 2800 - scoreRef.current * 15)
        if (now - lastSpawnRef.current > spawnGap && wordPoolRef.current.length > 0) {
            const pool = wordPoolRef.current
            const word = pool[Math.floor(Math.random() * pool.length)]
            // Speed in pixels per millisecond — scales with canvas width for consistency
            const baseSpeed = W * 0.00015
            const speed = Math.min(baseSpeed * 3, baseSpeed + scoreRef.current * baseSpeed * 0.02)
            bubblesRef.current.push({
                id: now + Math.random(),
                word: word.slice(0, 18),
                emoji: lineEmoji(word),
                x: W + 100, y: 80 + Math.random() * Math.max(1, H - 180),
                vx: -speed, vy: (Math.random() - 0.5) * 0.02,
                r: Math.max(50, Math.min(85, 30 + word.length * 3.5)),
                dwell: 0, caught: false, explodeAt: null,
                hue: Math.random() * 360,
            })
            lastSpawnRef.current = now
        }

        /* Update bubbles */
        bubblesRef.current = bubblesRef.current.filter(b =>
            b.caught ? (now - (b.explodeAt ?? 0)) < 700 : b.x + b.r > -60
        )
        const currentBubbles = [...bubblesRef.current]  // snapshot to avoid mutation-during-iteration
        for (const b of currentBubbles) {
            if (b.caught || gameEnded) continue
            // Move using pixels-per-ms velocity
            b.x += b.vx * dt
            b.y += b.vy * dt
            // Bounce off top/bottom edges
            if (b.y - b.r < 50 || b.y + b.r > H - 50) b.vy = -b.vy
            b.y = Math.max(b.r + 50, Math.min(H - b.r - 50, b.y))
            // Life lost when bubble exits left
            if (b.x + b.r < -30) {
                livesRef.current = Math.max(0, livesRef.current - 1)
                setLives(livesRef.current)
                b.caught = true; b.explodeAt = now;
                if (livesRef.current <= 0) {
                    gameEnded = true
                    continue  // don't return early — let drawing code run to keep ctx balanced
                }
                continue
            }
            // Finger collision — generous hitbox for fun gameplay
            if (fx !== null && fy !== null) {
                const dist = Math.hypot(fx - b.x, fy - b.y)
                const hitRadius = b.r + 45  // generous catch radius
                if (dist < hitRadius) {
                    b.dwell += dt
                    if (b.dwell >= DWELL_MS) {
                        b.caught = true; b.explodeAt = now
                        scoreRef.current += 10; setScore(scoreRef.current)
                        setCaughtWord(b.word); setTimeout(() => setCaughtWord(null), 900)
                        
                        try {
                            const utt = new SpeechSynthesisUtterance(b.word)
                            utt.rate = 1.0
                            window.speechSynthesis.speak(utt)
                        } catch(e) {}

                        for (let p = 0; p < 22; p++) {
                            const angle = (p / 22) * Math.PI * 2
                            const spd = 2.5 + Math.random() * 5
                            particlesRef.current.push({ x: b.x, y: b.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 1, hue: b.hue })
                        }
                    }
                } else {
                    // Gradual dwell decay — don't punish small hand jitter
                    b.dwell = Math.max(0, b.dwell - dt * 1.5)
                }
            }
        }

        /* Update particles */
        particlesRef.current = particlesRef.current.filter(p => p.life > 0)
        for (const p of particlesRef.current) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.028 }

        /* ── Draw particles ── */
        ctx.save()
        for (const p of particlesRef.current) {
            ctx.beginPath(); ctx.arc(p.x, p.y, 6 * p.life, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${p.hue},100%,70%,${p.life})`
            ctx.shadowColor = `hsl(${p.hue},100%,70%)`; ctx.shadowBlur = 8
            ctx.fill()
        }
        ctx.restore()

        /* ── Draw bubbles ── */
        ctx.save()
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        for (const b of bubblesRef.current) {
            if (b.caught && b.explodeAt !== null) {
                const t = (now - b.explodeAt) / 700
                if (t > 0.15) {
                    ctx.globalAlpha = Math.max(0, 1 - t * 1.4)
                    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(1 + t * 0.8, 1 + t * 0.8)
                    ctx.font = 'bold 18px system-ui'; ctx.fillStyle = `hsl(${b.hue},100%,80%)`
                    ctx.shadowColor = `hsl(${b.hue},100%,70%)`; ctx.shadowBlur = 20
                    ctx.fillText(`✨ +10`, 0, 0)
                    ctx.restore(); ctx.globalAlpha = 1
                }
                continue
            }
            const dwellRatio = b.dwell / DWELL_MS
            /* glow pulse */
            const pulse = Math.sin(now / 300) * 0.15 + 0.85
            /* bubble body */
            const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.05, b.x, b.y, b.r)
            grad.addColorStop(0, `hsla(${b.hue},80%,80%,0.9)`)
            grad.addColorStop(1, `hsla(${b.hue},60%,30%,0.75)`)
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2)
            ctx.fillStyle = grad; ctx.fill()
            ctx.strokeStyle = `hsla(${b.hue},100%,80%,0.95)`; ctx.lineWidth = 2.5
            ctx.shadowColor = `hsla(${b.hue},100%,70%,0.6)`; ctx.shadowBlur = 10; ctx.stroke()
            ctx.shadowBlur = 0
            /* dwell ring */
            if (dwellRatio > 0) {
                ctx.beginPath()
                ctx.arc(b.x, b.y, b.r + 7, -Math.PI / 2, -Math.PI / 2 + dwellRatio * Math.PI * 2)
                ctx.strokeStyle = '#00ff96'; ctx.lineWidth = 5
                ctx.shadowColor = '#00ff96'; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0
            }
            /* emoji */
            const fs = Math.min(22, b.r * 0.38)
            ctx.font = `${fs}px system-ui`; ctx.fillStyle = 'white'
            ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4
            ctx.fillText(b.emoji, b.x, b.y - b.r * 0.22)
            /* word */
            const wfs = Math.min(13, b.r * 0.2)
            ctx.font = `bold ${wfs}px system-ui`
            const disp = b.word.length > 15 ? b.word.slice(0, 13) + '…' : b.word
            ctx.fillText(disp, b.x, b.y + b.r * 0.25, b.r * 1.7)
            ctx.shadowBlur = 0
        }
        ctx.restore()

        /* ── HUD ── */
        ctx.save()
        /* Score */
        ctx.font = 'bold 26px system-ui'; ctx.fillStyle = '#fbbf24'
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'
        ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12
        ctx.fillText(`⭐ ${scoreRef.current}`, 14, 14)
        /* Time */
        const t = timeLeftRef.current
        ctx.fillStyle = t <= 10 ? '#ff6b6b' : '#ffffff'
        ctx.shadowColor = t <= 10 ? '#ff6b6b' : 'transparent'
        ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(`⏱ ${t}s`, W / 2, 14)
        /* Lives */
        ctx.textAlign = 'right'; ctx.fillStyle = '#ff6b6b'; ctx.shadowColor = '#ff6b6b'
        ctx.font = '22px system-ui'
        ctx.fillText('❤️'.repeat(livesRef.current) + '🖤'.repeat(Math.max(0, 3 - livesRef.current)), W - 14, 14)
        ctx.shadowBlur = 0
        /* Guide */
        ctx.font = '13px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.55)'
        ctx.textAlign = 'center'
        ctx.fillText('☝️ Point at bubble — hold finger to catch!', W / 2, H - 20)
        ctx.restore()

        /* End game AFTER all drawing is done (ctx.save/restore balanced) */
        if (gameEnded) {
            endGame()
        }
    }

    /* ─────────────────────────────────────────
       Game lifecycle
    ───────────────────────────────────────── */
    const startGame = () => {
        clearInterval(gameTimerRef.current!); clearInterval(cdTimerRef.current!)
        /* word pool from PDF page */
        const lines = pdfPages[currentPage] || []
        const words = lines.flatMap(l => l.text.split(/\s+/).filter(w => w.length > 3 && /[a-zA-Z]/.test(w)))
        wordPoolRef.current = words.length > 8 ? words : ['Study','Learn','Focus','Think','Brain','Smart','Grow','Read','Know','Imagine']
        scoreRef.current = 0; livesRef.current = 3; timeLeftRef.current = 60
        setScore(0); setLives(3); setTimeLeft(60)
        bubblesRef.current = []; particlesRef.current = []
        lastSpawnRef.current = performance.now()

        let cd = 3; setCountdown(cd)
        setGamePhase('countdown'); gamePhaseRef.current = 'countdown'
        cdTimerRef.current = setInterval(() => {
            cd--; setCountdown(cd)
            if (cd <= 0) {
                clearInterval(cdTimerRef.current!)
                setGamePhase('playing'); gamePhaseRef.current = 'playing'
                lastFrameTimeRef.current = performance.now()
                gameTimerRef.current = setInterval(() => {
                    timeLeftRef.current = Math.max(0, timeLeftRef.current - 1)
                    setTimeLeft(timeLeftRef.current)
                    if (timeLeftRef.current <= 0) endGame()
                }, 1000)
            }
        }, 1000)
    }

    const endGame = () => {
        clearInterval(gameTimerRef.current!); clearInterval(cdTimerRef.current!)
        setGamePhase('over'); gamePhaseRef.current = 'over'
        bubblesRef.current = []; particlesRef.current = []
    }

    /* ─────────────────────────────────────────
       rAF loop — feeds frames to MediaPipe,
       with fallback direct-draw when MP isn't ready
    ───────────────────────────────────────── */
    const rafLoop = useCallback(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        const hands = handsModelRef.current

        if (video && video.readyState >= 2) {
            if (hands && !mpBusyRef.current) {
                // Send frame to MediaPipe for hand detection
                mpBusyRef.current = true
                hands.send({ image: video }).catch(() => { mpBusyRef.current = false })
            } else if (!hands && canvas) {
                // Fallback: draw video directly to canvas when MediaPipe hasn't loaded yet
                const W = video.videoWidth || canvas.clientWidth
                const H = video.videoHeight || canvas.clientHeight
                if (W > 0 && H > 0) {
                    canvas.width = W; canvas.height = H
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        ctx.save()
                        if (facingFrontRef.current) { ctx.translate(W, 0); ctx.scale(-1, 1) }
                        ctx.drawImage(video, 0, 0, W, H)
                        ctx.restore()
                        // Draw "loading hand tracking" indicator
                        ctx.save()
                        ctx.font = 'bold 14px system-ui'
                        ctx.fillStyle = 'rgba(0,0,0,0.55)'
                        ctx.fillRect(0, H - 40, W, 40)
                        ctx.fillStyle = '#fbbf24'
                        ctx.textAlign = 'center'
                        ctx.fillText('⏳ Loading hand tracking... Camera is active', W / 2, H - 14)
                        ctx.restore()
                    }
                }
            }
        }
        rafRef.current = requestAnimationFrame(rafLoop)
    }, [])

    /* ─────────────────────────────────────────
       Camera
    ───────────────────────────────────────── */
    const startCamera = async () => {
        setCameraError(null); setCameraLoading(true)
        try {
            streamRef.current?.getTracks().forEach(t => t.stop())
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingFrontRef.current ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            })
            streamRef.current = stream
            const vid = videoRef.current!
            vid.srcObject = stream
            vid.onloadedmetadata = () => vid.play().catch(() => {})
            setArActive(true)
            cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(rafLoop)
        } catch (err: any) {
            setCameraError(
                err.name === 'NotAllowedError'   ? 'Camera permission denied. Please allow access in browser settings.'
                : err.name === 'NotFoundError'   ? 'No camera found on this device.'
                : err.name === 'NotReadableError'? 'Camera is in use by another app.'
                : err.message || 'Camera error.')
        } finally { setCameraLoading(false) }
    }

    const stopAll = () => {
        cancelAnimationFrame(rafRef.current)
        clearInterval(scanIntervalRef.current!); clearInterval(gameTimerRef.current!); clearInterval(cdTimerRef.current!)
        streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
        setArActive(false); setScanLine(0); setGamePhase('idle'); gamePhaseRef.current = 'idle'
        bubblesRef.current = []; particlesRef.current = []; mpBusyRef.current = false
    }

    /* ── PDF extraction ── */
    const extractPdf = async (file: File) => {
        if (file.type !== 'application/pdf') { alert('Please select a PDF file.'); return }
        setPdfLoading(true); setPdfFileName(file.name); setPdfPages([]); setCurrentPage(0); setHighlights(new Set())
        try {
            const pdfjs = (window as any).pdfjsLib
            if (!pdfjs) { setTimeout(() => extractPdf(file), 1300); return }
            const pdf   = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
            const pages: FmtLine[][] = []
            for (let p = 1; p <= pdf.numPages; p++) {
                const page = await pdf.getPage(p); const content = await page.getTextContent()
                const raw: string[] = []; let cur = '', lastY = -Infinity
                ;(content.items as any[]).forEach(item => {
                    if (!item.str?.trim()) return
                    const y = item.transform?.[5] ?? 0
                    if (lastY !== -Infinity && Math.abs(y - lastY) > 4) { if (cur.trim()) raw.push(cur.trim()); cur = item.str }
                    else cur += (cur ? ' ' : '') + item.str; lastY = y
                })
                if (cur.trim()) raw.push(cur.trim())
                pages.push(fmtLines(raw))
            }
            setPdfPages(pages)
        } catch (e: any) { alert('PDF extraction failed: ' + e.message) }
        finally { setPdfLoading(false) }
    }

    /* ── flash message ── */
    const flash = (msg: string) => { setGestureMsg(msg); setTimeout(() => setGestureMsg(null), 1100) }

    /* ── Drag overlay ── */
    const onHandleDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (handControl) return
        isDragging.current = true
        const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
        const cy = 'touches' in e ? e.touches[0].clientY : e.clientY
        dragOff.current = { x: cx - overlayPos.x, y: cy - overlayPos.y }
        e.preventDefault()
    }
    useEffect(() => {
        const mv  = (e: MouseEvent) => { if (!isDragging.current) return; setOverlayPos({ x: e.clientX - dragOff.current.x, y: e.clientY - dragOff.current.y }) }
        const tm  = (e: TouchEvent) => { if (!isDragging.current) return; setOverlayPos({ x: e.touches[0].clientX - dragOff.current.x, y: e.touches[0].clientY - dragOff.current.y }) }
        const up  = () => { isDragging.current = false }
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up)
        window.addEventListener('touchmove', tm, { passive: true }); window.addEventListener('touchend', up)
        return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', up) }
    }, [])

    /* ─────────────────────────────────────────
       Helpers
    ───────────────────────────────────────── */
    const currentLines = pdfPages[currentPage] || []
    const scanIdx      = Math.floor((scanLine / 100) * currentLines.length)
    const toggleHL     = (i: number) => setHighlights(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })

    if (!isOpen) return null

    /* ═══════════════════════════════════════
       RENDER
    ═══════════════════════════════════════ */
    return (
        <>
            {/* pdf.js */}
            <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" strategy="lazyOnload"
                onLoad={() => { const p = (window as any).pdfjsLib; if (p) p.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js' }} />

            {/* MediaPipe Hands — load JS then init */}
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossOrigin="anonymous" strategy="lazyOnload"
                onLoad={() => { mpScriptsLoaded.current.hands = true; tryInitMediaPipe() }} />

            {/* ══ Fullscreen modal ══ */}
            <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: '#050508' }}>

                {/* ── Top bar ── */}
                <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🔮</span>
                        <div>
                            <p className="text-white font-bold text-sm leading-none">AR PDF Viewer</p>
                            <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                {mpReady ? '✅ MediaPipe Hands Active' : '⏳ Loading hand tracking…'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">

                        {/* Game mode toggle */}
                        {arActive && pdfPages.length > 0 && (
                            <button onClick={() => { setGameMode(v => { const n = !v; gameModeRef.current = n; if (!n) { endGame() } return n }) }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all hover:scale-105"
                                style={{
                                    background: gameMode ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.05)',
                                    color: gameMode ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                                    border: `1px solid ${gameMode ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                    boxShadow: gameMode ? '0 0 12px rgba(251,191,36,0.25)' : undefined,
                                }}>
                                🎮 {gameMode ? 'Exit Game' : 'Play Game'}
                            </button>
                        )}

                        {/* Hand control (normal mode) */}
                        {arActive && !gameMode && (
                            <button onClick={() => setHandControl(v => !v)}
                                className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl transition-all"
                                style={{
                                    background: handControl ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                                    color: handControl ? '#34d399' : 'rgba(255,255,255,0.4)',
                                    border: `1px solid ${handControl ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                }}>
                                ✋ {handControl ? 'Hand: ON' : 'Hand: OFF'}
                            </button>
                        )}

                        {arActive && <button onClick={() => {
                            const newFacing = !facingFront
                            setFacingFront(newFacing)
                            facingFrontRef.current = newFacing
                            // Restart the camera stream with the new facing mode
                            startCamera()
                        }}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            🔄 Flip
                        </button>}

                        {!gameMode && <button onClick={() => setShowPanel(v => !v)}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl"
                            style={{ background: showPanel ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', color: showPanel ? '#a78bfa' : 'rgba(255,255,255,0.4)', border: `1px solid ${showPanel ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                            📄 PDF
                        </button>}

                        {!gameMode && <button onClick={() => setShowControls(v => !v)}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl"
                            style={{ background: showControls ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: showControls ? '#60a5fa' : 'rgba(255,255,255,0.4)', border: `1px solid ${showControls ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                            ⚙️
                        </button>}

                        <button onClick={() => { stopAll(); onClose() }}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-white font-bold hover:scale-110 transition-all"
                            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}>✕</button>
                    </div>
                </div>

                {/* ── Controls row ── */}
                {showControls && !gameMode && (
                    <div className="flex-shrink-0 px-3 py-2 flex flex-wrap gap-4 items-center"
                        style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <label className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Size</span>
                            <input type="range" min={12} max={34} value={ctrl.fontSize} onChange={e => setCtrl(c => ({ ...c, fontSize: +e.target.value }))} className="w-20 accent-violet-500" />
                            <span className="text-xs text-white">{ctrl.fontSize}</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>BG</span>
                            <input type="range" min={0} max={85} value={Math.round((1-ctrl.opacity)*100)} onChange={e => setCtrl(c => ({ ...c, opacity: 1 - +e.target.value/100 }))} className="w-20 accent-violet-500" />
                        </label>
                        <label className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Blur</span>
                            <input type="range" min={0} max={20} value={ctrl.bgBlur} onChange={e => setCtrl(c => ({ ...c, bgBlur: +e.target.value }))} className="w-20 accent-violet-500" />
                        </label>
                        <div className="flex items-center gap-1.5">
                            {COLORS.map(c => <button key={c.v} onClick={() => setCtrl(x => ({ ...x, color: c.v }))} className="w-5 h-5 rounded-full hover:scale-125 transition-transform" style={{ background: c.v, border: ctrl.color === c.v ? '2px solid white' : '2px solid rgba(255,255,255,0.15)', transform: ctrl.color === c.v ? 'scale(1.25)' : undefined }} />)}
                        </div>
                        <div className="flex items-center gap-1.5">
                            {(['slow','medium','fast'] as const).map(s => <button key={s} onClick={() => setCtrl(c => ({ ...c, scanSpeed: s }))} className="px-2 py-0.5 text-[10px] font-bold rounded-full capitalize" style={{ background: ctrl.scanSpeed===s?'rgba(139,92,246,0.35)':'rgba(255,255,255,0.05)', color: ctrl.scanSpeed===s?'#c4b5fd':'rgba(255,255,255,0.35)', border: `1px solid ${ctrl.scanSpeed===s?'rgba(139,92,246,0.5)':'rgba(255,255,255,0.08)'}` }}>{s}</button>)}
                        </div>
                    </div>
                )}

                {/* ── Gesture guide bar ── */}
                {arActive && !gameMode && (
                    <div className="flex-shrink-0 flex items-center gap-3 px-3 py-1 overflow-x-auto"
                        style={{ background: 'rgba(0,255,150,0.04)', borderBottom: '1px solid rgba(0,255,150,0.08)' }}>
                        {[['☝️ Point','Move overlay (hand ctrl)'],['🤏 Pinch','Select / interact'],['✋ Open','Grab / confirm'],['→ Swipe','Next page'],['← Swipe','Prev page'],['↑↓ Swipe','Font size']].map(([g,a])=>(
                            <div key={g} className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-[11px] font-bold text-white">{g}</span>
                                <span className="text-[9px]" style={{color:'rgba(255,255,255,0.35)'}}>→ {a}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Main area ── */}
                <div className="flex flex-1 overflow-hidden min-h-0">

                    {/* ── PDF Panel (hidden in game mode) ── */}
                    {showPanel && !gameMode && (
                        <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
                            {/* Upload */}
                            <div className="p-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                <div onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDropActive(true) }} onDragLeave={() => setDropActive(false)}
                                    onDrop={e => { e.preventDefault(); setDropActive(false); const f = e.dataTransfer.files[0]; if (f) extractPdf(f) }}
                                    className="rounded-xl p-2.5 text-center cursor-pointer"
                                    style={{ border: `2px dashed ${dropActive?'rgba(139,92,246,0.8)':'rgba(255,255,255,0.1)'}`, background: dropActive?'rgba(139,92,246,0.08)':'rgba(255,255,255,0.02)' }}>
                                    {pdfLoading ? <div className="flex items-center justify-center gap-1.5"><div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin"/><span className="text-[11px] text-violet-300">Extracting…</span></div>
                                    : pdfFileName ? <div><span className="text-xl">📄</span><p className="text-[10px] font-bold text-violet-300 truncate">{pdfFileName}</p><p className="text-[9px]" style={{color:'rgba(255,255,255,0.3)'}}>{pdfPages.length}p • tap to replace</p></div>
                                    : <div><span className="text-2xl">📁</span><p className="text-[11px] mt-1" style={{color:'rgba(255,255,255,0.4)'}}>Drop PDF or click</p></div>}
                                    <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) extractPdf(f) }} />
                                </div>
                            </div>
                            {/* Page nav */}
                            {pdfPages.length > 0 && (
                                <div className="flex items-center justify-between px-2.5 py-1.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                    <button onClick={() => { setCurrentPage(p => Math.max(0,p-1)); setHighlights(new Set()) }} disabled={currentPage===0} className="text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-30" style={{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)'}}>←</button>
                                    <span className="text-[10px] font-bold text-white">Pg {currentPage+1}/{pdfPages.length}</span>
                                    <button onClick={() => { setCurrentPage(p => Math.min(pdfPages.length-1,p+1)); setHighlights(new Set()) }} disabled={currentPage===pdfPages.length-1} className="text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-30" style={{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)'}}>→</button>
                                </div>
                            )}
                            {/* Lines */}
                            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                                {currentLines.length === 0 && <p className="text-center text-[10px] py-6" style={{color:'rgba(255,255,255,0.18)'}}>Upload a PDF</p>}
                                {currentLines.map((line, i) => (
                                    <div key={i} onClick={() => toggleHL(i)} className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-[10px] leading-snug"
                                        style={{ background: highlights.has(i)?'rgba(139,92,246,0.2)':scanIdx===i?'rgba(255,255,255,0.05)':'transparent', color: highlights.has(i)?'#c4b5fd':'rgba(255,255,255,0.5)', borderLeft: highlights.has(i)?'2px solid #8b5cf6':'2px solid transparent' }}>
                                        <span className="flex-shrink-0">{line.emoji}</span><span>{line.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── AR / Game canvas area ── */}
                    <div ref={arWrapRef} className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">

                        {/* Hidden video — always in DOM so ref is valid before arActive */}
                        <video ref={videoRef} autoPlay playsInline muted
                            style={{ position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none', zIndex:0 }} />

                        {/* Main composite canvas (video + hand skeleton + game) */}
                        <canvas ref={canvasRef}
                            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:2, display: arActive ? 'block' : 'none' }} />

                        {/* ── GAME OVERLAYS (React UI on top of canvas) ── */}
                        {gameMode && arActive && (
                            <>
                                {/* Countdown */}
                                {gamePhase === 'countdown' && (
                                    <div className="absolute inset-0 flex items-center justify-center" style={{zIndex:20}}>
                                        <div style={{fontSize: 120, fontWeight:900, color:'white', textShadow:'0 0 40px rgba(251,191,36,0.8)', animation:'countdown-pop 1s ease'}}>{countdown}</div>
                                    </div>
                                )}

                                {/* Game idle */}
                                {gamePhase === 'idle' && (
                                    <div className="absolute inset-0 flex items-center justify-center" style={{zIndex:20}}>
                                        <div className="text-center space-y-5 px-8">
                                            <div className="text-6xl" style={{animation:'float 2s ease-in-out infinite'}}>🎮</div>
                                            <h2 className="text-white font-black text-3xl">Glossary Hunt!</h2>
                                            <p className="text-sm max-w-xs mx-auto" style={{color:'rgba(255,255,255,0.55)'}}>
                                                Words from your PDF float across the screen. <strong className="text-emerald-400">Point ☝️</strong> at a bubble and hold your finger still to catch it!
                                            </p>
                                            <div className="flex flex-col gap-2 text-xs" style={{color:'rgba(255,255,255,0.4)'}}>
                                                <span>☝️ Point finger → move cursor</span>
                                                <span>Hold cursor on bubble {DWELL_MS/1000}s → catch word (+10 pts)</span>
                                                <span>Miss 3 words → game over</span>
                                            </div>
                                            <button onClick={startGame} className="px-10 py-4 rounded-2xl font-black text-white text-lg hover:scale-105 transition-all"
                                                style={{background:'linear-gradient(135deg,#f59e0b,#ef4444)',boxShadow:'0 0 40px rgba(245,158,11,0.5)'}}>
                                                🚀 Start Game
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Caught word flash */}
                                {caughtWord && (
                                    <div className="absolute pointer-events-none" style={{zIndex:30, top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', animation:'pop-score 0.9s ease forwards'}}>
                                        <div style={{fontSize:40, fontWeight:900, color:'#fbbf24', textShadow:'0 0 20px rgba(251,191,36,0.8)'}}>{caughtWord}</div>
                                        <div style={{fontSize:20, color:'#00ff96', fontWeight:800}}>+10 ⭐</div>
                                    </div>
                                )}

                                {/* Game over */}
                                {gamePhase === 'over' && (
                                    <div className="absolute inset-0 flex items-center justify-center" style={{zIndex:20,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}}>
                                        <div className="text-center space-y-5 p-8 rounded-3xl" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)'}}>
                                            <div className="text-5xl">{scoreRef.current >= 100 ? '🏆' : scoreRef.current >= 50 ? '🥈' : '🎯'}</div>
                                            <h2 className="text-white font-black text-3xl">Game Over!</h2>
                                            <div className="text-5xl font-black" style={{color:'#fbbf24'}}>⭐ {score}</div>
                                            <p className="text-sm" style={{color:'rgba(255,255,255,0.5)'}}>
                                                {score >= 100 ? '🔥 Amazing! You\'re a reading champion!' : score >= 50 ? '👏 Great job! Keep practicing!' : '💪 Good start! Try again!'}
                                            </p>
                                            <div className="flex gap-3 justify-center">
                                                <button onClick={startGame} className="px-6 py-3 rounded-2xl font-bold text-white hover:scale-105 transition-all"
                                                    style={{background:'linear-gradient(135deg,#7c3aed,#4338ca)'}}>🔄 Play Again</button>
                                                <button onClick={() => { setGameMode(false); gameModeRef.current = false; setGamePhase('idle'); gamePhaseRef.current='idle' }}
                                                    className="px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all"
                                                    style={{background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.15)'}}>
                                                    📖 Back to AR
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── Gesture flash message ── */}
                        {gestureMsg && (
                            <div className="absolute pointer-events-none" style={{ zIndex:30, top:'48%', left:'50%', transform:'translate(-50%,-50%)', padding:'8px 22px', borderRadius:14, background:'rgba(16,185,129,0.88)', color:'white', fontWeight:800, fontSize:18, backdropFilter:'blur(8px)', animation:'fadeInOut 1.1s ease' }}>
                                {gestureMsg}
                            </div>
                        )}

                        {/* ── Gesture indicator badge ── */}
                        {arActive && fingerPos && (
                            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{zIndex:25, background:'rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}>
                                <span>{gesture==='pinch'?'🤏':gesture==='open'?'✋':gesture==='point'?'☝️':gesture==='fist'?'✊':'👁'}</span>
                                <span style={{color:gesture==='point'?'#00ff96':gesture==='pinch'?'#ff6b6b':gesture==='open'?'#fbbf24':'rgba(255,255,255,0.5)'}}>{gesture || 'no hand'}</span>
                            </div>
                        )}

                        {/* ── HUD badges ── */}
                        {arActive && (
                            <div className="absolute top-3 right-3 flex flex-col gap-1.5" style={{zIndex:25}}>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase" style={{background:'rgba(239,68,68,0.25)',border:'1px solid rgba(239,68,68,0.5)',color:'#fca5a5'}}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"/>LIVE
                                </div>
                                <div className="px-2.5 py-1 rounded-full text-[9px] font-bold" style={{background:mpReady?'rgba(16,185,129,0.2)':'rgba(245,158,11,0.15)',border:`1px solid ${mpReady?'rgba(16,185,129,0.4)':'rgba(245,158,11,0.3)'}`,color:mpReady?'#34d399':'#f59e0b'}}>
                                    {mpReady ? '✅ MediaPipe' : '⏳ Loading…'}
                                </div>
                            </div>
                        )}

                        {/* ── AR text overlay (normal mode) ── */}
                        {arActive && !gameMode && currentLines.length > 0 && (
                            <div style={{ position:'absolute', left:overlayPos.x, top:overlayPos.y, zIndex:15, maxWidth:400, userSelect:'none' }}>
                                {/* Handle */}
                                <div onMouseDown={onHandleDown} onTouchStart={e => { if(handControl) return; isDragging.current=true; dragOff.current={x:e.touches[0].clientX-overlayPos.x,y:e.touches[0].clientY-overlayPos.y} }}
                                    className="flex items-center justify-between px-3 py-1.5 rounded-t-2xl"
                                    style={{ background:handControl?'rgba(16,185,129,0.75)':'rgba(139,92,246,0.75)', backdropFilter:'blur(14px)', cursor:handControl?'default':'grab', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-white/60">{handControl?'✋':'⠿⠿'}</span>
                                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">{handControl?'Hand Ctrl':'Drag to move'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-white/50">Pg {currentPage+1}/{pdfPages.length}</span>
                                        <button onClick={()=>{setCurrentPage(p=>Math.max(0,p-1));setHighlights(new Set())}} disabled={currentPage===0} className="text-white/60 hover:text-white text-xs font-bold disabled:opacity-30 px-0.5">‹</button>
                                        <button onClick={()=>{setCurrentPage(p=>Math.min(pdfPages.length-1,p+1));setHighlights(new Set())}} disabled={currentPage===pdfPages.length-1} className="text-white/60 hover:text-white text-xs font-bold disabled:opacity-30 px-0.5">›</button>
                                    </div>
                                </div>
                                {/* Body */}
                                <div className="overflow-y-auto rounded-b-2xl p-2.5 space-y-0.5"
                                    style={{ maxHeight:'50vh', background:`rgba(0,0,0,${1-ctrl.opacity})`, backdropFilter:`blur(${ctrl.bgBlur}px)`, border:'1px solid rgba(255,255,255,0.08)', borderTop:'none' }}>
                                    {currentLines.map((line,i) => {
                                        const isScan = Math.abs(i-scanIdx)<=1 && !scanPaused
                                        const isHL   = highlights.has(i)
                                        return (
                                            <div key={i} onClick={()=>toggleHL(i)} className="flex items-start gap-2 px-2 py-1 rounded-xl cursor-pointer relative overflow-hidden"
                                                style={{ background:isHL?'rgba(139,92,246,0.35)':isScan?'rgba(255,255,255,0.09)':'transparent', borderLeft:isHL?`3px solid ${ctrl.color}`:'3px solid transparent', transition:'all 0.15s ease' }}>
                                                {isScan && <span className="absolute inset-0 rounded-xl pointer-events-none" style={{background:`linear-gradient(90deg,transparent,${ctrl.color}12,transparent)`,animation:'shimmer 1.5s ease-in-out infinite'}}/>}
                                                <span style={{fontSize:ctrl.fontSize*0.82,flexShrink:0,marginTop:2,filter:isHL?'drop-shadow(0 0 5px white)':undefined}}>{line.emoji}</span>
                                                <span style={{fontSize:ctrl.fontSize,color:ctrl.color,fontWeight:isHL?700:isScan?600:500,textShadow:isHL?`0 0 14px ${ctrl.color}bb,1px 1px 3px #000`:'1px 1px 4px rgba(0,0,0,0.95)',lineHeight:1.4,letterSpacing:'0.015em'}}>{line.text}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Inactive placeholder ── */}
                        {!arActive && (
                            <div className="flex flex-col items-center gap-5 text-center px-8" style={{zIndex:5}}>
                                <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl" style={{background:'rgba(139,92,246,0.1)',border:'2px solid rgba(139,92,246,0.3)',boxShadow:'0 0 50px rgba(139,92,246,0.15)',animation:'float 2.5s ease-in-out infinite'}}>📸</div>
                                <div className="space-y-2">
                                    <h3 className="text-white font-bold text-xl">AR Camera + MediaPipe Hands</h3>
                                    <p className="text-sm max-w-sm leading-relaxed" style={{color:'rgba(255,255,255,0.4)'}}>
                                        Upload a PDF, start the camera. 21-landmark <span className="text-emerald-400 font-bold">hand tracking</span> moves the text overlay. Switch to <span className="text-amber-400 font-bold">🎮 Game Mode</span> to play Word Catch!
                                    </p>
                                </div>
                                {cameraError && <div className="px-4 py-3 rounded-xl text-xs text-red-300 max-w-sm" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)'}}>⚠️ {cameraError}</div>}
                                <button onClick={startCamera} disabled={cameraLoading}
                                    className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    style={{background:'linear-gradient(135deg,#7c3aed,#4338ca)',boxShadow:'0 0 30px rgba(124,58,237,0.45)'}}>
                                    {cameraLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Opening…</span> : '🚀 Start Camera'}
                                </button>
                            </div>
                        )}

                        {/* ── Bottom bar ── */}
                        {arActive && !gameMode && (
                            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2" style={{zIndex:20}}>
                                <button onClick={()=>setScanPaused(v=>!v)} className="px-3 py-1.5 rounded-full text-[11px] font-bold hover:scale-105 transition-all" style={{background:scanPaused?'rgba(245,158,11,0.25)':'rgba(16,185,129,0.2)',border:`1px solid ${scanPaused?'rgba(245,158,11,0.5)':'rgba(16,185,129,0.4)'}`,color:scanPaused?'#fbbf24':'#34d399'}}>{scanPaused?'▶ Resume':'⏸ Pause'}</button>
                                <button onClick={()=>setHighlights(new Set())} disabled={highlights.size===0} className="px-3 py-1.5 rounded-full text-[11px] font-bold disabled:opacity-30 hover:scale-105 transition-all" style={{background:'rgba(139,92,246,0.2)',border:'1px solid rgba(139,92,246,0.4)',color:'#a78bfa'}}>🗑 Clear</button>
                                <button onClick={()=>setOverlayPos({x:32,y:80})} className="px-3 py-1.5 rounded-full text-[11px] font-bold hover:scale-105 transition-all" style={{background:'rgba(6,182,212,0.2)',border:'1px solid rgba(6,182,212,0.4)',color:'#22d3ee'}}>⊹ Reset</button>
                                <button onClick={stopAll} className="px-3 py-1.5 rounded-full text-[11px] font-bold hover:scale-105 transition-all" style={{background:'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.4)',color:'#f87171'}}>■ Stop</button>
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
                    @keyframes shimmer { 0%{transform:translateX(-120%);opacity:0} 50%{opacity:1} 100%{transform:translateX(120%);opacity:0} }
                    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
                    @keyframes fadeInOut { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.85)} 20%{opacity:1;transform:translate(-50%,-50%) scale(1)} 80%{opacity:1} 100%{opacity:0} }
                    @keyframes countdown-pop { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
                    @keyframes pop-score { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)} 30%{opacity:1;transform:translate(-50%,-70%) scale(1.1)} 70%{opacity:1;transform:translate(-50%,-85%) scale(1)} 100%{opacity:0;transform:translate(-50%,-100%) scale(0.9)} }
                `}</style>
            </div>
        </>
    )
}
