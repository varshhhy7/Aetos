"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAetosStore } from "@/lib/store";
import { compareBranches } from "@/lib/diff-engine";
import { BranchSelector } from "@/components/BranchSelector";
import { VideoPreview } from "@/components/VideoPreview";
import { DiffPanel } from "@/components/DiffPanel";
import { ThreeWayMergePanel } from "@/components/ThreeWayMergePanel";

export default function ComparePage() {
  const params = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const projectId = params.projectId;

  const allBranches = useAetosStore((s) => s.branches);
  const branches = useMemo(
    () => allBranches.filter((b) => b.projectId === projectId),
    [allBranches, projectId],
  );

  const [baseId, setBaseId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (branches.length === 0) return;
    const baseFromQuery = searchParams.get("base");
    const targetFromQuery = searchParams.get("target");
    setBaseId((prev) =>
      prev ?? (baseFromQuery && branches.some((b) => b.id === baseFromQuery)
        ? baseFromQuery
        : branches[0].id),
    );
    setTargetId((prev) =>
      prev ??
      (targetFromQuery && branches.some((b) => b.id === targetFromQuery)
        ? targetFromQuery
        : (branches[1]?.id ?? branches[0].id)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  const base = branches.find((b) => b.id === baseId);
  const target = branches.find((b) => b.id === targetId);

  const diff = useMemo(() => (base && target ? compareBranches(base, target) : null), [base, target]);

  if (!base || !target || !diff) {
    return <div className="mx-auto max-w-5xl px-6 py-16 text-ink-dim">Loading comparison…</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-8 py-10">
      <header className="animate-fade-up">
        <span className="eyebrow text-teal">Diff</span>
        <h1 className="gi-display mt-1 font-display text-2xl font-medium text-ink">Compare cuts</h1>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <BranchSelector branches={branches} value={base.id} onChange={setBaseId} label="Base" />
        <span className="text-ink-faint">vs</span>
        <BranchSelector branches={branches} value={target.id} onChange={setTargetId} label="Target" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <VideoPreview branch={base} />
        <VideoPreview branch={target} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DiffPanel diff={diff} baseName={base.name} targetName={target.name} />
        <ThreeWayMergePanel
          key={`${base.id}:${target.id}`}
          projectId={projectId}
          ours={base}
          theirs={target}
        />
      </div>
    </div>
  );
}
