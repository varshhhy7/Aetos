"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Branch, TeamMemory } from "@/lib/types";
import { calculateBrandMatchScore, suggestEditsFromMemory } from "@/lib/memory-engine";
import { useAetosStore } from "@/lib/store";
import { RadialGauge } from "./ui/RadialGauge";
import { Tag } from "./ui/Badge";

const MEMORY_FIELDS: { key: keyof TeamMemory; label: string }[] = [
  { key: "pacing", label: "Pacing" },
  { key: "hookLengthPreference", label: "Hook length" },
  { key: "captionStyle", label: "Captions" },
  { key: "colorGrade", label: "Color grade" },
  { key: "musicMood", label: "Music" },
  { key: "ctaPlacement", label: "CTA placement" },
  { key: "brandTone", label: "Brand tone" },
];

export function MemoryPanel({
  projectId,
  branch,
  memory,
}: {
  projectId: string;
  branch: Branch;
  memory: TeamMemory;
}) {
  const approveBranch = useAetosStore((s) => s.approveBranch);
  const applyMemoryToBranch = useAetosStore((s) => s.applyMemoryToBranch);
  const [justApplied, setJustApplied] = useState<string | null>(null);

  const suggestions = useMemo(() => suggestEditsFromMemory(branch, memory), [branch, memory]);
  const score = useMemo(() => calculateBrandMatchScore(branch, memory), [branch, memory]);

  return (
    <div className="glass-card scope-panel p-5">
      <h3 className="gi-display font-display text-base font-medium text-ink">
        What Aetos remembers about this team
      </h3>

      <div className="mt-4 flex items-center justify-center gap-8 rounded-xl border border-hairline bg-black/20 py-5">
        <RadialGauge value={memory.confidence * 100} label="Confidence" accent="amber" />
        <RadialGauge value={score} label="Brand match" accent="teal" />
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-faint">
        Last learned from {branch.id === memory.lastUpdatedFromBranchId ? "this cut" : "a previous approved cut"}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {MEMORY_FIELDS.map(({ key, label }) => (
          <Tag key={key}>
            {label}: {String(memory[key]).replace(/_/g, " ")}
          </Tag>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Suggestions
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {suggestions.map((s, i) => (
              <li
                key={s.id}
                className="rounded-lg border border-amber/20 bg-amber/[0.05] px-3 py-2 text-sm text-ink-dim"
              >
                {i + 1}. {s.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => approveBranch(projectId, branch.id)}
          disabled={branch.status === "approved"}
          className="flex-1 rounded-full bg-teal px-4 py-2 text-sm font-medium text-void transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {branch.status === "approved" ? "Approved" : "Approve cut and update memory"}
        </button>
        <button
          type="button"
          onClick={() => {
            const newBranch = applyMemoryToBranch(projectId, branch.id);
            setJustApplied(newBranch.name);
          }}
          className="rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-dim hover:border-hairline-strong hover:text-ink"
        >
          Apply memory
        </button>
      </div>

      <AnimatePresence>
        {justApplied && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="mt-3 overflow-hidden text-xs text-teal"
          >
            Created &ldquo;{justApplied}&rdquo; with memory-aligned edits. Find it in Cuts.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
