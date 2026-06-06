"use client"

import { useState } from 'react'

type AICompanionProps = {
    profileKey: string | null
    onAskQuiz?: () => void
}

export default function AICompanion({ profileKey, onAskQuiz }: AICompanionProps) {
    const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; actionData?: any }>>([
        {
            sender: 'assistant',
            text: `Hi there! I am Nova, your learning companion. Let's make studying feel simple and comfortable today.`
        }
    ])
    const [inputText, setInputText] = useState('')
    const [activeTab, setActiveTab] = useState<'chat' | 'tools'>('chat')
    const [isVoiceActive, setIsVoiceActive] = useState(false)
    const [activeFlashcards, setActiveFlashcards] = useState<Array<{ q: string; a: string; flipped?: boolean }>>([])

    // Simulated responses based on the student's cognitive profile
    const getAIResponse = (userText: string): string => {
        const text = userText.toLowerCase()
        if (text.includes('hello') || text.includes('hi')) {
            return `Hello! How can I help you study? We can simplify concepts, review lessons, or build some study guides.`
        }

        if (profileKey === 'adhd') {
            if (text.includes('distract') || text.includes('focus')) {
                return `ADHD Hack: Let's do a 5-minute study sprint. Put your phone in another room, press play on the synthwave track, and see if you can complete 1 card. Ready?`
            }
            if (text.includes('simplify') || text.includes('easy')) {
                return `Here is the core idea: Ecosystems are just living things (plants/animals) sharing resources with non-living things (sunlight/water). Think of it like a team working together!`
            }
            return `Awesome! Keep up the momentum. Remember, you earn double Focus Coins if you take a quick quiz now!`
        }

        if (profileKey === 'dyslexia') {
            if (text.includes('simplify') || text.includes('read')) {
                return `Here is a simplified summary: Plants need sunlight. Animals eat plants. Water helps everything grow. Use the Reading Ruler to focus on this chunk.`
            }
            return `Got it. I can read these notes out loud for you anytime! Just tap the Narrate buttons.`
        }

        if (profileKey === 'autism') {
            return `Let's follow our structured guide step-by-step. Let me know when you are done with the first step so we can check it off.`
        }

        if (profileKey === 'anxiety') {
            return `Take your time. There are no timers here and mistakes are completely fine. We can re-try as many times as you like. You are doing great!`
        }

        return `I can help you review this lesson step-by-step. Feel free to use the tools panel to make quick flashcards or simplify text!`
    }

    const handleSendMessage = async () => {
        if (!inputText.trim()) return
        const userMsg = inputText
        setMessages((m) => [...m, { sender: 'user', text: userMsg }])
        setInputText('')

        // Push temporary loading indicator
        setMessages((m) => [...m, { sender: 'assistant', text: 'Nova is writing...' }])

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, profileKey })
            })

            if (!response.ok) throw new Error('API failed')
            const data = await response.json()
            
            setMessages((m) => {
                const list = m.filter(msg => msg.text !== 'Nova is writing...')
                return [...list, { sender: 'assistant', text: data.reply }]
            })
        } catch (e) {
            // Safe fallback if API is rate-limited or offline
            const reply = getAIResponse(userMsg)
            setMessages((m) => {
                const list = m.filter(msg => msg.text !== 'Nova is writing...')
                return [...list, { sender: 'assistant', text: reply }]
            })
        }
    }

    // AI Tools actions
    const triggerSimplify = () => {
        setMessages((m) => [
            ...m,
            { sender: 'user', text: 'Simplify the ecosystem concept' },
            {
                sender: 'assistant',
                text: 'Concept Simplified: Plants make food from the sun. Animals eat plants. Soil collects nutrients when they decay. It is a loop of energy.'
            }
        ])
    }

    const triggerFlashcards = () => {
        setActiveFlashcards([
            { q: 'What is a Biotic Factor?', a: 'Any living thing in an ecosystem (plants, animals, bugs, trees).' },
            { q: 'What is an Abiotic Factor?', a: 'Any non-living part of an ecosystem (sunlight, air, water, soil).' },
            { q: 'What is the primary energy source?', a: 'The Sun (supplies light for photosynthesis).' }
        ])
        setMessages((m) => [
            ...m,
            { sender: 'user', text: 'Create flashcards' },
            { sender: 'assistant', text: 'I have generated 3 revision flashcards below. Click each card to flip it and reveal the definition!' }
        ])
    }

    const triggerDistractions = () => {
        setMessages((m) => [
            ...m,
            { sender: 'user', text: 'Give me distraction blockers' },
            {
                sender: 'assistant',
                text: 'Focus suggestions: \n1. Enable Sensory-Safe Theme (reduces color contrast irritation).\n2. Play the "Steady Ambient Hum" audio loops.\n3. Turn on One-Task-At-A-Time mode to hide sidebars.'
            }
        ])
    }

    return (
        <div className="rounded-[32px] border border-white/80 bg-violet-50/60 p-5 shadow-lg shadow-violet-100/40 backdrop-blur-lg flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-violet-100 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Nova Companion</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {profileKey ? `${profileKey} mode assistant` : 'AI Study Guide'}
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-200/60 p-0.5 rounded-full text-[10px] font-bold">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`rounded-full px-2.5 py-1 ${activeTab === 'chat' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600'}`}
                    >
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('tools')}
                        className={`rounded-full px-2.5 py-1 ${activeTab === 'tools' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600'}`}
                    >
                        AI Tools
                    </button>
                </div>
            </div>

            {/* Tabs */}
            {activeTab === 'chat' ? (
                <div className="flex flex-col gap-3">
                    {/* Message Box */}
                    <div className="h-44 overflow-y-auto border border-slate-100 bg-white/70 rounded-2xl p-3 text-xs space-y-3">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-2xl p-2.5 whitespace-pre-line leading-relaxed ${
                                        m.sender === 'user'
                                            ? 'bg-violet-600 text-white rounded-br-none'
                                            : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                                    }`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Controls & Voice */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ask Nova anything..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl px-3 py-2 transition"
                        >
                            Send
                        </button>
                        <button
                            onClick={() => {
                                const active = !isVoiceActive
                                setIsVoiceActive(active)
                                if (active) {
                                    setMessages((m) => [...m, { sender: 'assistant', text: 'Listening to your voice...' }])
                                    setTimeout(() => {
                                        setMessages((m) => [
                                            ...m,
                                            { sender: 'user', text: '“Explain ecosystems please”' },
                                            { sender: 'assistant', text: 'An ecosystem is like a community. Imagine plants and rabbits sharing a lawn. Plants feed rabbits, water feeds both. It is a shared circle!' }
                                        ])
                                        setIsVoiceActive(false)
                                    }, 2200)
                                }
                            }}
                            className={`text-xs rounded-xl px-2.5 border transition-all ${
                                isVoiceActive
                                    ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                                    : 'bg-white text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            🎙️
                        </button>
                    </div>
                </div>
            ) : (
                /* AI Tools Tab */
                <div className="flex flex-col gap-2.5">
                    <button
                        onClick={triggerSimplify}
                        className="w-full text-left rounded-2xl border border-violet-100 bg-white p-3 hover:bg-violet-50/50 hover:border-violet-300 transition-all flex items-center justify-between"
                    >
                        <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-800">🪄 Text Simplification</div>
                            <div className="text-[10px] text-slate-500">Transform complex words into simple phrases</div>
                        </div>
                        <span className="text-lg">➔</span>
                    </button>

                    <button
                        onClick={triggerFlashcards}
                        className="w-full text-left rounded-2xl border border-violet-100 bg-white p-3 hover:bg-violet-50/50 hover:border-violet-300 transition-all flex items-center justify-between"
                    >
                        <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-800">🎴 Visual Flashcards</div>
                            <div className="text-[10px] text-slate-500">Generate 3 quick interactive review cards</div>
                        </div>
                        <span className="text-lg">➔</span>
                    </button>

                    <button
                        onClick={triggerDistractions}
                        className="w-full text-left rounded-2xl border border-violet-100 bg-white p-3 hover:bg-violet-50/50 hover:border-violet-300 transition-all flex items-center justify-between"
                    >
                        <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-800">🛡️ Distraction Blockers</div>
                            <div className="text-[10px] text-slate-500">AI-generated setups to avoid sensory fatigue</div>
                        </div>
                        <span className="text-lg">➔</span>
                    </button>

                    {onAskQuiz && (
                        <button
                            onClick={onAskQuiz}
                            className="w-full text-left rounded-2xl border border-violet-100 bg-white p-3 hover:bg-violet-50/50 hover:border-violet-300 transition-all flex items-center justify-between"
                        >
                            <div className="space-y-0.5">
                                <div className="text-xs font-bold text-slate-800">📝 Start Adaptive Quiz</div>
                                <div className="text-[10px] text-slate-500">Short concept checks based on current score</div>
                            </div>
                            <span className="text-lg">➔</span>
                        </button>
                    )}
                </div>
            )}

            {/* Render interactive flashcards if active */}
            {activeFlashcards.length > 0 && (
                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 bg-white/60 p-2.5 rounded-2xl shadow-inner">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Interactive Cards</span>
                        <button
                            onClick={() => setActiveFlashcards([])}
                            className="text-[10px] font-semibold text-rose-500"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {activeFlashcards.map((card, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    const next = [...activeFlashcards]
                                    next[idx].flipped = !next[idx].flipped
                                    setActiveFlashcards(next)
                                }}
                                className={`cursor-pointer rounded-xl border p-3 min-h-[60px] flex items-center justify-center text-center transition-all ${
                                    card.flipped
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                                        : 'bg-white border-slate-200 text-slate-800 hover:border-violet-300'
                                }`}
                            >
                                <p className="text-[11px] leading-relaxed">
                                    {card.flipped ? `💡 Answer: ${card.a}` : `❓ Question: ${card.q}`}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
