from pydantic import BaseModel


class Story(BaseModel):
    id: int
    title: str
    url: str | None
    text: str | None
    author: str
    points: int
    commentCount: int
    createdAt: str
    type: str


class Comment(BaseModel):
    id: int
    author: str
    text: str
    createdAt: str
    children: list["Comment"]


class StoriesResponse(BaseModel):
    stories: list[Story]
    totalPages: int
    currentPage: int


class CommentsResponse(BaseModel):
    comments: list[Comment]
