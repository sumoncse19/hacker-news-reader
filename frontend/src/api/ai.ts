import { api } from "./client";
import type { AiSummaryResult } from "../types";

export async function summarizeDiscussion(
  storyId: number,
  force: boolean = false,
): Promise<AiSummaryResult> {
  const { data } = await api.post<AiSummaryResult>(
    `/stories/${storyId}/summarize`,
    null,
    { params: force ? { force: "true" } : {} },
  );
  return data;
}
