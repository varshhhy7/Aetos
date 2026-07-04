"use client";

import type { Branch } from "@/lib/types";

export function BranchSelector({
  branches,
  value,
  onChange,
  label,
}: {
  branches: Branch[];
  value: string;
  onChange: (branchId: string) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2">
      {label && (
        <span className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-hairline bg-surface-raised px-3 py-1.5 text-sm text-ink focus:border-teal/50 focus:outline-none"
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </label>
  );
}
