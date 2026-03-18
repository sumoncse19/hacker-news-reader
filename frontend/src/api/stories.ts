import { api } from "./client";
import type { Story, Comment } from "../types";

interface StoriesResponse {
  stories: Story[];
  totalPages: number;
  currentPage: number;
}

interface CommentsResponse {
  comments: Comment[];
}

export async function fetchStories(
  type: "top" | "new" | "best",
  page: number,
  limit: number = 30,
): Promise<StoriesResponse> {
  const { data } = await api.get<StoriesResponse>("/stories", {
    params: { type, page, limit },
  });
  return data;
}

export async function fetchStory(id: number): Promise<Story> {
  const { data } = await api.get<Story>(`/stories/${id}`);
  return data;
}

export async function fetchComments(storyId: number): Promise<Comment[]> {
  const { data } = await api.get<CommentsResponse>(
    `/stories/${storyId}/comments`,
  );
  return data.comments;
}
