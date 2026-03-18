import { useState } from "react";
import { timeAgo } from "../../lib/timeAgo";
import type { Comment } from "../../types";

interface CommentItemProps {
  comment: Comment;
  depth?: number;
}

export function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${depth > 0 ? "ml-4 pl-4 border-l-2 border-zinc-200" : ""}`}
    >
      <div className="py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-400 hover:text-zinc-600 font-mono"
          >
            [{collapsed ? "+" : "−"}]
          </button>
          <span className="font-medium text-zinc-700">{comment.author}</span>
          <span>{timeAgo(comment.createdAt)}</span>
        </div>

        {!collapsed && (
          <>
            <div
              className="mt-1 text-sm text-zinc-800 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: comment.text }}
            />
            {comment.children.length > 0 && (
              <div className="mt-2">
                {comment.children.map((child) => (
                  <CommentItem
                    key={child.id}
                    comment={child}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
