export type ProfileKey =
    | 'dyslexia'
    | 'autism'
    | 'adhd'
    | 'visual'
    | 'anxiety'
    | 'slow'
    | 'sensory'
    | 'custom'

export type BehaviorMetrics = {
    attentionSpanSec: number
    readingWpm: number
    focusDurationSec: number
    mistakesPerQuiz: number
    recentStress: number // 0..1
    completedLessons: number
    focusCoins: number
    xpPoints: number
}

export type LessonContent = {
    id: string
    title: string
    shortDescription: string
    fullText: string
    simplifiedText: string
    audioUrl?: string
    visualAids: string[]
    steps: string[]
    durationMin: number
}

export type QuizQuestion = {
    id: string
    question: string
    options: string[]
    correctIndex: number
    explanation: string
}

export type LessonRec = {
    title: string
    reason: string
    confidence: number
    format: 'Visual Map' | 'Audio Narrated' | 'Interactive Card' | 'Text Block'
}

export type RoadmapItem = {
    title: string
    duration: string
    icon: string
    description: string
    done?: boolean
}

export type DashboardData = {
    focusScore: number
    energyLevel: number
    comfortScore: number
    burnoutRisk: 'Low' | 'Moderate' | 'High'
    learningStyle: string
    weeklyImprovement: number[]
    recommendedLessons: LessonRec[]
    dailyRoadmap: RoadmapItem[]
    aiConfidence: number
    suggestedPlaylist: string[]
    copingTip: string
    activeQuiz: QuizQuestion[]
    sampleLesson: LessonContent
}

// Sample mock data for lessons
export const SAMPLE_LESSONS: Record<string, LessonContent> = {
    ecosystem: {
        id: 'ecosystem',
        title: 'Introduction to Ecosystems',
        shortDescription: 'How living things interact with their natural surroundings.',
        fullText: 'An ecosystem is a complex community of living organisms (plants, animals, and microbes) interacting as a system with the non-living components of their environment (things like air, water, mineral soil, and sunlight). These biotic and abiotic components are linked together through nutrient cycles and energy flows. Energy enters the system through photosynthesis where plants convert solar radiation into chemical energy.',
        simplifiedText: 'An ecosystem is a community where living things (plants and animals) and non-living things (air, water, soil) live together. They help each other survive. For example, plants use sunlight to make food. Animals eat the plants. Water and air keep them all alive. Everything is connected like a large web.',
        visualAids: [
            '☀️ Sunlight feeds the plants',
            '🌱 Plants grow in the soil',
            '🐰 Rabbits eat the plants',
            '🦊 Foxes eat the rabbits',
            '🍂 Soil gets nutrients from decaying leaves'
        ],
        steps: [
            'Learn: What is an Ecosystem?',
            'Explore: Biotic vs Abiotic Factors',
            'Practice: Trace the Food Chain',
            'Check: 3-Question Concept Challenge'
        ],
        durationMin: 8
    },
    fractions: {
        id: 'fractions',
        title: 'Visualizing Fractions',
        shortDescription: 'Splitting parts from a whole in a simple visual way.',
        fullText: 'Fractions represent equal parts of a whole or a collection. When we divide a single object or group into equal sections, each section is a fraction of the entire quantity. A fraction consists of a numerator, representing the number of parts we have, and a denominator, representing the total number of equal parts the whole is divided into.',
        simplifiedText: 'A fraction represents parts of a whole. Imagine a pizza cut into 4 equal slices. If you eat 1 slice, you have eaten 1/4 (one-fourth) of the pizza. The bottom number (4) is the total slices. The top number (1) is the slice you ate.',
        visualAids: [
            '🍕 Whole Pizza = 1',
            '🍕 Cut in Half = 1/2 + 1/2',
            '🍕 Cut in Quarters = 1/4 + 1/4 + 1/4 + 1/4'
        ],
        steps: [
            'See: Pizza Slice Concept',
            'Play: Match the Fraction Blocks',
            'Quiz: Spot the Numerator'
        ],
        durationMin: 5
    }
}

