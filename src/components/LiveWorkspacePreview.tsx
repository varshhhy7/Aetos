"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAetosStore } from "@/lib/store";
import { BranchRibbon } from "./BranchRibbon";

export function LiveWorkspacePreview() {
  const project = useAetosStore((s) => s.projects[0]);
  const allBranches = useAetosStore((s) => s.branches);

  const branches = useMemo(
    () => allBranches.filter((b) => b.projectId === project?.id),
    [allBranches, project?.id],
  );

  if (!project) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="hud-frame ascii-texture relative mt-14 overflow-hidden p-6 sm:p-10"
    >
      <span className="hud-corner tl" />
      <span className="hud-corner tr" />
      <span className="hud-corner bl" />
      <span className="hud-corner br" />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="eyebrow text-ink-faint">Live from your workspace</span>
            <h2 className="gi-display mt-1 font-display text-lg font-medium text-ink">
              {project.name}
            </h2>
          </div>
          <Link href={`/project/${project.id}`} className="pill-ghost px-3 py-1.5 text-xs">
            Open →
          </Link>
        </div>
        <div className="mt-6">
          <BranchRibbon branches={branches} currentBranchId={branches[0]?.id} />
        </div>
      </div>
    </motion.div>
  );
}
