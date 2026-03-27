from fastapi import APIRouter, Query, Response

from app.bookmarks.schemas import BookmarkCheckResponse, BookmarkCreate, BookmarkResponse, BookmarksListResponse
from app.bookmarks.service import check_bookmarks, create_bookmark, delete_bookmark, get_bookmarks
from app.core.database import SessionDep
from app.core.exceptions import DuplicateError

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


@router.get("", response_model=BookmarksListResponse)
async def list_bookmarks(
    db: SessionDep,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=30, ge=1, le=50),
):
    result = await get_bookmarks(db, search, page, limit)

    bookmarks_out = [
        BookmarkResponse(
            id=b.id,
            hnStoryId=b.hn_story_id,
            title=b.title,
            url=b.url,
            author=b.author,
            points=b.points,
            commentCount=b.comment_count,
            hnCreatedAt=b.hn_created_at.isoformat(),
            createdAt=b.created_at.isoformat(),
        )
        for b in result["bookmarks"]
    ]

    return BookmarksListResponse(
        bookmarks=bookmarks_out,
        totalPages=result["totalPages"],
        currentPage=result["currentPage"],
        total=result["total"],
    )


@router.get("/check", response_model=BookmarkCheckResponse)
async def check_bookmarks_endpoint(db: SessionDep, ids: str = ""):
    if not ids:
        return {"bookmarkedIds": []}

    id_list = [int(x) for x in ids.split(",") if x.strip().isdigit()]
    bookmarked_ids = await check_bookmarks(db, id_list)
    return {"bookmarkedIds": bookmarked_ids}


@router.post("", response_model=BookmarkResponse, status_code=201)
async def create_bookmark_endpoint(data: BookmarkCreate, db: SessionDep):
    try:
        bookmark = await create_bookmark(db, data)
        return BookmarkResponse(
            id=bookmark.id,
            hnStoryId=bookmark.hn_story_id,
            title=bookmark.title,
            url=bookmark.url,
            author=bookmark.author,
            points=bookmark.points,
            commentCount=bookmark.comment_count,
            hnCreatedAt=bookmark.hn_created_at.isoformat(),
            createdAt=bookmark.created_at.isoformat(),
        )
    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise DuplicateError("Story already bookmarked")
        raise


@router.delete("/{hn_story_id}", status_code=204)
async def delete_bookmark_endpoint(hn_story_id: int, db: SessionDep):
    await delete_bookmark(db, hn_story_id)
    return Response(status_code=204)
