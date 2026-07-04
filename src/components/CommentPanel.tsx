"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";
import { useAetosStore } from "@/lib/store";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function CommentPanel({
  projectId,
  branchId,
  comments,
}: {
  projectId: string;
  branchId: string;
  comments: Comment[];
}) {
  const addComment = useAetosStore((s) => s.addComment);
  const [draft, setDraft] = useState("");

  function handleSubmit() {
    if (!draft.trim()) return;
    addComment(projectId, branchId, draft.trim());
    setDraft("");
  }

  return (
    <div className="panel p-5">
      <h3 className="gi-display font-display text-base font-medium text-ink">Comments</h3>

      <div className="mt-3 flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="text-sm text-ink-faint">No comments yet on this cut.</p>
        )}
        {comments
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((comment) => (
            <div key={comment.id} className="rounded-lg border border-hairline bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{comment.author}</span>
                <span className="text-[11px] text-ink-faint">{timeAgo(comment.createdAt)}</span>
              </div>
              {comment.clipId && (
                <span className="text-[11px] uppercase tracking-wide text-teal">
                  {comment.clipId.replace("clip_", "")}
                  {comment.timestampSeconds !== undefined ? ` @ ${comment.timestampSeconds}s` : ""}
                </span>
              )}
              <p className="mt-1 text-sm text-ink-dim">{comment.body}</p>
            </div>
          ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Add a comment..."
          className="flex-1 rounded-full border border-hairline bg-void/60 px-4 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-void hover:opacity-90"
        >
          Post
        </button>
      </div>
    </div>
  );
}
