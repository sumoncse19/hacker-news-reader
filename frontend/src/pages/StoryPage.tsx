import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchStory } from "../api/stories";
import { useComments } from "../hooks/useComments";
import {
  useCheckBookmarks,
  useAddBookmark,
  useRemoveBookmark,
} from "../hooks/useBookmarks";
import { useSummary } from "../hooks/useSummary";
import { CommentTree } from "../components/comments/CommentTree";
import { SummarizeButton } from "../components/ai/SummarizeButton";
import { SummaryCard } from "../components/ai/SummaryCard";
import { timeAgo } from "../lib/timeAgo";

export function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const storyId = parseInt(id || "0", 10);

  const {
    data: story,
    isLoading: storyLoading,
    error: storyError,
  } = useQuery({
    queryKey: ["story", storyId],
    queryFn: () => fetchStory(storyId),
    enabled: storyId > 0,
  });

  const { data: comments, isLoading: commentsLoading } = useComments(storyId);
  const { data: bookmarkedIds } = useCheckBookmarks(
    storyId > 0 ? [storyId] : [],
  );

  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();
  const summary = useSummary();

  const isBookmarked = bookmarkedIds?.includes(storyId);
  const isBookmarkLoading = addBookmark.isPending || removeBookmark.isPending;

  const handleToggleBookmark = () => {
    if (!story || isBookmarkLoading) return;
    if (isBookmarked) {
      removeBookmark.mutate(story.id);
    } else {
      addBookmark.mutate(story);
    }
  };

  const handleSummarize = (force = false) => {
    summary.mutate({ storyId, force });
  };

  if (storyLoading) {
    return (
      <div className="animate-pulse py-4 space-y-3">
        <div className="h-6 bg-zinc-200 rounded w-3/4" />
        <div className="h-4 bg-zinc-100 rounded w-1/2" />
        <div className="h-4 bg-zinc-100 rounded w-1/3" />
      </div>
    );
  }

  if (storyError || !story) {
    return (
      <div className="bg-red-50 text-red-600 text-center py-8 rounded-lg border border-red-200">
        Failed to load story.{" "}
        <Link to="/" className="underline font-medium">
          Go back
        </Link>
      </div>
    );
  }

  const domain = story.url
    ? new URL(story.url).hostname.replace("www.", "")
    : null;

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-orange-600 mb-4 transition-colors"
      >
        ← Back to feed
      </Link>

      {/* Story header */}
      <div className="bg-zinc-50 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-zinc-900 leading-snug">
            {story.title}
          </h1>
          <button
            onClick={handleToggleBookmark}
            disabled={isBookmarkLoading}
            className={`text-2xl shrink-0 transition-all hover:scale-110 disabled:opacity-50 ${
              isBookmarkLoading
                ? "animate-pulse text-orange-300"
                : isBookmarked
                  ? "text-orange-500"
                  : "text-zinc-300 hover:text-orange-400"
            }`}
            title={
              isBookmarkLoading
                ? "Saving..."
                : isBookmarked
                  ? "Remove bookmark"
                  : "Bookmark"
            }
          >
            {isBookmarkLoading ? "⏳" : isBookmarked ? "★" : "☆"}
          </button>
        </div>

        {domain && (
          <a
            href={story.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 text-sm text-orange-600 hover:underline"
          >
            🔗 {domain}
          </a>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm text-zinc-500">
          <span className="text-orange-500 font-semibold">
            ▲ {story.points}
          </span>
          <span className="text-zinc-300">•</span>
          <span>{story.author}</span>
          <span className="text-zinc-300">•</span>
          <span>{timeAgo(story.createdAt)}</span>
          <span className="text-zinc-300">•</span>
          <span>💬 {story.commentCount} comments</span>
        </div>

        {/* Ask HN / Show HN story text */}
        {story.text && (
          <div
            className="mt-4 text-sm text-zinc-700 prose prose-sm max-w-none border-t pt-4"
            dangerouslySetInnerHTML={{ __html: story.text }}
          />
        )}
      </div>

      {/* AI Summary Section */}
      <div className="mb-6">
        {summary.data ? (
          <SummaryCard
            summary={summary.data}
            onResummarize={() => handleSummarize(true)}
            isResummarizing={summary.isPending}
          />
        ) : (
          <>
            <SummarizeButton
              onClick={() => handleSummarize(false)}
              isLoading={summary.isPending}
              commentCount={story.commentCount}
            />
            {summary.isError && (
              <div className="mt-3 bg-red-50 text-red-600 text-sm text-center py-3 rounded-lg border border-red-200">
                Failed to generate summary.{" "}
                <button
                  onClick={() => handleSummarize(false)}
                  className="underline font-medium"
                >
                  Retry
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comments */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-zinc-900">
          Discussion ({story.commentCount})
        </h2>
      </div>
      <CommentTree comments={comments || []} isLoading={commentsLoading} />
    </div>
  );
}
