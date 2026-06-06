"""
Simplification Agent: Use Ollama to run Qwen2.5-7B-Instruct locally.

Ollama is a simple, reliable local LLM server that runs on localhost:11434.

Primary strategy: Call Ollama API to simplify paragraphs using qwen2.5:7b.
Fallback strategy: Call Gemini API (gemini-2.0-flash) if Ollama is unavailable or fails.
Final fallback: Pass paragraphs through unchanged if both are unavailable/fail.

No inter-agent imports. All exceptions caught and logged locally.
"""

import logging
import os
import requests
from typing import Optional, Dict, Any
from models import PipelineState

logger = logging.getLogger(__name__)

# Ollama API settings
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'qwen2.5:7b')  # Upgraded to 7b as requested

# Gemini API settings
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

SYSTEM_PROMPT = """You are a reading assistant for dyslexic school students in India.
Rewrite the given text following ALL these rules:
1. Use only short sentences. Maximum 12 words per sentence.
2. Use simple, common English words. Replace technical jargon with plain equivalents but KEEP subject-specific terms (e.g. photosynthesis, mitosis) — just define them.
3. Use active voice. Never passive voice.
4. One idea per sentence.
5. Do NOT add new information. Do NOT remove key facts.
6. Do NOT use bullet points or lists. Write in plain sentences only.
7. Output ONLY the rewritten text. No preamble, no explanation."""


def _check_ollama_available() -> bool:
    """
    Check if Ollama server is running.
    """
    try:
        response = requests.get(
            f"{OLLAMA_BASE_URL}/api/tags",
            timeout=2
        )
        return response.status_code == 200
    except Exception as e:
        logger.warning(f"[AGENT:simplify] Ollama not available: {str(e)}")
        return False


def _get_tailored_system_prompt(wpm: Optional[int] = None, profile: Optional[str] = None) -> str:
    """
    Generate the system prompt customized for the student's metrics.
    """
    system_prompt = SYSTEM_PROMPT
    custom_rules = []
    
    if profile:
        profile_lower = profile.lower()
        if "adhd" in profile_lower:
            custom_rules.append("Break content into very small, action-oriented segments with vivid, engaging examples.")
        elif "dyslexia" in profile_lower or "dyslexic" in profile_lower:
            custom_rules.append("Use direct, clear sentence structures, avoiding passive voice and complex clauses.")
        elif "autism" in profile_lower or "autistic" in profile_lower:
            custom_rules.append("Use logical progressions, highly literal explanations, and avoid idioms, metaphors, or ambiguous language.")
            
    if wpm is not None and wpm > 0:
        if wpm < 120:
            system_prompt = system_prompt.replace("Maximum 12 words per sentence.", "Maximum 8 words per sentence. Use extremely basic, simplified vocabulary.")
        elif wpm < 180:
            system_prompt = system_prompt.replace("Maximum 12 words per sentence.", "Maximum 10 words per sentence.")
            
    if custom_rules:
        system_prompt += "\n" + "\n".join(f"{i+8}. {rule}" for i, rule in enumerate(custom_rules))
        
    return system_prompt


