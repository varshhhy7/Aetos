"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAetosStore } from "@/lib/store";
import { BranchRibbon } from "@/components/BranchRibbon";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/Timeline";
import { MemoryPanel } from "@/components/MemoryPanel";
import { EtherealShadow } from "@/components/ui/etheral-shadow";

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

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isArenaRunning, setIsArenaRunning] = useState(false);

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

  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("branch");
    if (fromQuery && branches.some((b) => b.id === fromQuery)) {
      setCurrentBranchId(fromQuery);
    } else if (!currentBranchId && branches.length > 0) {
      setCurrentBranchId(branches[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, searchParams]);

  const currentBranch = branches.find((b) => b.id === currentBranchId) ?? branches[0];

  function handleCreate() {
    const name = newName.trim() || `New Cut ${branches.length + 1}`;
    const newBranch = createBranch(projectId, currentBranch.id, name);
    setNewName("");
    setCreating(false);
    setCurrentBranchId(newBranch.id);
  }

  const handleRunArena = () => {
    setIsArenaRunning(true);
    setTimeout(() => {
      const newBranch = createBranch(projectId, currentBranch.id, "VideoAgent Viral Cut");
      setIsArenaRunning(false);
      setCurrentBranchId(newBranch.id);
    }, 1500);
  };

  if (!project || !currentBranch) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-ink-dim">Project not found.</div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-53px)] w-full bg-[#050505] text-zinc-300 font-sans select-none overflow-hidden relative">
      
      {/* COLUMN A: Left Sidebar (Project Media / Branch Explorer) */}
      <aside className="w-64 border-r border-[#1c1b19] bg-[#0c0b0b] flex flex-col p-4 text-[11px] gap-6 shrink-0 z-10 relative overflow-y-auto">
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-zinc-500 font-mono uppercase tracking-wider text-[10px]">Project Media Pool</span>
            <button className="text-[#a855f7] font-semibold hover:underline">+ Add</button>
          </div>
          
          <div className="space-y-2 bg-black/30 p-2 rounded-xl border border-hairline/40">
            <div className="flex items-center gap-2.5 p-1.5 rounded-lg border border-transparent hover:bg-zinc-900/30 cursor-pointer">
              <div className="h-8 w-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[12px] font-semibold text-[#f2a94e] shrink-0">📹</div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-medium truncate text-[11px]">hook_clip_social_fast.mov</span>
                <span className="text-[9px] text-zinc-500 font-mono">00:15 · 1920x1080</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 p-1.5 rounded-lg border border-transparent hover:bg-zinc-900/30 cursor-pointer">
              <div className="h-8 w-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[12px] font-semibold text-[#f2a94e] shrink-0">📹</div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-medium truncate text-[11px]">main_launch_walkthrough.mp4</span>
                <span className="text-[9px] text-zinc-500 font-mono">02:35 · 1920x1080</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 p-1.5 rounded-lg border border-transparent hover:bg-zinc-900/30 cursor-pointer">
              <div className="h-8 w-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[12px] font-semibold text-[#f2a94e] shrink-0">📹</div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-medium truncate text-[11px]">cta_preschool_outlines.mov</span>
                <span className="text-[9px] text-zinc-500 font-mono">00:20 · 1920x1080</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 p-1.5 rounded-lg border border-transparent hover:bg-zinc-900/30 cursor-pointer">
              <div className="h-8 w-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[12px] font-semibold text-[#a855f7] shrink-0">🎵</div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-medium truncate text-[11px]">ambient_bass_hype.wav</span>
                <span className="text-[9px] text-zinc-500 font-mono">03:12 · 48kHz</span>
              </div>
            </div>
          </div>
        </div>

        {/* VideoAgent Arena Section */}
        <div className="border border-[#7c3aed]/20 bg-gradient-to-br from-[#7c3aed]/5 to-[#a855f7]/5 rounded-xl p-4 space-y-3 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#7c3aed]/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-white font-bold text-[11px]">
            <span className="uppercase tracking-wider">VideoAgent Arena</span>
            <span className="text-[13px] text-[#a855f7]">✦</span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-normal font-sans">
            Generate Viral, Premium, Story, and Brand-Safe branches from this cut.
          </p>
          <button 
            type="button"
            onClick={handleRunArena}
            disabled={isArenaRunning}
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-2 px-3 rounded-lg transition-colors text-center text-[11px] disabled:opacity-50"
          >
            {isArenaRunning ? "Running Arena..." : "Run VideoAgent arena →"}
          </button>
        </div>

        {/* Cuts & Branches Tree */}
        <div className="flex flex-col min-h-0 flex-grow">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-zinc-500 font-mono uppercase tracking-wider text-[10px]">Cuts & Branches</span>
            <button 
              type="button"
              onClick={() => setCreating(!creating)}
              className="text-[#a855f7] font-semibold hover:underline"
            >
              + New cut
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
                className="flex-1 rounded border border-[#2c2a27] bg-[#0c0b0b] px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreate}
                className="rounded bg-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Create
              </button>
            </div>
          )}

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {branches.map((b) => {
              const isCurrent = b.id === currentBranch.id;
              return (
                <div 
                  key={b.id}
                  onClick={() => setCurrentBranchId(b.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isCurrent 
                      ? 'border-[#f2a94e]/30 bg-[#f2a94e]/5 text-white' 
                      : 'border-[#1c1b19] bg-[#0c0b0b]/60 text-zinc-400 hover:bg-[#1c1b19]/40 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <span className="font-semibold truncate text-[11px] text-white">{b.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">by {b.createdBy}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      b.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : b.status === "merged" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {b.status === "approved" ? "Approved" : b.status === "merged" ? "Merged" : "Draft"}
                    </span>
                    {b.id !== currentBranch.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/project/${projectId}/compare?base=${currentBranch.id}&target=${b.id}`);
                        }}
                        className="text-zinc-500 hover:text-white font-mono text-[9px] underline"
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

        {/* Footer info inside sidebar */}
        <div className="border-t border-[#1c1b19] pt-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-zinc-500 font-mono text-[10px]">Team Notes</span>
            <span className="text-[10px] bg-[#7c3aed]/20 text-[#a855f7] px-2 py-0.5 rounded-full font-mono font-bold">12</span>
          </div>
          
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1">
            <span>ACTIVITY FEED</span>
            <select className="bg-transparent border-0 text-zinc-400 cursor-pointer focus:outline-none">
              <option>All</option>
            </select>
          </div>
        </div>
      </aside>

      {/* COLUMN B: Center Monitor & Timeline Panel */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#121110] relative z-10">
        <div className="absolute top-0 left-1/4 -translate-x-1/2 pointer-events-none z-0">
          <EtherealShadow color="rgba(242, 169, 78, 0.02)" style={{ height: "350px", width: "550px", filter: "blur(100px)" }} />
        </div>

        {/* Monitor Viewport */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <div className="px-6 py-3 border-b border-[#1c1b19] flex items-center justify-between text-xs bg-black/25">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                currentBranch.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                {currentBranch.status}
              </span>
              <span className="text-white font-semibold text-sm">{currentBranch.name}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 font-mono">01 • VIDEO</span>
              <button className="text-zinc-500 hover:text-white">•••</button>
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center p-6 min-h-0">
            <div className="w-full max-w-[800px] aspect-video border border-[#1c1b19] bg-black rounded-2xl overflow-hidden shadow-2xl relative">
              <VideoPreview branch={currentBranch} />
            </div>
          </div>
        </div>

        {/* Editor Timeline */}
        <div className="h-64 border-t border-[#1c1b19] bg-[#0c0b0b] p-4 flex flex-col gap-3 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="uppercase tracking-wider">Editor Timeline</span>
            <span>{currentBranch.timeline.duration}s total duration</span>
          </div>
          <div className="flex-grow overflow-x-auto">
            <Timeline branch={currentBranch} />
          </div>
        </div>

        {/* BOTTOM WORKSPACE TRAY (Activity Rows) */}
        <div className="h-16 border-t border-[#1c1b19] bg-[#0c0b0b] px-4 flex items-center justify-between text-[11px] text-zinc-400 shrink-0 z-10">
          <div className="flex flex-1 items-center gap-6 overflow-x-auto py-1 pr-4">
            <div className="flex items-center gap-2 bg-zinc-950/40 border border-[#1c1b19] px-3 py-1.5 rounded-lg shrink-0">
              <span className="text-xs">🤖</span>
              <div className="flex flex-col">
                <span className="font-bold text-white text-[10px] flex items-center gap-1.5">
                  VideoAgent <span className="bg-[#7c3aed]/10 text-[#a855f7] text-[7px] px-1 rounded uppercase font-mono">system</span>
                </span>
                <span className="text-[9px] text-zinc-500 truncate">Generated 4 cuts from Main Cut. 2m ago</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950/40 border border-[#1c1b19] px-3 py-1.5 rounded-lg shrink-0">
              <span className="text-xs">👩‍🎨</span>
              <div className="flex flex-col">
                <span className="font-bold text-white text-[10px] flex items-center gap-1.5">
                  Riya <span className="bg-zinc-800 text-zinc-400 text-[7px] px-1 rounded uppercase font-mono">comment</span>
                </span>
                <span className="text-[9px] text-zinc-500 truncate">Love the hook! This version feels punchy. 8m ago</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950/40 border border-[#1c1b19] px-3 py-1.5 rounded-lg shrink-0">
              <span className="text-xs">👨‍💼</span>
              <div className="flex flex-col">
                <span className="font-bold text-white text-[10px] flex items-center gap-1.5">
                  Zane <span className="bg-zinc-800 text-zinc-400 text-[7px] px-1 rounded uppercase font-mono">comment</span>
                </span>
                <span className="text-[9px] text-zinc-500 truncate">Try placing the CTA 3s earlier. 12m ago</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950/40 border border-[#1c1b19] px-3 py-1.5 rounded-lg shrink-0">
              <span className="text-xs">👩‍💻</span>
              <div className="flex flex-col">
                <span className="font-bold text-white text-[10px] flex items-center gap-1.5">
                  Priya <span className="bg-[#f2a94e]/10 text-[#f2a94e] text-[7px] px-1 rounded uppercase font-mono">merge</span>
                </span>
                <span className="text-[9px] text-zinc-500 truncate">Merged Hook from Viral Cut. 20m ago</span>
              </div>
            </div>
          </div>

          <button 
            type="button"
            className="text-[#a855f7] hover:underline font-mono text-[10px] font-semibold shrink-0"
          >
            View all activity →
          </button>
        </div>
      </main>

      {/* COLUMN C: Right Sidebar (AI Suggestions & Style Memory) */}
      <aside className="w-80 border-l border-[#1c1b19] bg-[#0c0b0b] flex flex-col overflow-y-auto shrink-0 z-10 relative p-4">
        {memory && <MemoryPanel projectId={projectId} branch={currentBranch} memory={memory} />}
      </aside>

    </div>
  );
}
