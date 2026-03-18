interface SummarizeButtonProps {
  onClick: () => void;
  isLoading: boolean;
  commentCount: number;
}

export function SummarizeButton({ onClick, isLoading, commentCount }: SummarizeButtonProps) {
  if (commentCount === 0) return null;

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full px-4 py-3 rounded-xl bg-linear-to-r from-blue-500 to-indigo-500 text-white font-medium text-sm hover:from-blue-600 hover:to-indigo-600 disabled:opacity-60 transition-all shadow-sm hover:shadow-md"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin">⏳</span>
          AI is reading {commentCount} comments...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          🤖 Summarize Discussion
        </span>
      )}
    </button>
  );
}
