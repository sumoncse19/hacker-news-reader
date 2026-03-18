import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchStory } from "../api/stories";
import { useComments } from "../hooks/useComments";
import { CommentTree } from "../components/comments/CommentTree";
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

  if (storyLoading) {
    return (
      <div className="animate-pulse py-4">
        <div className="h-6 bg-zinc-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-zinc-100 rounded w-1/2 mb-2" />
        <div className="h-4 bg-zinc-100 rounded w-1/3" />
      </div>
    );
  }

  if (storyError || !story) {
    return (
      <div className="text-red-500 text-center py-8">
        Failed to load story.{" "}
        <Link to="/" className="text-orange-600 underline">
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
        className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 inline-block"
      >
        ← Back to feed
      </Link>

      {/* Story header */}
      <div className="border-b pb-4 mb-4">
        <h1 className="text-xl font-bold text-zinc-900">{story.title}</h1>
        {domain && (
          <a
            href={story.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-600 hover:underline"
          >
            {domain}
          </a>
        )}
        <div className="flex items-center gap-3 mt-2 text-sm text-zinc-500">
          <span>{story.points} points</span>
          <span>by {story.author}</span>
          <span>{timeAgo(story.createdAt)}</span>
          <span>{story.commentCount} comments</span>
        </div>

        {/* Ask HN / Show HN story text */}
        {story.text && (
          <div
            className="mt-4 text-sm text-zinc-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: story.text }}
          />
        )}
      </div>

      {/* Comments */}
      <h2 className="text-lg font-semibold text-zinc-900 mb-2">Discussion</h2>
      <CommentTree comments={comments || []} isLoading={commentsLoading} />
    </div>
  );
}
