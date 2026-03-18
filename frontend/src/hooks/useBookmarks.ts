import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBookmarks,
  checkBookmarks,
  addBookmark,
  removeBookmark,
} from "../api/bookmarks";
import type { Story } from "../types";

export function useBookmarks(search?: string, page: number = 1) {
  return useQuery({
    queryKey: ["bookmarks", search, page],
    queryFn: () => fetchBookmarks(search, page),
  });
}

export function useCheckBookmarks(storyIds: number[]) {
  return useQuery({
    queryKey: ["bookmarks", "check", storyIds],
    queryFn: () => checkBookmarks(storyIds),
    enabled: storyIds.length > 0,
  });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (story: Story) => addBookmark(story),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hnStoryId: number) => removeBookmark(hnStoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
