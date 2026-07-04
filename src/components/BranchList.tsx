"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Branch } from "@/lib/types";
import { useAetosStore } from "@/lib/store";
import { StatusBadge } from "./ui/Badge";

export function BranchList({
  projectId,
  branches,
  currentBranchId,
  onSelect,
}: {
  projectId: string;
  branches: Branch[];
  currentBranchId: string;
  onSelect: (branchId: string) => void;
}) {
  const router = useRouter();
  const createBranch = useAetosStore((s) => s.createBranch);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  function handleCreate() {
    const name = newName.trim() || `New Cut ${branches.length + 1}`;
    const branch = createBranch(projectId, currentBranchId, name);
    setNewName("");
    setCreating(false);
    onSelect(branch.id);
  }

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="gi-display font-display text-sm font-medium text-ink">Cuts</h3>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-medium text-teal transition-colors hover:bg-teal/20"
        >
          + New cut
        </button>
      </div>

      {creating && (
        <div className="mb-3 flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Cut name"
            className="flex-1 rounded-md border border-hairline bg-void/60 px-2 py-1.5 text-xs text-ink focus:border-teal/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-void"
          >
            Create
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {branches.map((branch) => {
          const isCurrent = branch.id === currentBranchId;
          return (
            <div
              key={branch.id}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                isCurrent
                  ? "border-teal/40 bg-teal/[0.06]"
                  : "border-hairline bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => onSelect(branch.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{branch.name}</span>
                </div>
                <span className="text-[11px] text-ink-faint">by {branch.createdBy}</span>
              </button>
              <div className="flex items-center gap-2">
                <StatusBadge status={branch.status} />
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/project/${projectId}/compare?base=${currentBranchId}&target=${branch.id}`,
                    )
                  }
                  disabled={branch.id === currentBranchId}
                  className="rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium text-ink-dim transition-colors hover:border-hairline-strong hover:text-ink disabled:opacity-30"
                >
                  Compare
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
