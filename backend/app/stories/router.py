from typing import Literal

from fastapi import APIRouter, Query

from app.stories.schemas import CommentsResponse, StoriesResponse, Story
from app.stories.service import fetch_comments_algolia, fetch_stories_paginated, fetch_story_by_id

router = APIRouter(prefix="/api/stories", tags=["stories"])


@router.get("", response_model=StoriesResponse)
async def get_stories(
    type: Literal["top", "new", "best"] = "top",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=30, ge=1, le=50),
):
    return await fetch_stories_paginated(type, page, limit)


@router.get("/{story_id}", response_model=Story)
async def get_story(story_id: int):
    return await fetch_story_by_id(story_id)


@router.get("/{story_id}/comments", response_model=CommentsResponse)
async def get_comments(story_id: int):
    comments = await fetch_comments_algolia(story_id)
    return {"comments": comments}
