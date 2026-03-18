import { useQuery } from "@tanstack/react-query";
import { fetchStories } from "../api/stories";
import type { FeedType } from "../types";

export function useStories(type: FeedType, page: number) {
  return useQuery({
    queryKey: ["stories", type, page],
    queryFn: () => fetchStories(type, page),
  });
}
