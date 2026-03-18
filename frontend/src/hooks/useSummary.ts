import { useMutation } from "@tanstack/react-query";
import { summarizeDiscussion } from "../api/ai";

export function useSummary() {
  return useMutation({
    mutationFn: ({ storyId, force }: { storyId: number; force?: boolean }) =>
      summarizeDiscussion(storyId, force),
  });
}
