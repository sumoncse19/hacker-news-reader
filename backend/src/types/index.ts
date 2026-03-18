// Internal types used across the backend

export interface Story {
  id: number;
  title: string;
  url: string | null;
  text: string | null;
  author: string;
  points: number;
  commentCount: number;
  createdAt: string; // ISO string
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

// HN Firebase API raw types
export interface HNItem {
  id: number;
  deleted?: boolean;
  type?: string;
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  descendants?: number;
}

// Algolia HN API types
export interface AlgoliaItem {
  id: number;
  author: string | null;
  text: string | null;
  created_at: string;
  children: AlgoliaItem[];
}
