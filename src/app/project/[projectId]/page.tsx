"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAetosStore } from "@/lib/store";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/Timeline";
import { MemoryPanel } from "@/components/MemoryPanel";
import { CommentPanel } from "@/components/CommentPanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { EtherealShadow } from "@/components/ui/etheral-shadow";
import type { VideoAgentRunResponse } from "@/lib/videoagent-adapter";

export default function WorkspacePage() {
  const params = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.projectId;

  const allProjects = useAetosStore((s) => s.projects);
  const allBranches = useAetosStore((s) => s.branches);
  const allComments = useAetosStore((s) => s.comments);
  const allActivity = useAetosStore((s) => s.activity);
  const memory = useAetosStore((s) => s.memory[projectId]);
  const createBranch = useAetosStore((s) => s.createBranch);
  const createAgentBranch = useAetosStore((s) => s.createAgentBranch);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  const project = useMemo(() => allProjects.find((p) => p.id === projectId), [allProjects, projectId]);
  const branches = useMemo(
    () => allBranches.filter((b) => b.projectId === projectId),
    [allBranches, projectId],
  );
  const activity = useMemo(
    () =>
      allActivity
        .filter((a) => a.projectId === projectId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allActivity, projectId],
  );

  const requestedBranchId = searchParams.get("branch");
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(requestedBranchId);
  const currentBranch =
    branches.find((b) => b.id === currentBranchId) ??
    branches.find((b) => b.id === requestedBranchId) ??
    branches[0];

  function handleCreate() {
    const name = newName.trim() || `New Cut ${branches.length + 1}`;
    const newBranch = createBranch(projectId, currentBranch.id, name);
    setNewName("");
    setCreating(false);
    setCurrentBranchId(newBranch.id);
  }

  async function handleRunVideoAgent() {
    if (!currentBranch || agentRunning) return;

    setAgentRunning(true);
    setAgentError(null);

    try {
      const response = await fetch("/api/agents/videoagent/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          sourceBranchId: currentBranch.id,
          sourceBranchName: currentBranch.name,
          goal: project?.description ?? "Create a strong launch video for social and investor audiences.",
          strategies: ["viral", "premium", "story", "brand_safe"],
          timeline: currentBranch.timeline,
        }),
      });

      if (!response.ok) {
        throw new Error("VideoAgent adapter failed to generate branch plans.");
      }

      const data = (await response.json()) as VideoAgentRunResponse;
      const createdBranches = data.plans.map((plan) =>
        createAgentBranch(projectId, currentBranch.id, plan.name, plan.timeline, {
          createdBy: "VideoAgent",
          verifierScore: plan.verifierScore,
          summary: `${plan.summary} Recommendation: ${plan.recommendation}`,
        }),
      );

      if (createdBranches[0]) {
        setCurrentBranchId(createdBranches[0].id);
      }
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : "VideoAgent adapter failed.");
    } finally {
      setAgentRunning(false);
    }
  }

  if (!project || !currentBranch) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-ink-dim">Project not found.</div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-53px)] w-full bg-[#050505] text-zinc-300 font-sans select-none overflow-hidden relative">
      
      {/* COLUMN A: Left Sidebar (Project Media / Branch Explorer) */}
      <aside className="w-64 border-r border-[#1c1b19] bg-[#0c0b0b] flex flex-col p-4 text-[11px] gap-6 shrink-0 z-10 relative">
        <div className="space-y-1">
          <span className="text-zinc-500 font-mono uppercase tracking-wider block mb-2 px-1">Project Media Pool</span>
          <div className="space-y-1 bg-black/30 p-2 rounded-xl border border-hairline/40">
            <div className="flex items-center gap-2 p-1.5 rounded bg-[#f2a94e]/5 border border-[#f2a94e]/10 text-white cursor-pointer">
              <span className="text-[14px]">📹</span>
              <span className="truncate">hook_clip_social_fast.mov</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-900/20 cursor-pointer">
              <span className="text-[14px]">📹</span>
              <span className="truncate">main_launch_walkthrough.mp4</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-900/20 cursor-pointer">
              <span className="text-[14px]">📹</span>
              <span className="truncate">cta_preschool_outlines.mov</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-900/20 cursor-pointer">
              <span className="text-[14px]">🎵</span>
              <span className="truncate">ambient_bass_hype.wav</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#f2a94e]/15 bg-[#f2a94e]/5 p-3 space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#f2a94e]">VideoAgent Adapter</span>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Generate Viral, Premium, Story, and Brand-Safe branches from the current cut.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunVideoAgent}
            disabled={agentRunning}
            className="w-full rounded-lg bg-[#efe9df] px-3 py-2 text-[11px] font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {agentRunning ? "Running VideoAgent..." : "Run VideoAgent arena"}
          </button>
          {agentError && (
            <p className="text-[10px] leading-relaxed text-red-300">{agentError}</p>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-zinc-500 font-mono uppercase tracking-wider block text-[10px]">Cuts & Branches</span>
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="text-[10px] text-teal font-mono hover:underline"
            >
              + new cut
            </button>
          </div>

          {creating && (
            <div className="mb-3 flex gap-2 p-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Cut name..."
                className="flex-1 rounded border border-hairline bg-void/60 px-2 py-1 text-[10px] text-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreate}
                className="rounded bg-teal px-2 py-1 text-[10px] font-medium text-void"
              >
                Create
              </button>
            </div>
          )}

          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            {branches.map((b) => {
              const isCurrent = b.id === currentBranch.id;
              return (
                <div 
                  key={b.id}
                  onClick={() => setCurrentBranchId(b.id)}
                  className={`flex flex-col gap-1 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isCurrent 
                      ? 'border-[#f2a94e]/30 bg-[#f2a94e]/5 text-white shadow-md' 
                      : 'border-hairline bg-black/20 text-zinc-400 hover:bg-zinc-900/20 hover:border-hairline-strong'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate text-[12px]">{b.name}</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded font-mono font-bold ${
                      b.status === "approved" ? "bg-teal/10 text-teal" : b.status === "merged" ? "bg-amber/10 text-amber" : "bg-zinc-900 text-zinc-500"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                    <span>by {b.createdBy}</span>
                    {b.id !== currentBranch.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/project/${projectId}/compare?base=${currentBranch.id}&target=${b.id}`);
                        }}
                        className="text-zinc-400 hover:text-white underline"
                      >
                        Compare
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* COLUMN B: Center Monitor & Timeline Panel */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#121110] relative z-10">
        {/* Ambient atmospheric backdrop */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 pointer-events-none z-0">
          <EtherealShadow color="rgba(242, 169, 78, 0.02)" style={{ height: "350px", width: "550px", filter: "blur(100px)" }} />
        </div>

        {/* Video composition screen */}
        <div className="flex-1 flex items-center justify-center p-6 min-h-0 relative z-10">
          <div className="w-full max-w-[800px] aspect-video border border-[#1c1b19] bg-black rounded-2xl overflow-hidden shadow-2xl relative">
            <VideoPreview branch={currentBranch} />
          </div>
        </div>

        {/* Multi-track Timeline */}
        <div className="h-64 border-t border-[#1c1b19] bg-[#0c0b0b] p-4 flex flex-col gap-3 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="uppercase tracking-wider">Editor Timeline</span>
            <span>{currentBranch.timeline.duration}s total duration</span>
          </div>
          <div className="flex-grow overflow-x-auto">
            <Timeline branch={currentBranch} />
          </div>
        </div>
      </main>

      {/* COLUMN C: Right Sidebar (AI Suggestions & Activity Feed) */}
      <aside className="w-80 border-l border-[#1c1b19] bg-[#0c0b0b] flex flex-col overflow-y-auto shrink-0 z-10 relative">
        {memory && (
          <div className="p-4 border-b border-[#1c1b19]">
            <MemoryPanel projectId={projectId} branch={currentBranch} memory={memory} />
          </div>
        )}
        <div className="p-4 flex flex-col gap-6">
          <div>
            <span className="text-zinc-500 font-mono uppercase tracking-wider block mb-3 text-[10px]">Timeline Comments</span>
            <CommentPanel
              projectId={projectId}
              branchId={currentBranch.id}
              comments={allComments.filter((c) => c.branchId === currentBranch.id)}
            />
          </div>
          <div className="border-t border-[#1c1b19] pt-4">
            <span className="text-zinc-500 font-mono uppercase tracking-wider block mb-3 text-[10px]">Activity Audit Logs</span>
            <ActivityFeed events={activity} />
          </div>
        </div>
      </aside>

    </div>
  );
}
