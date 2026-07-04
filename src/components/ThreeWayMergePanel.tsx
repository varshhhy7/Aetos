"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Branch, MergeField, MergeSide } from "@/lib/types";
import { useAetosStore } from "@/lib/store";
import {
  findMergeBase,
  resolveMergedTimeline,
  threeWayMerge,
} from "@/lib/three-way-merge";
import { summarizeValidation } from "@/lib/validator";
import { domainInfo } from "@/lib/domains";

export function ThreeWayMergePanel({
  projectId,
  ours,
  theirs,
}: {
  projectId: string;
  ours: Branch;
  theirs: Branch;
}) {
  const router = useRouter();
  const getBranch = useAetosStore((s) => s.getBranch);
  const saveMergedBranch = useAetosStore((s) => s.saveMergedBranch);

  const mergeBase = useMemo(
    () => findMergeBase(getBranch, ours.id, theirs.id),
    [getBranch, ours.id, theirs.id],
  );
  const baseTimeline = mergeBase?.timeline ?? ours.timeline;
  const baseName = mergeBase?.name ?? ours.name;

  const merge = useMemo(
    () => threeWayMerge(baseTimeline, ours.timeline, theirs.timeline, baseName),
    [baseTimeline, ours.timeline, theirs.timeline, baseName],
  );

  // Decisions reset naturally: the parent remounts this panel (via key) when the
  // compared branches change, so no reset effect is needed.
  const [decisions, setDecisions] = useState<Record<string, MergeSide>>({});

  const preview = useMemo(
    () => resolveMergedTimeline(baseTimeline, ours.timeline, theirs.timeline, decisions),
    [baseTimeline, ours.timeline, theirs.timeline, decisions],
  );

  const [merged, setMerged] = useState<{ id: string; name: string } | null>(null);

  const errors = preview.validation.filter((i) => i.severity === "error");
  const warnings = preview.validation.filter((i) => i.severity === "warning");

  function setSide(key: string, side: MergeSide) {
    setDecisions((prev) => ({ ...prev, [key]: side }));
  }

  function handleMerge() {
    const name = `${ours.name} + ${theirs.name}`;
    const branch = saveMergedBranch(projectId, ours.id, theirs.id, preview.timeline, name);
    setMerged({ id: branch.id, name: branch.name });
  }

  const nothingToMerge = merge.autoMerged.length === 0 && merge.conflicts.length === 0;

  return (
    <div className="panel p-5">
      <h3 className="gi-display font-display text-base font-medium text-ink">Three-way merge</h3>
      <p className="mt-1 text-sm text-ink-dim">
        Common ancestor <span className="font-medium text-ink">{baseName}</span> · reconciling{" "}
        <span className="font-medium text-ink">{theirs.name}</span> into{" "}
        <span className="font-medium text-ink">{ours.name}</span>
      </p>

      {nothingToMerge ? (
        <p className="mt-4 text-sm text-ink-faint">
          Nothing to merge — {theirs.name} introduces no changes over the common ancestor.
        </p>
      ) : (
        <>
          {merge.conflicts.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-400">
                {merge.conflicts.length} conflict{merge.conflicts.length === 1 ? "" : "s"} — choose a side
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {merge.conflicts.map((field) => (
                  <ConflictRow
                    key={field.key}
                    field={field}
                    side={decisions[field.key] ?? field.resolution}
                    onPick={(side) => setSide(field.key, side)}
                  />
                ))}
              </div>
            </div>
          )}

          {merge.autoMerged.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-teal">
                {merge.autoMerged.length} change{merge.autoMerged.length === 1 ? "" : "s"} auto-merged
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {merge.autoMerged.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <DomainDot domain={field} />
                      <span className="text-sm text-ink">{field.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono-aetos text-xs">
                      <span className="text-ink-faint line-through">{field.ours}</span>
                      <span className="text-ink-dim">→</span>
                      <span className="text-teal">{field.theirs}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ValidationSummary
            errorCount={errors.length}
            warningCount={warnings.length}
            issues={preview.validation}
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-ink-faint">
              {summarizeValidation(preview.validation)}
            </span>
            <button
              type="button"
              onClick={handleMerge}
              disabled={merged !== null}
              className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-void transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {errors.length > 0 ? "Merge anyway" : "Create merged cut"}
            </button>
          </div>
        </>
      )}

      <AnimatePresence>
        {merged && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="mt-4 flex items-center justify-between overflow-hidden rounded-lg border border-teal/30 bg-teal/[0.08] px-3 py-2.5"
          >
            <p className="text-sm text-ink">
              Merged into <span className="font-medium text-teal">{merged.name}</span>
            </p>
            <button
              type="button"
              onClick={() => router.push(`/project/${projectId}?branch=${merged.id}`)}
              className="rounded-full border border-teal/40 px-3 py-1 text-xs font-medium text-teal hover:bg-teal/10"
            >
              Open cut
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DomainDot({ domain }: { domain: MergeField }) {
  const info = domainInfo(domain.domain);
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: info.accent }}
      title={`${info.label} · ${info.owner}`}
    />
  );
}

function ConflictRow({
  field,
  side,
  onPick,
}: {
  field: MergeField;
  side: MergeSide;
  onPick: (side: MergeSide) => void;
}) {
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.05] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <DomainDot domain={field} />
        <span className="text-sm text-ink">{field.label}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <SideButton
          active={side === "ours"}
          label="Ours"
          value={field.ours}
          onClick={() => onPick("ours")}
        />
        <SideButton
          active={side === "theirs"}
          label="Theirs"
          value={field.theirs}
          onClick={() => onPick("theirs")}
        />
      </div>
    </div>
  );
}

function SideButton({
  active,
  label,
  value,
  onClick,
}: {
  active: boolean;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 rounded-md border px-2.5 py-1.5 text-left transition-colors ${
        active
          ? "border-teal/60 bg-teal/[0.12]"
          : "border-hairline bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      <span className={`text-[10px] uppercase tracking-wide ${active ? "text-teal" : "text-ink-faint"}`}>
        {label}
      </span>
      <span className="font-mono-aetos text-xs text-ink">{value}</span>
    </button>
  );
}

function ValidationSummary({
  errorCount,
  warningCount,
  issues,
}: {
  errorCount: number;
  warningCount: number;
  issues: { severity: string; message: string }[];
}) {
  if (errorCount === 0 && warningCount === 0) {
    return (
      <div className="mt-4 rounded-lg border border-teal/20 bg-teal/[0.05] p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-teal">Post-merge validation</p>
        <p className="mt-1 text-sm text-ink-dim">The merged timeline passes every check.</p>
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-400">Post-merge validation</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {issues.map((issue, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-dim">
            <span
              className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                issue.severity === "error" ? "bg-red-400" : "bg-amber-400"
              }`}
            />
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
