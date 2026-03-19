import { StoryItem } from "./StoryItem";
import type { Story } from "../../types";

interface StoryListProps {
  stories: Story[];
  startRank: number;
  bookmarkedIds?: number[];
  loadingStoryId?: number | null;
  onToggleBookmark?: (story: Story) => void;
}

export function StoryList({
  stories,
  startRank,
  bookmarkedIds,
  loadingStoryId,
  onToggleBookmark,
}: StoryListProps) {
  if (stories.length === 0) {
    return <p className="text-zinc-400 text-center py-8">No stories found.</p>;
  }

  return (
    <div>
      {stories.map((story, i) => (
        <StoryItem
          key={story.id}
          story={story}
          rank={startRank + i}
          isBookmarked={bookmarkedIds?.includes(story.id)}
          isBookmarkLoading={loadingStoryId === story.id}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </div>
  );
}
