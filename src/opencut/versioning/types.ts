import type { SerializedProject } from "@oc/services/storage/types";

// A committed version of the project — a full-fidelity snapshot of the exact
// serialized project record (metadata + scenes + tracks/elements + settings)
// that the editor persists. Media blobs live in OPFS and are referenced by id,
// so they are shared across commits and intentionally NOT copied here (git-LFS
// style): restoring a snapshot re-points at the same media assets.
export type Commit = {
	id: string;
	projectId: string;
	branch: string;
	parentId: string | null;
	message: string;
	author: string;
	createdAt: string; // ISO
	// Cheap, precomputed summary so the history timeline can render without
	// walking every snapshot's scene graph.
	stats: CommitStats;
	snapshot: SerializedProject;
};

export type CommitStats = {
	scenes: number;
	elements: number;
	durationSeconds: number;
};

// One project's entire version history. Persisted as a single IndexedDB record
// keyed by projectId. Branches are pointers (name -> head commit id), exactly
// like git refs over a single working tree — checking one out loads its head
// snapshot into the live project.
export type VersionHistory = {
	projectId: string;
	commits: Commit[];
	branches: string[];
	currentBranch: string;
	headByBranch: Record<string, string | null>;
};

export const DEFAULT_BRANCH = "main";

export function emptyHistory({
	projectId,
}: {
	projectId: string;
}): VersionHistory {
	return {
		projectId,
		commits: [],
		branches: [DEFAULT_BRANCH],
		currentBranch: DEFAULT_BRANCH,
		headByBranch: { [DEFAULT_BRANCH]: null },
	};
}
