import { Link } from "react-router-dom";
import { timeAgo } from "../../lib/timeAgo";
import type { Story } from "../../types";

interface StoryItemProps {
  story: Story;
  rank?: number;
}

export function StoryItem({ story, rank }: StoryItemProps) {
  const domain = story.url
    ? new URL(story.url).hostname.replace("www.", "")
    : null;

  return (
    <div className="flex gap-3 py-3 border-b border-zinc-100">
      {rank && (
        <span className="text-zinc-400 text-sm w-8 text-right pt-0.5 shrink-0">
          {rank}.
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {story.url ? (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-900 font-medium hover:text-orange-600 transition-colors"
            >
              {story.title}
            </a>
          ) : (
            <Link
              to={`/story/${story.id}`}
              className="text-zinc-900 font-medium hover:text-orange-600 transition-colors"
            >
              {story.title}
            </Link>
          )}
          {domain && (
            <span className="text-xs text-zinc-400 shrink-0">({domain})</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
          <span>{story.points} points</span>
          <span>by {story.author}</span>
          <span>{timeAgo(story.createdAt)}</span>
          <Link
            to={`/story/${story.id}`}
            className="hover:text-orange-600 transition-colors"
          >
            {story.commentCount} comments
          </Link>
        </div>
      </div>
    </div>
  );
}
