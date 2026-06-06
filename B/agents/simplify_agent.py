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
        
        if response.status_code != 200:
            logger.warning(f"[AGENT:simplify] Ollama error: {response.status_code}")
            return None
        
        output_text = response.json().get('response', '').strip()
        
        # Validate: non-empty and not too long (< 3x input)
        if output_text and len(output_text) < len(paragraph) * 3:
            return output_text
        
        logger.warning(
            f"[AGENT:simplify] Ollama output validation failed, retrying with lower temp"
        )
        
        # Retry with lower temperature
        if temperature > 0.2:
            return _simplify_with_ollama(paragraph, wpm=wpm, profile=profile, temperature=temperature - 0.1)
        
        return None
    except Exception as e:
        logger.error(f"[AGENT:simplify] Ollama simplification failed: {str(e)}")
        return None


def _simplify_with_gemini(paragraph: str, wpm: Optional[int] = None, profile: Optional[str] = None) -> Optional[str]:
    """
    Simplify a single paragraph using Gemini API fallback.
    Returns the simplified text, or None if it fails.
    """
    gemini_key = os.getenv('GEMINI_API_KEY', GEMINI_API_KEY)
    if not gemini_key:
        logger.warning("[AGENT:simplify] GEMINI_API_KEY not set - skipping Gemini fallback")
        return None
        
    system_prompt = _get_tailored_system_prompt(wpm, profile)
    
    try:
        logger.info("[AGENT:simplify] Attempting Gemini fallback for paragraph...")
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
        if response.status_code != 200:
            logger.warning(f"[AGENT:simplify] Gemini fallback API error: {response.status_code}")
            return None
            
        data = response.json()
        output_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
        
        if output_text and len(output_text) < len(paragraph) * 3:
            logger.info("[AGENT:simplify] Gemini fallback successful")
            return output_text
            
        logger.warning("[AGENT:simplify] Gemini fallback output validation failed")
        return None
    except Exception as e:
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
        
    # 1. Try Ollama if active
    if ollama_active:
        result = _simplify_with_ollama(paragraph, wpm, profile)
        if result:
            return result, "ollama"
            
    # 2. Try Gemini fallback
    result = _simplify_with_gemini(paragraph, wpm, profile)
    if result:
        return result, "gemini"
        
    # 3. Fall back to original text
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
