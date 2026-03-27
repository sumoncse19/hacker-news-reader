from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AiSummary(Base):
    __tablename__ = "ai_summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hn_story_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    key_points: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    sentiment: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (Index("ix_ai_summaries_hn_story_id", "hn_story_id"),)
