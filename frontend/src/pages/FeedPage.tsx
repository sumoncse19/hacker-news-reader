import { useState } from "react";
import { useStories } from "../hooks/useStories";
import { useCheckBookmarks, useAddBookmark, useRemoveBookmark } from "../hooks/useBookmarks";
import { FeedTabs } from "../components/stories/FeedTabs";
import { StoryItem } from "../components/stories/StoryItem";
import type { FeedType, Story } from "../types";

export function FeedPage() {
  const [feedType, setFeedType] = useState<FeedType>("top");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useStories(feedType, page);

  const storyIds = data?.stories.map((s) => s.id) || [];
  const { data: bookmarkedIds } = useCheckBookmarks(storyIds);

  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  const handleFeedChange = (type: FeedType) => {
    setFeedType(type);
    setPage(1);
  };

  const handleToggleBookmark = (story: Story) => {
    const isBookmarked = bookmarkedIds?.includes(story.id);
    if (isBookmarked) {
      removeBookmark.mutate(story.id);
    } else {
      addBookmark.mutate(story);
    }
  };

  return (
    <div>
      <FeedTabs active={feedType} onChange={handleFeedChange} />

      {isLoading && (
        <div className="space-y-2 py-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse px-4 py-3 rounded-lg bg-zinc-50">
              <div className="h-5 bg-zinc-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-center py-8 rounded-lg border border-red-200">
          Failed to load stories. Please try again.
        </div>
      )}

      {data && (
        <>
          <div className="divide-y-0">
            {data.stories.map((story, i) => (
              <StoryItem
                key={story.id}
                story={story}
                rank={(page - 1) * 30 + i + 1}
                isBookmarked={bookmarkedIds?.includes(story.id)}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>
          <div className="flex items-center justify-between py-6 border-t mt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 bg-white disabled:opacity-30 hover:bg-zinc-50 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-zinc-400">
              Page {data.currentPage} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-orange-500 text-white disabled:opacity-30 hover:bg-orange-600 transition-colors"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
