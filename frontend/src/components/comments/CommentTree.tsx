import { CommentItem } from "./CommentItem";
import type { Comment } from "../../types";

interface CommentTreeProps {
  comments: Comment[];
  isLoading: boolean;
}

export function CommentTree({ comments, isLoading }: CommentTreeProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3 bg-zinc-200 rounded w-32 mb-2" />
            <div className="h-4 bg-zinc-100 rounded w-full mb-1" />
            <div className="h-4 bg-zinc-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-zinc-400 text-center py-8">No comments yet.</p>
    );
  }

  return (
    <div>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
