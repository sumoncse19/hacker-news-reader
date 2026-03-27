from fastapi import APIRouter, Query

from app.ai.schemas import AiSummaryResponse
from app.ai.service import generate_summary
from app.core.database import SessionDep
from app.stories.service import fetch_comments_algolia, fetch_story_by_id

router = APIRouter(prefix="/api", tags=["ai"])


@router.post("/stories/{story_id}/summarize", response_model=AiSummaryResponse)
async def summarize_discussion(
    story_id: int,
    db: SessionDep,
    force: bool = Query(default=False),
):
    story, comments = await fetch_story_by_id(story_id), await fetch_comments_algolia(story_id)

    return await generate_summary(
        db=db,
        story_id=story_id,
        story_title=story.title,
        comments=comments,
        comment_count=story.commentCount,
        force=force,
    )
