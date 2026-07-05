"use client";

import { create } from "zustand";
import { applyMemoryToTimeline, extractMemoryFromApprovedBranch } from "./memory-engine";
import {
  PROJECT_ID,
  seedActivity,
  seedBranches,
  seedComments,
  seedProject,
  seedTeamMemory,
} from "./seed-data";
import type {
  ActivityEvent,
  Branch,
  Comment,
  Project,
  TeamMemory,
  Timeline,
} from "./types";

export const CURRENT_USER = "You";

export const FAKE_COLLABORATORS = [
  { name: "Mani", role: "Editor", color: "#f97316" },
  { name: "Riya", role: "Designer", color: "#a855f7" },
  { name: "Zane", role: "Founder", color: "#22d3ee" },
  { name: "Priya", role: "Client", color: "#34d399" },
];

type AetosState = {
  projects: Project[];
  branches: Branch[];
  comments: Comment[];
  memory: Record<string, TeamMemory>; // keyed by projectId, scope="team"
  activity: ActivityEvent[];

  getProject: (projectId: string) => Project | undefined;
  getBranches: (projectId: string) => Branch[];
  getBranch: (branchId: string) => Branch | undefined;
  getComments: (branchId: string) => Comment[];
  getMemory: (projectId: string) => TeamMemory | undefined;
  getActivity: (projectId: string) => ActivityEvent[];

  createBranch: (projectId: string, sourceBranchId: string, name: string) => Branch;
  createAgentBranch: (
    projectId: string,
    sourceBranchId: string,
    name: string,
    timeline: Timeline,
    options?: { createdBy?: string; verifierScore?: number; summary?: string },
  ) => Branch;
  addComment: (
    projectId: string,
    branchId: string,
    body: string,
    options?: { clipId?: string; timestampSeconds?: number; author?: string },
  ) => void;
  // Persist a resolved three-way merge (see three-way-merge.ts) as a new branch.
  saveMergedBranch: (
    projectId: string,
    oursBranchId: string,
    theirsBranchId: string,
    mergedTimeline: Timeline,
    name: string,
  ) => Branch;
  approveBranch: (projectId: string, branchId: string) => void;
  applyMemoryToBranch: (projectId: string, branchId: string) => Branch;
  updateClip: (
    branchId: string,
    clipId: string,
    fields: Partial<Pick<Branch["timeline"]["clips"][number], "caption" | "transition" | "notes">>,
  ) => void;
  logActivity: (event: Omit<ActivityEvent, "id" | "createdAt">) => void;
};

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAetosStore = create<AetosState>((set, get) => ({
  projects: [seedProject],
  branches: seedBranches,
  comments: seedComments,
  memory: { [PROJECT_ID]: seedTeamMemory },
  activity: seedActivity,

  getProject: (projectId) => get().projects.find((p) => p.id === projectId),
  getBranches: (projectId) => get().branches.filter((b) => b.projectId === projectId),
  getBranch: (branchId) => get().branches.find((b) => b.id === branchId),
  getComments: (branchId) => get().comments.filter((c) => c.branchId === branchId),
  getMemory: (projectId) => get().memory[projectId],
  getActivity: (projectId) =>
    get()
      .activity.filter((a) => a.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  logActivity: (event) => {
    const entry: ActivityEvent = {
      ...event,
      id: makeId("activity"),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ activity: [...state.activity, entry] }));
  },

  createBranch: (projectId, sourceBranchId, name) => {
    const source = get().getBranch(sourceBranchId);
    if (!source) throw new Error("Source branch not found");
    const now = new Date().toISOString();
    const branch: Branch = {
      id: makeId("branch"),
      projectId,
      name,
      parentBranchId: source.id,
      status: "draft",
      timeline: JSON.parse(JSON.stringify(source.timeline)),
      createdBy: CURRENT_USER,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ branches: [...state.branches, branch] }));
    get().logActivity({
      projectId,
      branchId: branch.id,
      actor: CURRENT_USER,
      eventType: "branch_created",
      message: `${CURRENT_USER} created ${branch.name}`,
    });
    return branch;
  },

  createAgentBranch: (projectId, sourceBranchId, name, timeline, options) => {
    const source = get().getBranch(sourceBranchId);
    if (!source) throw new Error("Source branch not found");
    const now = new Date().toISOString();
    const createdBy = options?.createdBy ?? "VideoAgent";
    const branch: Branch = {
      id: makeId("branch"),
      projectId,
      name,
      parentBranchId: source.id,
      status: "draft",
      timeline: JSON.parse(JSON.stringify(timeline)) as Timeline,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ branches: [...state.branches, branch] }));
    get().logActivity({
      projectId,
      branchId: branch.id,
      actor: createdBy,
      eventType: "branch_created",
      message: `${createdBy} generated ${branch.name}${
        options?.verifierScore ? ` with verifier score ${options.verifierScore}/100` : ""
      }`,
    });
    if (options?.summary) {
      get().addComment(projectId, branch.id, options.summary, {
        author: createdBy,
      });
    }
    return branch;
  },

  addComment: (projectId, branchId, body, options) => {
    const comment: Comment = {
      id: makeId("comment"),
      projectId,
      branchId,
      clipId: options?.clipId,
      timestampSeconds: options?.timestampSeconds,
      author: options?.author ?? CURRENT_USER,
      body,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ comments: [...state.comments, comment] }));
    const branch = get().getBranch(branchId);
    get().logActivity({
      projectId,
      branchId,
      actor: comment.author,
      eventType: "comment_added",
      message: `${comment.author} commented on ${branch?.name ?? "a branch"}`,
    });
  },

  saveMergedBranch: (projectId, oursBranchId, theirsBranchId, mergedTimeline, name) => {
    const ours = get().getBranch(oursBranchId);
    const theirs = get().getBranch(theirsBranchId);
    if (!ours || !theirs) throw new Error("Branch not found");
    const now = new Date().toISOString();
    const branch: Branch = {
      id: makeId("branch"),
      projectId,
      name,
      parentBranchId: ours.id,
      status: "draft",
      timeline: mergedTimeline,
      createdBy: CURRENT_USER,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ branches: [...state.branches, branch] }));
    get().logActivity({
      projectId,
      branchId: branch.id,
      actor: CURRENT_USER,
      eventType: "branch_merged",
      message: `${CURRENT_USER} merged ${theirs.name} into ${ours.name} → ${name}`,
    });
    return branch;
  },

  approveBranch: (projectId, branchId) => {
    const branch = get().getBranch(branchId);
    if (!branch) throw new Error("Branch not found");

    set((state) => ({
      branches: state.branches.map((b) =>
        b.id === branchId
          ? { ...b, status: "approved", updatedAt: new Date().toISOString() }
          : b,
      ),
    }));
    get().logActivity({
      projectId,
      branchId,
      actor: CURRENT_USER,
      eventType: "branch_approved",
      message: `${CURRENT_USER} approved ${branch.name}`,
    });

    const existingMemory = get().getMemory(projectId);
    const updatedMemory = extractMemoryFromApprovedBranch(branch, existingMemory);
    set((state) => ({
      memory: { ...state.memory, [projectId]: updatedMemory },
    }));
    get().logActivity({
      projectId,
      branchId,
      actor: "Aetos",
      eventType: "memory_updated",
      message: `Aetos updated team memory from ${branch.name}`,
    });
  },

  updateClip: (branchId, clipId, fields) => {
    set((state) => ({
      branches: state.branches.map((b) => {
        if (b.id !== branchId) return b;
        return {
          ...b,
          updatedAt: new Date().toISOString(),
          timeline: {
            ...b.timeline,
            clips: b.timeline.clips.map((clip) =>
              clip.id === clipId ? { ...clip, ...fields } : clip,
            ),
          },
        };
      }),
    }));
  },

  applyMemoryToBranch: (projectId, branchId) => {
    const branch = get().getBranch(branchId);
    const memory = get().getMemory(projectId);
    if (!branch || !memory) throw new Error("Branch or memory not found");

    const timeline = applyMemoryToTimeline(branch, memory);
    const now = new Date().toISOString();
    const newBranch: Branch = {
      id: makeId("branch"),
      projectId,
      name: `${branch.name} - Memory Aligned`,
      parentBranchId: branch.id,
      status: "draft",
      timeline,
      createdBy: "Aetos",
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ branches: [...state.branches, newBranch] }));
    get().logActivity({
      projectId,
      branchId: newBranch.id,
      actor: "Aetos",
      eventType: "branch_created",
      message: `Aetos applied team memory to create ${newBranch.name}`,
    });
    return newBranch;
  },
}));
