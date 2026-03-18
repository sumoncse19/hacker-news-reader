import { Link } from "react-router-dom";
import { timeAgo } from "../../lib/timeAgo";
import type { Story } from "../../types";

interface StoryItemProps {
  story: Story;
  rank?: number;
  isBookmarked?: boolean;
  onToggleBookmark?: (story: Story) => void;
}

export function StoryItem({
  story,
  rank,
  isBookmarked,
  onToggleBookmark,
}: StoryItemProps) {
  const domain = story.url
    ? new URL(story.url).hostname.replace("www.", "")
    : null;

  return (
    <div className="group flex gap-3 px-4 py-3 rounded-lg hover:bg-orange-50/50 transition-colors">
      {rank != null && (
        <span className="text-orange-300 font-bold text-sm w-7 text-right pt-1 shrink-0">
          {rank}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {story.url ? (
              <a
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 font-semibold leading-snug hover:text-orange-600 transition-colors"
              >
                {story.title}
              </a>
            ) : (
              <Link
                to={`/story/${story.id}`}
                className="text-zinc-900 font-semibold leading-snug hover:text-orange-600 transition-colors"
              >
                {story.title}
              </Link>
            )}
            {domain && (
              <span className="ml-2 text-xs text-zinc-400">({domain})</span>
            )}
          </div>
          {onToggleBookmark && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleBookmark(story);
              }}
              className={`shrink-0 text-lg transition-all hover:scale-110 ${
                isBookmarked
                  ? "text-orange-500"
                  : "text-zinc-200 group-hover:text-zinc-400 hover:text-orange-400!"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {isBookmarked ? "★" : "☆"}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <span className="text-orange-500 font-medium">
              ▲ {story.points}
            </span>
          </span>
          <span className="text-zinc-300">•</span>
          <span>{story.author}</span>
          <span className="text-zinc-300">•</span>
          <span>{timeAgo(story.createdAt)}</span>
          <span className="text-zinc-300">•</span>
          <Link
            to={`/story/${story.id}`}
            className="hover:text-orange-600 transition-colors font-medium"
          >
            💬 {story.commentCount}
          </Link>
        </div>
      </div>
    </div>
  );
}
