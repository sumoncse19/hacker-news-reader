import math
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.bookmarks.models import Bookmark
from app.bookmarks.schemas import BookmarkCreate
from app.core.exceptions import NotFoundError


async def create_bookmark(db: AsyncSession, data: BookmarkCreate) -> Bookmark:
    bookmark = Bookmark(
        hn_story_id=data.hnStoryId,
        title=data.title,
        url=data.url,
        author=data.author,
        points=data.points,
        comment_count=data.commentCount,
        hn_created_at=datetime.fromisoformat(data.hnCreatedAt.replace("Z", "+00:00")),
    )
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    return bookmark


async def delete_bookmark(db: AsyncSession, hn_story_id: int) -> None:
    result = await db.execute(select(Bookmark).where(Bookmark.hn_story_id == hn_story_id))
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise NotFoundError(f"Bookmark for story {hn_story_id} not found")
    await db.delete(bookmark)
    await db.commit()


async def get_bookmarks(db: AsyncSession, search: str | None = None, page: int = 1, limit: int = 30) -> dict:
    query = select(Bookmark)
    count_query = select(func.count()).select_from(Bookmark)

    if search:
        query = query.where(Bookmark.title.ilike(f"%{search}%"))
        count_query = count_query.where(Bookmark.title.ilike(f"%{search}%"))

    query = query.order_by(Bookmark.created_at.desc()).offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    bookmarks = result.scalars().all()

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return {
        "bookmarks": bookmarks,
        "totalPages": math.ceil(total / limit) if total > 0 else 0,
        "currentPage": page,
        "total": total,
    }


async def check_bookmarks(db: AsyncSession, hn_story_ids: list[int]) -> list[int]:
    result = await db.execute(
        select(Bookmark.hn_story_id).where(Bookmark.hn_story_id.in_(hn_story_ids))
    )
    return list(result.scalars().all())
