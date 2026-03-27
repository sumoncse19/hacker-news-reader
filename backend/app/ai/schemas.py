from typing import Literal

from pydantic import BaseModel


class AiSummaryResponse(BaseModel):
    keyPoints: list[str]
    sentiment: Literal["positive", "negative", "mixed", "neutral"]
    summary: str
    commentCount: int
    cached: bool
    provider: str | None = None