// Custom mock quizzes
export const SAMPLE_QUIZZES: Record<string, QuizQuestion[]> = {
    ecosystem: [
        {
            id: 'e1',
            question: 'Which of the following is a biotic (living) part of an ecosystem?',
            options: ['Golden Sunlight', 'Rich Mineral Soil', 'Green Leafy Plant', 'Cool Flowing Water'],
            correctIndex: 2,
            explanation: 'Biotic components are living. Plants, animals, and bacteria are living things, whereas sunlight, soil, and water are abiotic (non-living).'
        },
        {
            id: 'e2',
            question: 'Where does most energy in an ecosystem originally come from?',
            options: ['Deep Underground', 'The Sun', 'Ocean Currents', 'Strong Winds'],
            correctIndex: 1,
            explanation: 'The Sun is the primary source of energy. Plants capture sunlight through photosynthesis and convert it into food.'
        }
    ],
    fractions: [
        {
            id: 'f1',
            question: 'In the fraction 3/4, what does the number 4 represent?',
            options: ['The numerator', 'The number of pieces you have', 'The total number of equal parts', 'The size of the pizza'],
            correctIndex: 2,
            explanation: 'The bottom number is the denominator, which tells us how many equal parts the whole is divided into.'
        }
    ]
}

function clamp(n: number, min = 0, max = 100) {
    return Math.max(min, Math.min(max, n))
}

