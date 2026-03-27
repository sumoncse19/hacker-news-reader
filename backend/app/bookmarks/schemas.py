from pydantic import BaseModel


class BookmarkCreate(BaseModel):
    hnStoryId: int
    title: str
    url: str | None = None
    author: str
    points: int
    commentCount: int
    hnCreatedAt: str


class BookmarkResponse(BaseModel):
    id: int
    hnStoryId: int
    title: str
    url: str | None
    author: str
    points: int
    commentCount: int
    hnCreatedAt: str
    createdAt: str

    model_config = {"from_attributes": True}


class BookmarksListResponse(BaseModel):
    bookmarks: list[BookmarkResponse]
    totalPages: int
    currentPage: int
    total: int


class BookmarkCheckResponse(BaseModel):
    bookmarkedIds: list[int]