def _simplify_with_ollama(paragraph: str, wpm: Optional[int] = None, profile: Optional[str] = None, temperature: float = 0.5) -> Optional[str]:
    """
    Simplify a single paragraph using Ollama API.
    Returns the simplified text, or None if it fails.
    """
    system_prompt = _get_tailored_system_prompt(wpm, profile)
    print(f"\n[OLLAMA-PROCESS] Attempting call to Ollama ({OLLAMA_MODEL}) at {OLLAMA_BASE_URL}/api/generate...")
    
    try:
        prompt = f"{system_prompt}\n\nText to rewrite:\n{paragraph}\n\nRewritten text:"
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": temperature,
                "top_p": 0.95,
                "top_k": 40,
            },
            timeout=60
        )
        
        print(f"[OLLAMA-PROCESS] Ollama response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"[OLLAMA-PROCESS] ERROR: Ollama returned status {response.status_code} - {response.text}")
            logger.warning(f"[AGENT:simplify] Ollama error: {response.status_code}")
            return None
        
        output_text = response.json().get('response', '').strip()
        print(f"[OLLAMA-PROCESS] Ollama returned output length: {len(output_text)} characters.")
        
        # Validate: non-empty and not too long (< 3x input)
        if output_text and len(output_text) < len(paragraph) * 3:
            return output_text
        
        print(f"[OLLAMA-PROCESS] WARNING: Validation failed for output. Output length = {len(output_text)}, Input length = {len(paragraph)}")
        logger.warning(
            f"[AGENT:simplify] Ollama output validation failed, retrying with lower temp"
        )
        
        # Retry with lower temperature
        if temperature > 0.2:
            return _simplify_with_ollama(paragraph, wpm=wpm, profile=profile, temperature=temperature - 0.1)
        
        return None
    except Exception as e:
        print(f"[OLLAMA-PROCESS] EXCEPTION: Failed to call Ollama. Error details: {str(e)}")
        logger.error(f"[AGENT:simplify] Ollama simplification failed: {str(e)}")
        return None


def _simplify_with_gemini(paragraph: str, wpm: Optional[int] = None, profile: Optional[str] = None) -> Optional[str]:
    """
    Simplify a single paragraph using Gemini API fallback.
    Returns the simplified text, or None if it fails.
    """
    gemini_key = os.getenv('GEMINI_API_KEY', GEMINI_API_KEY)
    if not gemini_key:
        print("[GEMINI-FALLBACK] Skipping fallback: GEMINI_API_KEY is not set.")
        logger.warning("[AGENT:simplify] GEMINI_API_KEY not set - skipping Gemini fallback")
        return None
        
    system_prompt = _get_tailored_system_prompt(wpm, profile)
    print(f"\n[GEMINI-FALLBACK] Attempting call to Gemini (gemini-2.0-flash)...")
    
    try:
        url = f"{GEMINI_URL}?key={gemini_key}"
        prompt = f"{system_prompt}\n\nText to rewrite:\n{paragraph}\n\nRewritten text:"
        
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}]
            },
            timeout=30
        )
        print(f"[GEMINI-FALLBACK] Gemini response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"[GEMINI-FALLBACK] ERROR: Gemini returned status {response.status_code} - {response.text}")
            logger.warning(f"[AGENT:simplify] Gemini fallback API error: {response.status_code}")
            return None
            
        data = response.json()
        output_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
        print(f"[GEMINI-FALLBACK] Gemini returned output length: {len(output_text)} characters.")
        
        if output_text and len(output_text) < len(paragraph) * 3:
            logger.info("[AGENT:simplify] Gemini fallback successful")
            return output_text
            
        print(f"[GEMINI-FALLBACK] WARNING: Validation failed for output. Output length = {len(output_text)}, Input length = {len(paragraph)}")
        logger.warning("[AGENT:simplify] Gemini fallback output validation failed")
        return None
    except Exception as e:
        print(f"[GEMINI-FALLBACK] EXCEPTION: Failed to call Gemini fallback. Error details: {str(e)}")
        logger.error(f"[AGENT:simplify] Gemini fallback call failed: {str(e)}")
        return None


def _simplify_paragraph(paragraph: str, wpm: Optional[int] = None, profile: Optional[str] = None, ollama_active: bool = True) -> tuple[str, str]:
    """
    Simplify a paragraph using Ollama, falling back to Gemini.
    
    Returns:
        tuple (simplified_text, method_used)
    """
    if not paragraph.strip():
        return paragraph, "none"
        
    print(f"\n[SIMPLIFY-FLOW] Processing paragraph slice: '{paragraph[:60]}...'")
    
    # 1. Try Ollama if active
    if ollama_active:
        print("[SIMPLIFY-FLOW] Ollama is active. Dispatching to Ollama...")
        result = _simplify_with_ollama(paragraph, wpm, profile)
        if result:
            print("[SIMPLIFY-FLOW] Successfully simplified using Ollama.")
            return result, "ollama"
        print("[SIMPLIFY-FLOW] Ollama simplification failed. Proceeding to Gemini fallback...")
    else:
        print("[SIMPLIFY-FLOW] Ollama is inactive. Skipping directly to Gemini...")
            
    # 2. Try Gemini fallback
    print("[SIMPLIFY-FLOW] Dispatching to Gemini fallback...")
    result = _simplify_with_gemini(paragraph, wpm, profile)
    if result:
        print("[SIMPLIFY-FLOW] Successfully simplified using Gemini.")
        return result, "gemini"
        
    # 3. Fall back to original text
    print("[SIMPLIFY-FLOW] Both processors failed. Returning original paragraph text.")
    return paragraph, "fail"


def _chunk_text(text: str, max_chars: int = 1000) -> list[str]:
    """
    Split text into chunks on sentence boundaries to avoid context limits.
    """
    if not text or len(text) <= max_chars:
        return [text]
    
    sentences = text.split('. ')
    chunks = []
    current_chunk = []
    current_len = 0
    
    for sentence in sentences:
        sentence_len = len(sentence)
        
        if current_len + sentence_len > max_chars and current_chunk:
            # Start new chunk
            chunks.append('. '.join(current_chunk) + '.')
            current_chunk = [sentence]
            current_len = sentence_len
        else:
            current_chunk.append(sentence)
            current_len += sentence_len + 2  # +2 for '. '
    
    if current_chunk:
        chunks.append('. '.join(current_chunk))
    
    return chunks


QUIZ_SYSTEM_PROMPT = """You are an educational AI creating multiple-choice quizzes for school students in India.
Generate exactly 3 multiple-choice questions based on the textbook content provided.
Each question must be directly related to the text and have:
1. "question": A clear, simple question string.
2. "options": Exactly 4 distinct answer choices as a list of strings.
3. "correctIndex": An integer (0 to 3) representing the index of the correct answer in the options list.
4. "explanation": A simple, helpful 1-sentence explanation of why the correct option is right.

You MUST return ONLY a valid JSON array of objects representing the quiz questions, matching the JSON schema below. Do not wrap the JSON in Markdown code blocks, do not include any conversational text or explanation.

JSON Schema:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctIndex": 0,
    "explanation": "string"
  }
]
"""


def _parse_json_quiz(text: str) -> Optional[list]:
    """Clean and parse JSON from LLM response."""
    import json
    if not text:
        return None
    cleaned = text.strip()
    # Strip markdown block if present
    if cleaned.startswith("```"):
        first_bracket = cleaned.find("[")
        last_bracket = cleaned.rfind("]")
        if first_bracket != -1 and last_bracket != -1:
            cleaned = cleaned[first_bracket:last_bracket+1]
    
    try:
        data = json.loads(cleaned)
        if isinstance(data, list) and len(data) > 0:
            validated = []
            for item in data:
                if (
                    isinstance(item, dict)
                    and "question" in item
                    and "options" in item
                    and isinstance(item["options"], list)
                    and len(item["options"]) == 4
                    and "correctIndex" in item
                    and isinstance(item["correctIndex"], int)
                    and 0 <= item["correctIndex"] <= 3
                ):
                    explanation = item.get("explanation") or f"Correct! The answer is {item['options'][item['correctIndex']]}."
                    validated.append({
                        "question": item["question"],
                        "options": item["options"],
                        "correctIndex": item["correctIndex"],
                        "explanation": explanation
                    })
            if len(validated) >= 3:
                return validated[:3]
            elif len(validated) > 0:
                return validated
        return None
    except Exception as e:
        logger.warning(f"[AGENT:simplify] Failed to parse quiz JSON: {str(e)}")
        return None


def _generate_quiz_with_ollama(text: str, temperature: float = 0.3) -> Optional[list]:
    """Generate quiz using local Qwen model in Ollama."""
    print(f"\n[OLLAMA-QUIZ] Attempting call to Ollama ({OLLAMA_MODEL}) at {OLLAMA_BASE_URL}/api/generate...")
    try:
        prompt = f"{QUIZ_SYSTEM_PROMPT}\n\nTextbook Content:\n{text}\n\nQuiz Questions JSON:"
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": temperature,
                "top_p": 0.95,
            },
            timeout=90
        )
        if response.status_code != 200:
            logger.warning(f"[AGENT:simplify] Ollama quiz generation error: {response.status_code}")
            return None
        
        output_text = response.json().get('response', '').strip()
        return _parse_json_quiz(output_text)
    except Exception as e:
        logger.error(f"[AGENT:simplify] Ollama quiz generation exception: {str(e)}")
        return None


