import { useState } from "react";
import { useStories } from "../hooks/useStories";
import { FeedTabs } from "../components/stories/FeedTabs";
import { StoryList } from "../components/stories/StoryList";
import type { FeedType } from "../types";

export function FeedPage() {
  const [feedType, setFeedType] = useState<FeedType>("top");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useStories(feedType, page);

  const handleFeedChange = (type: FeedType) => {
    setFeedType(type);
    setPage(1);
  };

  return (
    <div>
      <FeedTabs active={feedType} onChange={handleFeedChange} />

      {isLoading && (
        <div className="space-y-4 py-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse border-b border-zinc-100 py-3">
              <div className="h-5 bg-zinc-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center py-8">
          Failed to load stories. Please try again.
        </div>
      )}

      {data && (
        <>
          <StoryList
            stories={data.stories}
            startRank={(page - 1) * 30 + 1}
          />
          <div className="flex justify-center gap-4 py-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-30 hover:bg-zinc-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-zinc-500">
              Page {data.currentPage} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-30 hover:bg-zinc-50 transition-colors"
            >
              Load More
            </button>
          </div>
        </>
      )}
    </div>
  );
}
