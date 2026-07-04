import type { ActivityEvent } from "@/lib/types";

const EVENT_DOT: Record<string, string> = {
  branch_created: "bg-ink-dim",
  comment_added: "bg-ink-dim",
  branch_approved: "bg-teal",
  memory_updated: "bg-amber",
  branch_merged: "bg-amber",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="panel p-5">
      <h3 className="gi-display font-display text-base font-medium text-ink">Activity</h3>
      <div className="mt-3 flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
        {events.length === 0 && <p className="text-sm text-ink-faint">No activity yet.</p>}
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-2.5">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                EVENT_DOT[event.eventType] ?? "bg-ink-dim"
              }`}
            />
            <div className="flex-1">
              <p className="text-sm text-ink-dim">{event.message}</p>
              <span className="text-[11px] text-ink-faint">{timeAgo(event.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
