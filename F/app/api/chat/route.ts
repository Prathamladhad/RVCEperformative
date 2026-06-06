import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { message, profileKey } = await request.json()
        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey) {
            return NextResponse.json(
                { error: 'AI API Key is not configured on the server.' },
                { status: 500 }
            )
        }

        // Define system instructions based on the learner's profile
        let systemPrompt = "You are Nova, a helpful AI study companion designed to assist students with learning materials."
        
        if (profileKey === 'adhd') {
            systemPrompt = `You are Nova, an AI study companion. The user has ADHD. 
            - Keep your explanations very short, engaging, and structured. 
            - Use bullet points, bold headers, and friendly emojis. 
            - Encourage them to try short 5-minute study sprints. 
            - Focus on clear, high-impact concepts, and don't write long walls of text.`
        } else if (profileKey === 'dyslexia') {
            systemPrompt = `You are Nova, an AI study companion. The user has Dyslexia. 
            - Keep your sentences short and grammatically simple. 
            - Avoid visually crowded or complex paragraphs. 
            - Spell out difficult vocabulary phonetically (e.g. pho·to·syn·the·sis) if helpful.
            - Write in a highly readable, direct manner. Never use justified layouts.`
        } else if (profileKey === 'autism') {
            systemPrompt = `You are Nova, an AI study companion. The user has Autism. 
            - Be very structured, direct, predictable, and clear in your instructions. 
            - Avoid sarcasm, complex metaphors, or ambiguous language. 
            - Present ideas step-by-step and chunk them logically.`
        } else if (profileKey === 'anxiety') {
            systemPrompt = `You are Nova, an AI study companion. The user experiences high anxiety. 
            - Be extremely gentle, warm, encouraging, and stress-free in your tone. 
            - Emphasize that there are no timers, that mistakes are fine, and that they are doing a wonderful job. 
            - Use soothing, reassuring phrases.`
        } else if (profileKey === 'slow') {
            systemPrompt = `You are Nova, an AI study companion. The user is a slow learner. 
            - Break concepts down into simple, basic terms. 
            - Be patient, repeat core points with slightly different words, and provide concrete examples.`
        } else if (profileKey === 'sensory') {
            systemPrompt = `You are Nova, an AI study companion. The user is sensory sensitive. 
            - Use plain, calm, and distraction-free language. 
            - Avoid uppercase shouting, exclamation marks, or excessive emotional cues.`
        }

        // Call the official Gemini REST API
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `${systemPrompt}\n\nUser request: ${message}\n\nAssistant reply:`
                            }
                        ]
                    }
                ]
            })
        })

        if (!response.ok) {
            const errData = await response.json()
            console.error('Gemini API call failed:', errData)
            return NextResponse.json(
                { error: 'Failed to generate response from AI Service.' },
                { status: response.status }
            )
        }

        const data = await response.json()
        const textReply = data.contents?.[0]?.parts?.[0]?.text || "I'm here to support you. Let's study!"

        return NextResponse.json({ reply: textReply })
    } catch (error) {
        console.error('API Chat route error:', error)
        return NextResponse.json(
            { error: 'An internal server error occurred.' },
            { status: 500 }
        )
    }
}
