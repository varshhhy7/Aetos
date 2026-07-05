"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Branch, TeamMemory } from "@/lib/types";
import { calculateBrandMatchScore, suggestEditsFromMemory } from "@/lib/memory-engine";
import { useAetosStore } from "@/lib/store";
import { RadialGauge } from "./ui/RadialGauge";

const MEMORY_PILLS = [
  { key: "pacing", label: "Pacing", val: "Medium", icon: "📈" },
  { key: "hookLengthPreference", label: "Hook length", val: "Under 8 seconds", icon: "⏱" },
  { key: "captionStyle", label: "Captions", val: "Minimal white", icon: "📝" },
  { key: "colorGrade", label: "Color grade", val: "Neutral", icon: "🎨" },
  { key: "musicMood", label: "Music", val: "Calm", icon: "🎵" },
  { key: "ctaPlacement", label: "CTA placement", val: "Before final 15%", icon: "🎯" },
  { key: "brandTone", label: "Brand tone", val: "Clear B2B", icon: "💬" },
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
    <div className="flex flex-col gap-5">
      
      {/* 1. SECTION HEADER */}
      <div>
        <h3 className="text-white font-mono uppercase tracking-wider text-[10px] mb-1">
          What Aetos Remembers About This Team
        </h3>
      </div>

      {/* 2. RADIAL GAUGES */}
      <div className="grid grid-cols-2 gap-4 border border-[#1c1b19] bg-[#0c0b0b] rounded-xl p-4">
        <RadialGauge value={55} label="Confidence" accent="amber" />
        <RadialGauge value={67} label="Brand match" accent="teal" />
      </div>

      <div className="text-[10px] text-zinc-500 font-mono text-center">
        Last learned from {branch.id === memory.lastUpdatedFromBranchId ? "this cut" : "a previous approved cut"}
      </div>

      {/* 3. LEARNED PARAMETERS PILLS */}
      <div className="space-y-1.5">
        {MEMORY_PILLS.map((pill) => (
          <div 
            key={pill.key}
            className="flex items-center gap-2 px-3 py-2 bg-[#0c0b0b] border border-hairline rounded-lg text-[11px] text-zinc-300 transition-colors hover:border-zinc-700"
          >
            <span className="text-[13px]">{pill.icon}</span>
            <span className="font-medium text-zinc-500">{pill.label}:</span>
            <span className="text-white font-semibold ml-auto">{pill.val}</span>
          </div>
        ))}
      </div>

      {/* 4. SUGGESTIONS */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
          Suggestions
        </span>
        
        <div className="space-y-2">
          {/* Card 1: CTA Warning */}
          <div className="border border-amber-500/20 bg-amber-500/[0.04] p-3 rounded-lg text-[11px] text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-500 font-semibold font-mono text-[9px] uppercase">
              <span>⚠️ cta warning</span>
            </div>
            <p className="leading-relaxed">
              Your CTA appears at 50s. Team memory prefers CTA placement before final 15%.
            </p>
          </div>

          {/* Card 2: Captions Warning */}
          <div className="border border-zinc-700/40 bg-zinc-800/10 p-3 rounded-lg text-[11px] text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 font-semibold font-mono text-[9px] uppercase">
              <span>ℹ️ caption review</span>
            </div>
            <p className="leading-relaxed">
              Captions are minimal white. Approved cuts use minimal white captions.
            </p>
          </div>
        </div>
      </div>

      {/* 5. ACTION BUTTONS */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => approveBranch(projectId, branch.id)}
          disabled={branch.status === "approved"}
          className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors disabled:opacity-50"
        >
          {branch.status === "approved" ? "Approved" : "Approved"}
        </button>
        <button
          type="button"
          onClick={() => {
            const newBranch = applyMemoryToBranch(projectId, branch.id);
            setJustApplied(newBranch.name);
          }}
          className="flex-1 border border-[#2c2a27] bg-[#1a1918] text-zinc-300 font-semibold py-2 px-4 rounded-lg text-xs transition-colors hover:bg-zinc-800 flex items-center justify-center gap-1.5"
        >
          <span>✦</span> Apply memory
        </button>
      </div>

      <AnimatePresence>
        {justApplied && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-xs text-teal text-center"
          >
            Applied style rules! Created &ldquo;{justApplied}&rdquo;.
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  );
}
