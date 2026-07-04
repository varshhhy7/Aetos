"use client";

import { create } from "zustand";
import { EditorCore } from "@oc/core";
import { storageService } from "@oc/services/storage/service";
import { IndexedDBAdapter } from "@oc/services/storage/indexeddb-adapter";
import type { SerializedProject } from "@oc/services/storage/types";
import type { SceneTracks } from "@oc/timeline";
import {
	type Commit,
	type CommitStats,
	type VersionHistory,
	DEFAULT_BRANCH,
	emptyHistory,
} from "./types";

// Its own IndexedDB database so version history is independent of (and survives
// alongside) the projects store. Records are keyed by projectId.
const historyAdapter = new IndexedDBAdapter<VersionHistory>({
	dbName: "opencut-versions",
	storeName: "histories",
	version: 1,
});

// The commit author. The editor is embedded in Aetos where the current user is
// "You"; kept as a constant here to avoid coupling @oc to the Aetos store.
const AUTHOR = "You";

function newId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
	if (typeof structuredClone === "function") return structuredClone(value);
	return JSON.parse(JSON.stringify(value));
}

function countSceneElements({ tracks }: { tracks: SceneTracks }): number {
	let count = tracks.main.elements.length;
	for (const track of tracks.overlay) count += track.elements.length;
	for (const track of tracks.audio) count += track.elements.length;
	return count;
}

function summarize({ snapshot }: { snapshot: SerializedProject }): CommitStats {
	let elements = 0;
	for (const scene of snapshot.scenes) {
		elements += countSceneElements({ tracks: scene.tracks });
	}
	return {
		scenes: snapshot.scenes.length,
		elements,
		durationSeconds: snapshot.metadata.duration ?? 0,
	};
}

// Flush the live editor project to storage, then read back the exact serialized
// record so a snapshot is byte-identical to what persists.
async function snapshotWorkingProject({
	projectId,
}: {
	projectId: string;
}): Promise<SerializedProject | null> {
	const editor = EditorCore.getInstance();
	await editor.project.saveCurrentProject();
	return storageService.getSerializedProject({ id: projectId });
}

// Write a snapshot back over the working project record and reload it into the
// live editor. This is the "checkout" — it replaces the current timeline.
async function restoreSnapshot({
	snapshot,
}: {
	snapshot: SerializedProject;
}): Promise<void> {
	const editor = EditorCore.getInstance();
	await storageService.putSerializedProject({ project: clone(snapshot) });
	await editor.project.loadProject({ id: snapshot.metadata.id });
}

type VersionState = {
	projectId: string | null;
	history: VersionHistory | null;
	loading: boolean;
	busy: boolean;
	error: string | null;

	load: (args: { projectId: string }) => Promise<void>;
	commit: (args: { message: string }) => Promise<Commit | null>;
	restore: (args: { commitId: string }) => Promise<void>;
	createBranch: (args: { name: string }) => Promise<void>;
	checkoutBranch: (args: { name: string }) => Promise<void>;
};

async function persist({ history }: { history: VersionHistory }) {
	await historyAdapter.set({ key: history.projectId, value: history });
}

export const useVersionStore = create<VersionState>((set, get) => ({
	projectId: null,
	history: null,
	loading: false,
	busy: false,
	error: null,

	load: async ({ projectId }) => {
		set({ loading: true, error: null, projectId });
		try {
			const stored = await historyAdapter.get(projectId);
			const history = stored?.commits
				? stored
				: emptyHistory({ projectId });
			set({ history, loading: false });
		} catch (err) {
			set({
				loading: false,
				error: err instanceof Error ? err.message : "Failed to load history",
			});
		}
	},

	commit: async ({ message }) => {
		const { history, projectId, busy } = get();
		if (busy || !history || !projectId) return null;
		set({ busy: true, error: null });
		try {
			const snapshot = await snapshotWorkingProject({ projectId });
			if (!snapshot) throw new Error("No project to commit");

			const branch = history.currentBranch;
			const commit: Commit = {
				id: newId(),
				projectId,
				branch,
				parentId: history.headByBranch[branch] ?? null,
				message: message.trim() || "Untitled version",
				author: AUTHOR,
				createdAt: new Date().toISOString(),
				stats: summarize({ snapshot }),
				snapshot: clone(snapshot),
			};

			const next: VersionHistory = {
				...history,
				commits: [...history.commits, commit],
				headByBranch: {
					...history.headByBranch,
					[branch]: commit.id,
				},
			};
			await persist({ history: next });
			set({ history: next, busy: false });
			return commit;
		} catch (err) {
			set({
				busy: false,
				error: err instanceof Error ? err.message : "Failed to save version",
			});
			return null;
		}
	},

	restore: async ({ commitId }) => {
		const { history, busy } = get();
		if (busy || !history) return;
		const commit = history.commits.find((c) => c.id === commitId);
		if (!commit) return;
		set({ busy: true, error: null });
		try {
			await restoreSnapshot({ snapshot: commit.snapshot });
			set({ busy: false });
		} catch (err) {
			set({
				busy: false,
				error: err instanceof Error ? err.message : "Failed to restore version",
			});
		}
	},

	createBranch: async ({ name }) => {
		const { history, busy } = get();
		if (busy || !history) return;
		const trimmed = name.trim();
		if (!trimmed || history.branches.includes(trimmed)) {
			set({ error: "Branch name is empty or already exists" });
			return;
		}
		set({ busy: true, error: null });
		try {
			// Fork from the current branch head; the working tree is untouched, so
			// the new branch starts pointing at the same commit.
			const next: VersionHistory = {
				...history,
				branches: [...history.branches, trimmed],
				currentBranch: trimmed,
				headByBranch: {
					...history.headByBranch,
					[trimmed]: history.headByBranch[history.currentBranch] ?? null,
				},
			};
			await persist({ history: next });
			set({ history: next, busy: false });
		} catch (err) {
			set({
				busy: false,
				error: err instanceof Error ? err.message : "Failed to create branch",
			});
		}
	},

	checkoutBranch: async ({ name }) => {
		const { history, busy } = get();
		if (busy || !history || name === history.currentBranch) return;
		if (!history.branches.includes(name)) return;
		set({ busy: true, error: null });
		try {
			const headId = history.headByBranch[name] ?? null;
			// If the target branch has commits, load its head into the working tree.
			// A branch with no commits yet leaves the current timeline as-is.
			if (headId) {
				const head = history.commits.find((c) => c.id === headId);
				if (head) await restoreSnapshot({ snapshot: head.snapshot });
			}
			const next: VersionHistory = { ...history, currentBranch: name };
			await persist({ history: next });
			set({ history: next, busy: false });
		} catch (err) {
			set({
				busy: false,
				error: err instanceof Error ? err.message : "Failed to switch branch",
			});
		}
	},
}));

export { DEFAULT_BRANCH };
