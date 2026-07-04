"use client";

import { motion } from "framer-motion";
import type { Branch } from "@/lib/types";
import { StatusBadge } from "./ui/Badge";

const DOT_COLOR: Record<string, string> = {
  draft: "var(--ink-faint)",
  approved: "var(--teal)",
  merged: "var(--amber)",
};

export function BranchRibbon({
  branches,
  currentBranchId,
}: {
  branches: Branch[];
  currentBranchId?: string;
}) {
  const trunk = branches.find((b) => !b.parentBranchId) ?? branches[0];
  const offshoots = branches.filter((b) => b.id !== trunk?.id);

  return (
    <div className="relative w-full overflow-x-auto pb-1">
      <div className="relative flex min-w-max items-start gap-12 px-1 pt-2 pb-3">
        <div className="absolute left-3 right-3 top-[15px] h-px bg-hairline-strong" />
        {trunk && <BranchNode branch={trunk} isCurrent={trunk.id === currentBranchId} isTrunk />}
        {offshoots.map((branch) => (
          <BranchNode key={branch.id} branch={branch} isCurrent={branch.id === currentBranchId} />
        ))}
      </div>
    </div>
  );
}

function BranchNode({
  branch,
  isCurrent,
  isTrunk,
}: {
  branch: Branch;
  isCurrent: boolean;
  isTrunk?: boolean;
}) {
  const color = DOT_COLOR[branch.status] ?? DOT_COLOR.draft;

  return (
    <motion.div
      className="relative flex flex-col items-center gap-2 shrink-0"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {isTrunk ? (
        <span className="block h-[13px]" />
      ) : (
        <span className="h-[13px] w-px bg-hairline-strong" />
      )}
      <span
        className={`relative z-10 rounded-full ${isTrunk ? "h-3.5 w-3.5" : "h-2.5 w-2.5"}`}
        style={{ background: color }}
      >
        {isCurrent && (
          <motion.span
            layoutId="branch-highlight"
            className="absolute -inset-1.5 rounded-full ring-2 ring-offset-2 ring-offset-void ring-teal/60"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </span>
      <div className="flex flex-col items-center gap-1">
        <span
          className={`whitespace-nowrap text-xs ${
            isCurrent ? "text-ink font-medium" : "text-ink-dim"
          } ${isTrunk ? "font-display font-semibold" : ""}`}
        >
          {branch.name}
        </span>
        {isTrunk ? (
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">Trunk</span>
        ) : (
          <StatusBadge status={branch.status} />
        )}
      </div>
    </motion.div>
  );
}
