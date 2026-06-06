export class TTSManager {
    private synth: SpeechSynthesis
    private utterance: SpeechSynthesisUtterance | null = null
    private onWordChange: ((index: number) => void) | null = null


    constructor() {
        this.synth = window.speechSynthesis
    }

    getVoices(): SpeechSynthesisVoice[] {
        return this.synth.getVoices()
    }

    onVoicesChanged(callback: () => void): () => void {
        this.synth.onvoiceschanged = callback
        return () => {
            this.synth.onvoiceschanged = null
        }
    }

    speak(text: string, options: {
        voice?: SpeechSynthesisVoice
        rate?: number
        pitch?: number
        volume?: number
        onBoundary?: (index: number) => void
    } = {}): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.utterance) {
                this.synth.cancel()
            }

            this.utterance = new SpeechSynthesisUtterance(text)
            this.utterance.rate = options.rate ?? 1
            this.utterance.pitch = options.pitch ?? 1
            this.utterance.volume = options.volume ?? 1

            if (options.voice) {
                this.utterance.voice = options.voice
            }

            this.onWordChange = options.onBoundary ?? null

            this.utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    const wordStart = event.charIndex
                    if (this.onWordChange) {
                        const wordCount = text.substring(0, wordStart).split(/\s+/).filter(w => w.length > 0).length
                        this.onWordChange(wordCount)
                    }
                }
            }

            this.utterance.onend = () => {
                this.utterance = null
                resolve()
            }

            this.utterance.onerror = (event) => {
                this.utterance = null
                reject(new Error(`TTS error: ${event.error}`))
            }

            this.synth.speak(this.utterance)
        })
    }

    pause(): void {
        this.synth.pause()
    }

    resume(): void {
        this.synth.resume()
    }

    cancel(): void {
        this.synth.cancel()
        this.utterance = null
    }

    isPlaying(): boolean {
        return this.synth.speaking
    }

    isPaused(): boolean {
        return this.synth.paused
    }
}

export function createTTSManager(): TTSManager {
    return new TTSManager()
}

export const isTTSSupported = (): boolean => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
}
