import json
import logging
import re

from google import genai
from groq import Groq
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models import AiSummary
from app.core.config import settings
from app.core.exceptions import AiServiceError
from app.stories.schemas import Comment
from app.utils.html import strip_html

logger = logging.getLogger(__name__)

# Initialize providers lazily
_gemini_client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None
_groq_client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None

SYSTEM_PROMPT = """You are analyzing a Hacker News discussion thread. Return a JSON object with exactly this shape:
{
  "keyPoints": ["point 1", "point 2", ...],
  "sentiment": "positive" | "negative" | "mixed" | "neutral",
  "summary": "2-4 sentence summary"
}

Rules:
- keyPoints: 3-7 concise sentences about what was discussed
- sentiment: exactly one of "positive", "negative", "mixed", "neutral"
- summary: 2-4 sentences summarizing the discussion
- Return ONLY valid JSON, no markdown, no code fences"""


def _format_comments(comments: list[Comment], depth: int = 0, max_chars: int = 4000) -> str:
    result = ""
    indent = "  " * depth
    for comment in comments:
        if len(result) > max_chars:
            break
        text = strip_html(comment.text)[:500]
        result += f"{indent}[{comment.author}]: {text}\n"
        if comment.children:
            result += _format_comments(comment.children, depth + 1, max_chars - len(result))
    return result


async def _call_gemini(prompt: str) -> str:
    if not _gemini_client:
        raise AiServiceError("Gemini API key not configured")
    response = _gemini_client.models.generate_content(model=settings.gemini_model, contents=prompt)
    return response.text or ""


def _call_groq(system_prompt: str, user_prompt: str) -> str:
    if not _groq_client:
        raise AiServiceError("Groq API key not configured")
    response = _groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def _parse_response(text: str) -> dict:
    cleaned = re.sub(r"```json\s*", "", text)
    cleaned = re.sub(r"```\s*", "", cleaned).strip()
    parsed = json.loads(cleaned)
    if not isinstance(parsed.get("keyPoints"), list) or not parsed.get("sentiment") or not parsed.get("summary"):
        raise ValueError("Invalid AI response shape")
    if parsed["sentiment"] not in ("positive", "negative", "mixed", "neutral"):
        parsed["sentiment"] = "neutral"
    return parsed


async def generate_summary(
    db: AsyncSession,
    story_id: int,
    story_title: str,
    comments: list[Comment],
    comment_count: int,
    force: bool = False,
) -> dict:
    # Cache check
    if not force:
        result = await db.execute(select(AiSummary).where(AiSummary.hn_story_id == story_id))
        cached = result.scalar_one_or_none()
        if cached:
            return {
                "keyPoints": cached.key_points,
                "sentiment": cached.sentiment,
                "summary": cached.summary,
                "commentCount": cached.comment_count,
                "cached": True,
                "provider": None,
            }

    if not comments:
        return {"keyPoints": [], "sentiment": "neutral", "summary": "No comments to summarize.", "commentCount": 0, "cached": False, "provider": None}

    user_prompt = f'Story: "{story_title}"\n\nComments:\n---\n{_format_comments(comments)}\n---'
    full_prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"

    parsed = None
    provider = "gemini"

    # Gemini first
    try:
        logger.info(f"Attempting Gemini for story {story_id}")
        parsed = _parse_response(await _call_gemini(full_prompt))
        provider = "gemini"
    except Exception as e:
        logger.warning(f"Gemini failed for story {story_id}: {e}, falling back to Groq")
        # Groq fallback
        try:
            if not _groq_client:
                raise AiServiceError("Gemini failed and Groq not configured. Set GROQ_API_KEY for fallback.")
            parsed = _parse_response(_call_groq(SYSTEM_PROMPT, user_prompt))
            provider = "groq"
        except Exception as groq_err:
            logger.error(f"Both Gemini and Groq failed: {groq_err}")
            raise AiServiceError(str(groq_err))

    # Cache result
    try:
        existing = await db.execute(select(AiSummary).where(AiSummary.hn_story_id == story_id))
        row = existing.scalar_one_or_none()
        if row:
            row.key_points = parsed["keyPoints"]
            row.sentiment = parsed["sentiment"]
            row.summary = parsed["summary"]
            row.comment_count = comment_count
        else:
            db.add(AiSummary(hn_story_id=story_id, key_points=parsed["keyPoints"], sentiment=parsed["sentiment"], summary=parsed["summary"], comment_count=comment_count))
        await db.commit()
    except Exception as cache_err:
        logger.warning(f"Failed to cache AI summary: {cache_err}")

    return {"keyPoints": parsed["keyPoints"], "sentiment": parsed["sentiment"], "summary": parsed["summary"], "commentCount": comment_count, "cached": False, "provider": provider}
