import { useState } from "react";
import { timeAgo } from "../../lib/timeAgo";
import type { Comment } from "../../types";

interface CommentItemProps {
  comment: Comment;
  depth?: number;
}

const DEPTH_COLORS = [
  "border-orange-300",
  "border-blue-300",
  "border-green-300",
  "border-purple-300",
  "border-pink-300",
  "border-yellow-300",
];

export function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [collapsed, setCollapsed] = useState(false);
  const borderColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  return (
    <div
      className={`${depth > 0 ? `ml-4 pl-3 border-l-2 ${borderColor}` : ""}`}
    >
      <div className="py-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-400 hover:text-zinc-600 font-mono w-5 text-center"
          >
            [{collapsed ? "+" : "−"}]
          </button>
          <span className="font-semibold text-orange-600">
            {comment.author}
          </span>
          <span className="text-zinc-400">{timeAgo(comment.createdAt)}</span>
          {collapsed && comment.children.length > 0 && (
            <span className="text-zinc-400">
              ({comment.children.length}{" "}
              {comment.children.length === 1 ? "reply" : "replies"})
            </span>
          )}
        </div>

        {!collapsed && (
          <>
            <div
              className="mt-1.5 ml-7 text-sm text-zinc-700 leading-relaxed [&_p]:mb-2 [&_a]:text-orange-600 [&_a]:underline [&_pre]:bg-zinc-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs [&_code]:text-xs"
              dangerouslySetInnerHTML={{ __html: comment.text }}
            />
            {comment.children.length > 0 && (
              <div className="mt-1">
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