export function computeDashboard(profile: ProfileKey | null, metrics: BehaviorMetrics): DashboardData {
    // 1. Focus Score
    const baseFocus = (metrics.attentionSpanSec / 300) * 100
    const stressPenalty = metrics.recentStress * 40
    const focusScore = clamp(Math.round(baseFocus - stressPenalty), 10, 100)

    // 2. Energy Level
    const energy = clamp(Math.round((metrics.focusDurationSec / 600) * 100 - metrics.mistakesPerQuiz * 5), 15, 100)

    // 3. Comfort Score (high stress = low comfort, low contrast/dyslexia adjustments increase comfort)
    const comfortScore = clamp(Math.round(100 - metrics.recentStress * 50 - (metrics.mistakesPerQuiz > 3 ? 15 : 0)), 20, 100)

    // 4. Burnout Risk
    let burnoutRisk: 'Low' | 'Moderate' | 'High' = 'Low'
    if (metrics.recentStress > 0.7 || (metrics.focusDurationSec > 800 && focusScore < 40)) {
        burnoutRisk = 'High'
    } else if (metrics.recentStress > 0.4 || metrics.focusDurationSec > 500) {
        burnoutRisk = 'Moderate'
    }

    // 5. AI Confidence
    const aiConfidence = clamp(Math.round((0.75 + (metrics.completedLessons * 0.03) - (metrics.recentStress * 0.1)) * 100), 50, 99)

    // 6. Profile Customizations & Recommendations
    let learningStyle = 'Visual & Interactive'
    const recommendedLessons: LessonRec[] = []
    const dailyRoadmap: RoadmapItem[] = []
    let suggestedPlaylist: string[] = []
    let copingTip = 'Take deep breaths. You are in control.'
    let sampleLesson = SAMPLE_LESSONS.ecosystem
    let activeQuiz = SAMPLE_QUIZZES.ecosystem

    if (profile === 'dyslexia') {
        learningStyle = 'Audio-Assisted & Simplified'
        copingTip = 'Use the reading ruler or text-to-speech to ease eye strain. No pressure!'
        suggestedPlaylist = ['Soft Brown Noise (Focus)', 'Forest Rain Sounds', 'Ambient Piano']
        recommendedLessons.push(
            { title: 'Ecosystems: Audio Exploration', reason: 'Matches your dyslexia-friendly audio preset', confidence: 95, format: 'Audio Narrated' },
            { title: 'Photosynthesis: Core Facts', reason: 'High contrast text summary with syllable breakdowns', confidence: 88, format: 'Interactive Card' }
        )
        dailyRoadmap.push(
            { title: 'Narrated Intro', duration: '5 min', icon: '🔊', description: 'Listen to the ecosystem overview' },
            { title: 'Interactive Reading', duration: '8 min', icon: '📖', description: 'Use reading ruler to review chunks', done: true },
            { title: 'Quick Audio Quiz', duration: '3 min', icon: '📝', description: 'Check understanding with read-aloud options' },
            { title: 'Calm Garden Reflection', duration: '2 min', icon: '🌸', description: 'Rest your eyes & grow your plant' }
        )
    } else if (profile === 'adhd') {
        learningStyle = 'Gamified / Short-Bursts'
        copingTip = 'Attention drift is natural. Enjoy a 3-minute mini-game or step away for water.'
        suggestedPlaylist = ['Upbeat Synthwave (ADHD Focus)', 'Lofi Beats for Work', 'Binaural Focus Waves']
        sampleLesson = SAMPLE_LESSONS.fractions
        activeQuiz = SAMPLE_QUIZZES.fractions
        recommendedLessons.push(
            { title: 'Fractions: Interactive Blocks', reason: 'Highly gamified, short 5-minute task', confidence: 94, format: 'Interactive Card' },
            { title: 'Rapid Math Challenge', reason: 'Fast feedback loop & double XP points', confidence: 89, format: 'Visual Map' }
        )
        dailyRoadmap.push(
            { title: 'Dopamine Warm-up', duration: '3 min', icon: '⚡', description: 'Quick fraction matching game', done: true },
            { title: '5-Min Micro Lesson', duration: '5 min', icon: '🎯', description: 'Visual Pizza fraction blocks' },
            { title: 'Rapid Quiz (Double Coins)', duration: '2 min', icon: '🪙', description: 'Earn focus coins on correct answers' },
            { title: 'Active Break', duration: '3 min', icon: '🚶', description: 'Quick stretch reminder' }
        )
    } else if (profile === 'autism') {
        learningStyle = 'Structured & Visual Maps'
        copingTip = 'Everything is structured and predictable here. No sudden changes.'
        suggestedPlaylist = ['Steady Ambient Hum', 'Soft Binaural Tones', 'Minimalist Keyboard Taps']
        recommendedLessons.push(
            { title: 'Ecosystems: Step-by-Step', reason: 'Strict, predictable lesson layout', confidence: 91, format: 'Visual Map' },
            { title: 'Abiotic Factors: Sorting', reason: 'Clear rules-based interaction', confidence: 85, format: 'Interactive Card' }
        )
        dailyRoadmap.push(
            { title: 'Step 1: Check Schedule', duration: '2 min', icon: '📅', description: 'Review your visual study structure', done: true },
            { title: 'Step 2: Read Concept', duration: '8 min', icon: '🧩', description: 'Follow the 5 structured visual aids' },
            { title: 'Step 3: Matching Exercise', duration: '4 min', icon: '✔️', description: 'Sort elements into categories' },
            { title: 'Step 4: Routine Review', duration: '3 min', icon: '🔄', description: 'Consistency log check' }
        )
    } else if (profile === 'visual') {
        learningStyle = 'High-Contrast Large Text'
        copingTip = 'Increase magnification anytime. Use keyboard keys [1, 2, 3] to navigate.'
        suggestedPlaylist = ['Descriptive Audio Guide', 'Soft Instrumental', 'Classic Lofi']
        recommendedLessons.push(
            { title: 'Ecosystems (High Contrast)', reason: 'Optimized for high visibility and black/white colors', confidence: 93, format: 'Text Block' },
            { title: 'TTS Guided Review', reason: 'Full text-to-speech coverage with screen reading', confidence: 87, format: 'Audio Narrated' }
        )
        dailyRoadmap.push(
            { title: 'Large UI Reading', duration: '10 min', icon: '🔍', description: 'Read with 24px and high contrast text' },
            { title: 'Voice-First Practice', duration: '5 min', icon: '🎙️', description: 'Navigate quiz using speech options' },
            { title: 'Sound Rest Interval', duration: '3 min', icon: '🔔', description: 'Listen to ambient forest guide' }
        )
    } else if (profile === 'anxiety') {
        learningStyle = 'Priceless Calming & Gentle'
        copingTip = 'There are no timers here. Take all the time you need. Mistakes are fine!'
        suggestedPlaylist = ['Calming Ocean Waves', 'Deep Zen Breathing Track', 'Celestial Ambient Space']
        recommendedLessons.push(
            { title: 'Eco-Balance: Gentle Walk', reason: 'Calming colors, no pressure or point drops', confidence: 96, format: 'Interactive Card' },
            { title: 'Safe-Space Breathing Lesson', reason: 'Focus on breathing techniques + light reading', confidence: 90, format: 'Audio Narrated' }
        )
        dailyRoadmap.push(
            { title: 'Mood Check-in', duration: '1 min', icon: '💖', description: 'Tell us how you feel today', done: true },
            { title: 'Gentle Reading Card', duration: '8 min', icon: '🕊️', description: 'No-pressure reading on ecosystem webs' },
            { title: 'Stress-Free Check', duration: '4 min', icon: '🌱', description: 'Simple questions, infinite retries' },
            { title: 'Breathe Overlay', duration: '2 min', icon: '🫧', description: 'Guided breathing session' }
        )
    } else if (profile === 'sensory') {
        learningStyle = 'Ultra Minimal / Silent'
        copingTip = 'Sound is muted. Background is simplified to dark gray. Animations are disabled.'
        suggestedPlaylist = ['Muted Silence', 'Low-frequency Sine Wave', 'Soft Rainfall']
        recommendedLessons.push(
            { title: 'Ecosystem: Plain Text', reason: 'Zero animations, flat icons, minimal distraction', confidence: 90, format: 'Text Block' },
            { title: 'Core Facts Only', reason: 'No side widgets or floating items', confidence: 84, format: 'Text Block' }
        )
        dailyRoadmap.push(
            { title: 'Minimalist Chapter', duration: '6 min', icon: '⬜', description: 'Plain text with no floating widgets' },
            { title: 'Concept Quiz', duration: '3 min', icon: '✏️', description: 'Two questions in plain layout' },
            { title: 'Silent Break', duration: '2 min', icon: '💤', description: 'Screen off or look away guide' }
        )
    } else if (profile === 'slow') {
        learningStyle = 'Spaced & Repetitive Reading'
        copingTip = 'Repetition helps build permanent memory. We will review this topic 3 times.'
        suggestedPlaylist = ['Beta Waves for Learning', 'Warm Instrumental Guitar', 'Study Smart Jazz']
        recommendedLessons.push(
            { title: 'Ecosystems: Concept Repetition', reason: 'Repeats major points with varied words', confidence: 92, format: 'Interactive Card' },
            { title: 'Vocabulary Matching', reason: 'Reinforces key terms slowly with visuals', confidence: 86, format: 'Visual Map' }
        )
        dailyRoadmap.push(
            { title: 'Concept Repetition', duration: '8 min', icon: '🔁', description: 'Review the definition twice with different cards' },
            { title: 'Slow Concept Review', duration: '6 min', icon: '💡', description: 'Step-by-step flashcards' },
            { title: 'Vocabulary Quiz', duration: '4 min', icon: '🍎', description: 'Simple multiple-choice review' }
        )
    } else {
        // Custom or Mixed
        learningStyle = 'Mixed Adaptive Mode'
        copingTip = 'Customize your layout in the Accessibility Toolbar to build your optimal setup.'
        suggestedPlaylist = ['Lofi Beats for Focus', 'Nature Ambient Sounds', 'Binaural Wave Pack']
        recommendedLessons.push(
            { title: 'Ecosystem: Adaptive Path', reason: 'Custom components enabled', confidence: 80, format: 'Interactive Card' },
            { title: 'Adaptive Concept Review', reason: 'Tailored using your accessibility preferences', confidence: 75, format: 'Interactive Card' }
        )
        dailyRoadmap.push(
            { title: 'Adaptive Warm-up', duration: '5 min', icon: '⚙️', description: 'Standard starter lesson' },
            { title: 'Custom Quiz', duration: '4 min', icon: '🧩', description: 'Adaptive question review' }
        )
    }

    return {
        focusScore,
        energyLevel: energy,
        comfortScore,
        burnoutRisk,
        learningStyle,
        weeklyImprovement: [45, 50, 58, 62, 70, 75, focusScore],
        recommendedLessons,
        dailyRoadmap,
        aiConfidence,
        suggestedPlaylist,
        copingTip,
        activeQuiz,
        sampleLesson
    }
}
