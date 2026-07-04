import type { ReactNode } from "react";
import type { DiffImpact } from "@/lib/types";

const IMPACT_STYLES: Record<DiffImpact, string> = {
  low: "bg-white/5 text-ink-faint border-white/10",
  medium: "bg-teal/15 text-teal border-teal/30",
  high: "bg-amber/15 text-amber border-amber/30",
};

export function ImpactBadge({ impact }: { impact: DiffImpact }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${IMPACT_STYLES[impact]}`}
    >
      {impact}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-white/5 text-ink-dim border-white/10",
  approved: "bg-teal/15 text-teal border-teal/30",
  merged: "bg-amber/15 text-amber border-amber/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
        STATUS_STYLES[status] ?? STATUS_STYLES.draft
      }`}
    >
      {status}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-hairline bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-medium text-ink-dim">
      {children}
    </span>
  );
}

export function CategoryLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
      {children}
    </span>
  );
}
