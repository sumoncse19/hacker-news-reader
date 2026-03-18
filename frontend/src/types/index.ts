export interface Story {
  id: number;
  title: string;
  url: string | null;
  text: string | null;
  author: string;
  points: number;
  commentCount: number;
  createdAt: string;
  type: string;
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  createdAt: string;
  children: Comment[];
}

export interface AiSummaryResult {
  keyPoints: string[];
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  summary: string;
  commentCount: number;
  cached: boolean;
  provider?: string;
}

export interface Bookmark {
  id: number;
  hnStoryId: number;
  title: string;
  url: string | null;
  author: string;
  points: number;
  commentCount: number;
  hnCreatedAt: string;
  createdAt: string;
}

export type FeedType = "top" | "new" | "best";
