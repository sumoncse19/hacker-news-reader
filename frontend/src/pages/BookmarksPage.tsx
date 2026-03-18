import { useState, useEffect } from "react";
import { useBookmarks, useRemoveBookmark } from "../hooks/useBookmarks";
import { timeAgo } from "../lib/timeAgo";
import { Link } from "react-router-dom";

export function BookmarksPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useBookmarks(debouncedSearch, page);
  const removeBookmark = useRemoveBookmark();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-zinc-900">⭐ Bookmarks</h1>
        {data && data.total > 0 && (
          <span className="text-sm text-zinc-400">
            {data.total} saved
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-zinc-200 rounded-lg text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
      </div>

      {isLoading && (
        <div className="space-y-2 py-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse px-4 py-3 rounded-lg bg-zinc-50">
              <div className="h-5 bg-zinc-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {data && data.bookmarks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">{debouncedSearch ? "🔍" : "📚"}</div>
          <p className="text-zinc-500">
            {debouncedSearch
              ? `No bookmarks matching "${debouncedSearch}"`
              : "No bookmarks yet"}
          </p>
          {!debouncedSearch && (
            <p className="text-zinc-400 text-sm mt-1">
              Star stories from the feed to save them here.
            </p>
          )}
        </div>
      )}

      {data && data.bookmarks.length > 0 && (
        <>
          <div>
            {data.bookmarks.map((bookmark) => {
              const domain = bookmark.url
                ? new URL(bookmark.url).hostname.replace("www.", "")
                : null;

              return (
                <div
                  key={bookmark.id}
                  className="group flex gap-3 px-4 py-3 rounded-lg hover:bg-orange-50/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/story/${bookmark.hnStoryId}`}
                          className="text-zinc-900 font-semibold leading-snug hover:text-orange-600 transition-colors"
                        >
                          {bookmark.title}
                        </Link>
                        {domain && (
                          <span className="ml-2 text-xs text-zinc-400">
                            ({domain})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          removeBookmark.mutate(bookmark.hnStoryId)
                        }
                        className="shrink-0 text-lg text-orange-500 hover:text-red-500 hover:scale-110 transition-all"
                        title="Remove bookmark"
                      >
                        ★
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-zinc-500">
                      <span className="text-orange-500 font-medium">
                        ▲ {bookmark.points}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span>{bookmark.author}</span>
                      <span className="text-zinc-300">•</span>
                      <span>💬 {bookmark.commentCount}</span>
                      <span className="text-zinc-300">•</span>
                      <span>Saved {timeAgo(bookmark.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {data.totalPages > 1 && (
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
          )}
        </>
      )}
    </div>
  );
}