def _generate_quiz_with_gemini(text: str) -> Optional[list]:
    """Generate quiz using Gemini API fallback."""
    gemini_key = os.getenv('GEMINI_API_KEY', GEMINI_API_KEY)
    if not gemini_key:
        logger.warning("[AGENT:simplify] GEMINI_API_KEY not set - skipping Gemini quiz fallback")
        return None
        
    print(f"\n[GEMINI-QUIZ] Attempting call to Gemini (gemini-2.0-flash)...")
    try:
        url = f"{GEMINI_URL}?key={gemini_key}"
        prompt = f"{QUIZ_SYSTEM_PROMPT}\n\nTextbook Content:\n{text}\n\nQuiz Questions JSON:"
        
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            },
            timeout=30
        )
        if response.status_code != 200:
            logger.warning(f"[AGENT:simplify] Gemini quiz fallback API error: {response.status_code}")
            return None
            
        data = response.json()
        output_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
        return _parse_json_quiz(output_text)
    except Exception as e:
        logger.error(f"[AGENT:simplify] Gemini quiz fallback exception: {str(e)}")
        return None


def _generate_local_fallback_quiz(state: PipelineState) -> list:
    """Generate simple fallback questions from glossary terms and core facts without any LLM call."""
    import random
    questions = []
    glossary_terms = []
    facts = []
    
    for block in state.transformed_chunks:
        glossary = block.get('glossary', {})
        if glossary:
            for term, definition in glossary.items():
                glossary_terms.append((term, definition))
        simplified_text = block.get('simplified', '')
        if simplified_text:
            sentences = [s.strip() for s in simplified_text.split('.') if s.strip()]
            facts.extend(sentences)
            
    # 1. Term question
    if glossary_terms:
        term, definition = glossary_terms[0]
        distractors = [
            "An essential term representing physical elements in class standard curriculum.",
            "The specific process rate used to identify structural chapter items.",
            "A core properties measurement mapped to adaptive class lessons."
        ]
        options = [definition] + distractors
        random.shuffle(options)
        correct_index = options.index(definition)
        questions.append({
            "question": f"What does the term \"{term}\" mean in this chapter?",
            "options": options,
            "correctIndex": correct_index,
            "explanation": f"Correct! \"{term}\" is defined as: {definition}"
        })
        
    # 2. Fact question
    if len(facts) > 0:
        correct_fact = facts[0]
        distractors = [
            "It is a chemical sequence that only triggers inside vacuum space chambers.",
            "It has no dynamic interaction with ecosystem structures or living things.",
            "It was completely disproven by modern scientific textbook research."
        ]
        options = [correct_fact] + distractors
        random.shuffle(options)
        correct_index = options.index(correct_fact)
        questions.append({
            "question": f"Which of the following is a true statement from this chapter?",
            "options": options,
            "correctIndex": correct_index,
            "explanation": f"Correct! The textbook teaches: {correct_fact}"
        })
        
    # 3. Default fallback
    while len(questions) < 3:
        idx = len(questions) + 1
        general_questions = [
            {
                "question": "What is the primary benefit of the line focus ruler in Dyslexia Mode?",
                "options": [
                    "It masks out surrounding sentences to prevent letter-crowding eye strain.",
                    "It reads the entire paragraph in high-speed text narration.",
                    "It automatically rewrites the chapter in simple phrases.",
                    "It adds unlockable achievements to your study profile stats."
                ],
                "correctIndex": 0,
                "explanation": "Correct! The line focus ruler helps narrow focus, preventing letters from crowding together while reading."
            },
            {
                "question": "Why does breaking lesson text into small chunks help retain facts?",
                "options": [
                    "It prevents cognitive overload and supports active study breaks.",
                    "It shortens textbook documents to save browser printing size.",
                    "It hides complex math equations from the dashboard grid.",
                    "It has no measurable influence on learning rates."
                ],
                "correctIndex": 0,
                "explanation": "Correct! Chunking text lets the brain review, process, and consolidate key details step-by-step."
            }
        ]
        questions.append(general_questions[idx % len(general_questions)])
        
    return questions[:3]


