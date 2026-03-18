import { useQuery } from "@tanstack/react-query";
import { fetchComments } from "../api/stories";

export function useComments(storyId: number) {
  return useQuery({
    queryKey: ["comments", storyId],
    queryFn: () => fetchComments(storyId),
    enabled: storyId > 0,
  });
}
