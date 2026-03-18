import { config } from "../config";
import { decodeHtmlEntities } from "../utils/html";
import { logger } from "../utils/logger";
import { ExternalApiError } from "../utils/errors";
import type { Story, Comment, HNItem, AlgoliaItem } from "../types";

// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(
  key: string,
  data: unknown,
  ttlMs: number = config.hn.cacheTtlMs,
): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

// --- Firebase API (stories) ---

async function fetchFromFirebase<T>(path: string): Promise<T> {
  const url = `${config.hn.firebaseBaseUrl}/${path}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new ExternalApiError(`Firebase API error: ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

function mapFirebaseStory(item: HNItem): Story {
  return {
    id: item.id,
    title: decodeHtmlEntities(item.title || ""),
    url: item.url && item.url.length > 0 ? item.url : null,
    text: item.text ? item.text : null,
    author: item.by || "[deleted]",
    points: item.score || 0,
    commentCount: item.descendants || 0,
    createdAt: new Date((item.time || 0) * 1000).toISOString(),
    type: item.type || "story",
  };
}

export async function fetchStoryIds(
  type: "top" | "new" | "best",
): Promise<number[]> {
  const cacheKey = `story_ids_${type}`;
  const cached = getCached<number[]>(cacheKey);
  if (cached) return cached;

  const endpointMap = {
    top: "topstories",
    new: "newstories",
    best: "beststories",
  };

  const ids = await fetchFromFirebase<number[]>(endpointMap[type]);
  setCache(cacheKey, ids);
  return ids;
}

export async function fetchStoryById(id: number): Promise<Story> {
  const cacheKey = `story_${id}`;
  const cached = getCached<Story>(cacheKey);
  if (cached) return cached;

  const item = await fetchFromFirebase<HNItem>(`item/${id}`);
  if (!item || item.deleted || item.dead) {
    throw new ExternalApiError(`Story ${id} not found or deleted`);
  }

  const story = mapFirebaseStory(item);
  setCache(cacheKey, story, 5 * 60 * 1000); // Cache stories for 5 min
  return story;
}

export async function fetchStoriesPaginated(
  type: "top" | "new" | "best",
  page: number,
  limit: number,
): Promise<{ stories: Story[]; totalPages: number; currentPage: number }> {
  const allIds = await fetchStoryIds(type);
  const start = (page - 1) * limit;
  const end = start + limit;
  const pageIds = allIds.slice(start, end);

  const stories = await Promise.all(
    pageIds.map(async (id) => {
      try {
        return await fetchStoryById(id);
      } catch (err) {
        logger.warn(`Failed to fetch story ${id}`, err);
        return null;
      }
    }),
  );

  return {
    stories: stories.filter((s): s is Story => s !== null),
    totalPages: Math.ceil(allIds.length / limit),
    currentPage: page,
  };
}

// --- Algolia API (comments) ---

function transformAlgoliaTree(children: AlgoliaItem[]): Comment[] {
  return children
    .filter((child) => child.text && child.author)
    .map((child) => ({
      id: child.id,
      author: child.author!,
      text: child.text!,
      createdAt: child.created_at,
      children: transformAlgoliaTree(child.children || []),
    }));
}

export async function fetchCommentsAlgolia(
  storyId: number,
): Promise<Comment[]> {
  const url = `${config.hn.algoliaBaseUrl}/items/${storyId}`;
  const res = await fetch(url);

  if (!res.ok) {
    logger.warn(
      `Algolia API failed for story ${storyId}: ${res.status}, falling back to Firebase`,
    );
    return fetchCommentsFirebase(storyId);
  }

  const data = (await res.json()) as { children?: AlgoliaItem[] };
  return transformAlgoliaTree(data.children || []);
}

// --- Firebase fallback for comments ---

async function fetchCommentTree(
  id: number,
  depth: number = 0,
  maxDepth: number = 3,
): Promise<Comment | null> {
  if (depth >= maxDepth) return null;

  try {
    const item = await fetchFromFirebase<HNItem>(`item/${id}`);
    if (!item || item.deleted || item.dead || !item.text) return null;

    const children = await Promise.all(
      (item.kids || [])
        .slice(0, 25)
        .map((kidId) => fetchCommentTree(kidId, depth + 1, maxDepth)),
    );

    return {
      id: item.id,
      author: item.by || "[deleted]",
      text: item.text,
      createdAt: new Date((item.time || 0) * 1000).toISOString(),
      children: children.filter((c): c is Comment => c !== null),
    };
  } catch {
    return null;
  }
}

async function fetchCommentsFirebase(storyId: number): Promise<Comment[]> {
  const story = await fetchFromFirebase<HNItem>(`item/${storyId}`);
  if (!story || !story.kids) return [];

  const rootIds = story.kids.slice(0, 50);
  const comments = await Promise.all(rootIds.map((id) => fetchCommentTree(id)));

  return comments.filter((c): c is Comment => c !== null);
}