def run(state: PipelineState) -> PipelineState:
    """
    Main simplification agent entry point.
    
    Processes only paragraph blocks via Ollama API, falling back to Gemini.
    Passes headings/lists through unchanged.
    
    Returns:
        Updated PipelineState with simplified_text
    """
    logger.info("[AGENT:simplify] Starting")
    
    if not state.transformed_chunks:
        logger.warning("[AGENT:simplify] No blocks to simplify")
        state.simplified_text = state.cleaned_text
        state.agent_statuses["simplify"] = "degraded"
        return state
    
    # Check if Ollama is available
    ollama_available = _check_ollama_available()
    gemini_key = os.getenv('GEMINI_API_KEY', GEMINI_API_KEY)
    
    if not ollama_available:
        logger.warning(
            f"[AGENT:simplify] Ollama not available at {OLLAMA_BASE_URL}."
        )
        if not gemini_key:
            logger.error("[AGENT:simplify] Neither Ollama nor Gemini key is available. Passing text through.")
            state.simplified_text = state.cleaned_text
            state.agent_statuses["simplify"] = "failed"
            state.errors.append("Simplify agent failed: Ollama offline and Gemini API key not set.")
            state.degraded = True
            return state
        else:
            logger.info("[AGENT:simplify] Will use Gemini API directly as primary processor.")
            
    logger.info(f"[AGENT:simplify] Using Ollama model: {OLLAMA_MODEL} (if available)")
    
    wpm = getattr(state, 'wpm', None)
    profile = getattr(state, 'profile', None)
    
    simplified_blocks = []
    degraded = False
    methods_used = set()
    
    for block in state.transformed_chunks:
        if block.get('type') == 'paragraph':
            text = block.get('simplified') if 'simplified' in block else block.get('text', '')
            chunks = _chunk_text(text, max_chars=1000)
            simplified_chunks = []
            
            for chunk in chunks:
                simplified, method = _simplify_paragraph(chunk, wpm=wpm, profile=profile, ollama_active=ollama_available)
                simplified_chunks.append(simplified)
                methods_used.add(method)
                if method == "fail":
                    degraded = True
            
            simplified_text = ' '.join(simplified_chunks)
        else:
            # Pass headings and lists through unchanged
            simplified_text = block.get('text', '')
        
        simplified_blocks.append({
            **block,
            'simplified': simplified_text
        })
    
    # Reconstruct simplified text
    simplified_lines = [block['simplified'] for block in simplified_blocks]
    simplified_text = '\n\n'.join(simplified_lines)
    
    state.simplified_text = simplified_text
    state.transformed_chunks = simplified_blocks
    
    # Generate quiz questions if simplified_text exists
    quiz_questions = []
    if state.simplified_text.strip():
        # Limit text size to ~4000 characters to keep it fast
        sample_text = state.simplified_text[:4000]
        if ollama_available:
            quiz_questions = _generate_quiz_with_ollama(sample_text)
        
        if not quiz_questions:
            quiz_questions = _generate_quiz_with_gemini(sample_text)
            
        if not quiz_questions:
            logger.info("[AGENT:simplify] LLM quiz generation failed/offline. Generating local fallback quiz...")
            quiz_questions = _generate_local_fallback_quiz(state)
            
    state.quiz_questions = quiz_questions
    
    # Update agent status
    if "fail" in methods_used and len(methods_used) == 1:
        # All failed
        state.agent_statuses["simplify"] = "failed"
        state.degraded = True
    elif degraded or "gemini" in methods_used:
        # Some failed or we had to use fallback
        state.agent_statuses["simplify"] = "degraded"
        state.degraded = True
        if "gemini" in methods_used:
            logger.info("[AGENT:simplify] Complete with degraded status (used Gemini fallback)")
        else:
            logger.info("[AGENT:simplify] Complete with degraded status (some blocks failed to simplify)")
    else:
        state.agent_statuses["simplify"] = "ok"
        logger.info("[AGENT:simplify] Complete successfully using Ollama")
        
    logger.info(f"[AGENT:simplify] Complete: {len(simplified_blocks)} blocks processed")
    
    return state
