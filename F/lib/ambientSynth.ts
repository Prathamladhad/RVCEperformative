// Web Audio API Ambient Sound Synthesizer
// Synthesizes soothing ambient sounds programmatically in the browser.

class AmbientSynthesizer {
    private ctx: AudioContext | null = null
    private nodes: AudioNode[] = []
    private isRunning = false
    private activeTheme: 'Forest Rain' | 'Cosmic Zen' | 'Silence' = 'Silence'

    private initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
            this.ctx = new AudioCtx()
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume()
        }
    }

    private clearNodes() {
        this.nodes.forEach((node) => {
            try {
                node.disconnect()
                if ((node as any).stop) {
                    (node as any).stop()
                }
            } catch (e) {
                // Ignore disconnect errors
            }
        })
        this.nodes = []
    }

    public play(theme: 'Forest Rain' | 'Cosmic Zen' | 'Silence') {
        if (typeof window === 'undefined') return
        this.initContext()
        this.clearNodes()
        this.activeTheme = theme

        if (!this.ctx || theme === 'Silence') {
            this.isRunning = false
            return
        }

        this.isRunning = true

        if (theme === 'Forest Rain') {
            this.playForestRain()
        } else if (theme === 'Cosmic Zen') {
            this.playCosmicZen()
        }
    }

    private playForestRain() {
        if (!this.ctx) return

        const ctx = this.ctx
        // 1. Create a Pink/Brown Noise source for background rustling/rain hum
        const bufferSize = 2 * ctx.sampleRate
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = noiseBuffer.getChannelData(0)

        // Generate Pink/Brownish noise approximation
        let lastOut = 0.0
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1
            // Simple lowpass filter to make it brown/pink noise
            output[i] = (lastOut + (0.02 * white)) / 1.02
            lastOut = output[i]
            output[i] *= 3.5 // Volume boost
        }

        const noiseNode = ctx.createBufferSource()
        noiseNode.buffer = noiseBuffer
        noiseNode.loop = true

        // Lowpass filter for the noise
        const lowpass = ctx.createBiquadFilter()
        lowpass.type = 'lowpass'
        lowpass.frequency.setValueAtTime(800, ctx.currentTime)

        // Noise volume control
        const noiseGain = ctx.createGain()
        noiseGain.gain.setValueAtTime(0.08, ctx.currentTime)

        noiseNode.connect(lowpass)
        lowpass.connect(noiseGain)
        noiseGain.connect(ctx.destination)

        noiseNode.start(0)
        this.nodes.push(noiseNode, lowpass, noiseGain)

        // 2. Synthesize random raindrops (water droplets plinking)
        // We will schedule recurrent water plinks using an interval node or dynamic synthesis
        const triggerRaindrop = () => {
            if (!this.isRunning || this.activeTheme !== 'Forest Rain' || !this.ctx) return

            const osc = ctx.createOscillator()
            const gainNode = ctx.createGain()

            osc.type = 'sine'
            // High pitch drop frequency sweeping down
            const startFreq = 1200 + Math.random() * 800
            osc.frequency.setValueAtTime(startFreq, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.06)

            gainNode.gain.setValueAtTime(0.06 * Math.random(), ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)

            osc.connect(gainNode)
            gainNode.connect(ctx.destination)

            osc.start()
            osc.stop(ctx.currentTime + 0.08)

            // Schedule next drop
            const nextDelay = 100 + Math.random() * 300
            setTimeout(triggerRaindrop, nextDelay)
        }

        triggerRaindrop()
    }

    private playCosmicZen() {
        if (!this.ctx) return

        const ctx = this.ctx
        // Synthesize 3 deep oscillators forming a minor chord or steady fifths
        const baseFreqs = [110, 165, 220] // A2, E3, A3
        
        baseFreqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gainNode = ctx.createGain()
            const lfo = ctx.createOscillator()
            const lfoGain = ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, ctx.currentTime)

            // LFO to modulate volume (slow swelling/breathing)
            lfo.type = 'sine'
            lfo.frequency.setValueAtTime(0.1 + (idx * 0.05), ctx.currentTime) // Very slow cycles
            
            lfoGain.gain.setValueAtTime(0.05, ctx.currentTime) // Amplitude variation

            // Connect LFO modulation
            lfo.connect(lfoGain)
            lfoGain.connect(gainNode.gain)

            // Set main volume gain base
            gainNode.gain.setValueAtTime(0.04, ctx.currentTime)

            // Connect oscillator
            osc.connect(gainNode)
            
            // Put it through a lowpass filter to make it warmer
            const filter = ctx.createBiquadFilter()
            filter.type = 'lowpass'
            filter.frequency.setValueAtTime(300, ctx.currentTime)

            gainNode.connect(filter)
            filter.connect(ctx.destination)

            osc.start(0)
            lfo.start(0)

            this.nodes.push(osc, gainNode, lfo, lfoGain, filter)
        })
    }

    public stop() {
        this.isRunning = false
        this.clearNodes()
        if (this.ctx && this.ctx.state !== 'closed') {
            this.ctx.suspend()
        }
    }
}

export const ambientSynth = typeof window !== 'undefined' ? new AmbientSynthesizer() : null
