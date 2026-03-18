import { api } from "./client";
import type { Bookmark, Story } from "../types";

interface BookmarksResponse {
  bookmarks: Bookmark[];
  totalPages: number;
  currentPage: number;
  total: number;
}

interface CheckResponse {
  bookmarkedIds: number[];
}

export async function fetchBookmarks(
  search?: string,
  page: number = 1,
): Promise<BookmarksResponse> {
  const { data } = await api.get<BookmarksResponse>("/bookmarks", {
    params: { search: search || undefined, page },
  });
  return data;
}

export async function checkBookmarks(ids: number[]): Promise<number[]> {
  if (ids.length === 0) return [];
  const { data } = await api.get<CheckResponse>("/bookmarks/check", {
    params: { ids: ids.join(",") },
  });
  return data.bookmarkedIds;
}

export async function addBookmark(story: Story): Promise<Bookmark> {
  const { data } = await api.post<Bookmark>("/bookmarks", {
    hnStoryId: story.id,
    title: story.title,
    url: story.url,
    author: story.author,
    points: story.points,
    commentCount: story.commentCount,
    hnCreatedAt: story.createdAt,
  });
  return data;
}

export async function removeBookmark(hnStoryId: number): Promise<void> {
  await api.delete(`/bookmarks/${hnStoryId}`);
}
