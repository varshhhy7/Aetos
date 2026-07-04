"use client";

import { useEffect, useState } from "react";
import {
	GitBranch,
	GitCommitHorizontal,
	History,
	Plus,
	RotateCcw,
	Check,
	Clock,
	Film,
	Layers,
} from "lucide-react";
import { Button } from "@oc/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetTrigger,
} from "@oc/components/ui/sheet";
import { ScrollArea } from "@oc/components/ui/scroll-area";
import { Textarea } from "@oc/components/ui/textarea";
import { Input } from "@oc/components/ui/input";
import { Badge } from "@oc/components/ui/badge";
import { Separator } from "@oc/components/ui/separator";
import { cn } from "@oc/utils/ui";
import { useEditor } from "@oc/editor/use-editor";
import { toast } from "sonner";
import { useVersionStore } from "../version-store";
import type { Commit } from "../types";

function relativeTime(iso: string): string {
	const then = new Date(iso).getTime();
	const seconds = Math.round((Date.now() - then) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(iso).toLocaleDateString();
}

function formatDuration(seconds: number): string {
	const total = Math.max(0, Math.round(seconds));
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VersionControl() {
	const activeProject = useEditor((e) => e.project.getActiveOrNull());
	const projectId = activeProject?.metadata.id ?? null;
	const load = useVersionStore((s) => s.load);
	const history = useVersionStore((s) => s.history);

	useEffect(() => {
		if (projectId) load({ projectId });
	}, [projectId, load]);

	const currentBranch = history?.currentBranch ?? "main";
	const commitCount = history?.commits.length ?? 0;

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-1.5">
					<GitBranch className="size-4" />
					<span className="max-w-[8rem] truncate">{currentBranch}</span>
					{commitCount > 0 && (
						<Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-[10px]">
							{commitCount}
						</Badge>
					)}
				</Button>
			</SheetTrigger>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
			>
				<SheetHeader className="space-y-1 border-b p-4 text-left">
					<SheetTitle className="flex items-center gap-2">
						<History className="size-5" />
						Version history
					</SheetTitle>
					<SheetDescription>
						Save named versions of your edit and restore any of them. Media is
						shared, so snapshots are lightweight.
					</SheetDescription>
				</SheetHeader>

				<BranchBar />
				<CommitForm />
				<Separator />
				<CommitList />
			</SheetContent>
		</Sheet>
	);
}

function BranchBar() {
	const history = useVersionStore((s) => s.history);
	const busy = useVersionStore((s) => s.busy);
	const checkoutBranch = useVersionStore((s) => s.checkoutBranch);
	const createBranch = useVersionStore((s) => s.createBranch);
	const [adding, setAdding] = useState(false);
	const [name, setName] = useState("");

	if (!history) return null;

	const submit = async () => {
		const trimmed = name.trim();
		if (!trimmed) return;
		await createBranch({ name: trimmed });
		setName("");
		setAdding(false);
	};

	return (
		<div className="flex flex-wrap items-center gap-1.5 p-3">
			{history.branches.map((branch) => {
				const active = branch === history.currentBranch;
				return (
					<Button
						key={branch}
						variant={active ? "secondary" : "ghost"}
						size="sm"
						disabled={busy}
						onClick={() => checkoutBranch({ name: branch })}
						className={cn("h-7 gap-1.5", active && "ring-1 ring-ring")}
					>
						<GitBranch className="size-3.5" />
						{branch}
					</Button>
				);
			})}
			{adding ? (
				<div className="flex items-center gap-1">
					<Input
						autoFocus
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") submit();
							if (e.key === "Escape") {
								setAdding(false);
								setName("");
							}
						}}
						placeholder="branch name"
						className="h-7 w-32 text-sm"
					/>
					<Button size="sm" className="h-7" disabled={busy} onClick={submit}>
						<Check className="size-3.5" />
					</Button>
				</div>
			) : (
				<Button
					variant="ghost"
					size="sm"
					className="h-7 gap-1 text-muted-foreground"
					disabled={busy}
					onClick={() => setAdding(true)}
				>
					<Plus className="size-3.5" />
					Branch
				</Button>
			)}
		</div>
	);
}

function CommitForm() {
	const commit = useVersionStore((s) => s.commit);
	const busy = useVersionStore((s) => s.busy);
	const error = useVersionStore((s) => s.error);
	const [message, setMessage] = useState("");

	const save = async () => {
		const result = await commit({ message });
		if (result) {
			setMessage("");
			toast.success("Version saved", { description: result.message });
		}
	};

	return (
		<div className="space-y-2 p-3">
			<Textarea
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				onKeyDown={(e) => {
					if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
				}}
				placeholder="Describe this version — e.g. 'tighter intro, added captions'"
				rows={2}
				className="resize-none text-sm"
			/>
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground">⌘⏎ to save</span>
				<Button size="sm" disabled={busy} onClick={save} className="gap-1.5">
					<GitCommitHorizontal className="size-4" />
					{busy ? "Saving…" : "Save version"}
				</Button>
			</div>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}

function CommitList() {
	const history = useVersionStore((s) => s.history);
	if (!history) return null;

	const branchHead = history.headByBranch[history.currentBranch] ?? null;
	// Commits on the current branch, newest first.
	const commits = history.commits
		.filter((c) => c.branch === history.currentBranch)
		.slice()
		.reverse();

	if (commits.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
				<GitCommitHorizontal className="size-8 opacity-40" />
				<p className="text-sm">No versions on this branch yet.</p>
				<p className="text-xs">
					Make an edit, then save your first version above.
				</p>
			</div>
		);
	}

	return (
		<ScrollArea className="flex-1">
			<ol className="p-3">
				{commits.map((commit, index) => (
					<CommitRow
						key={commit.id}
						commit={commit}
						isHead={commit.id === branchHead}
						isLast={index === commits.length - 1}
					/>
				))}
			</ol>
		</ScrollArea>
	);
}

function CommitRow({
	commit,
	isHead,
	isLast,
}: {
	commit: Commit;
	isHead: boolean;
	isLast: boolean;
}) {
	const restore = useVersionStore((s) => s.restore);
	const busy = useVersionStore((s) => s.busy);

	const onRestore = async () => {
		const ok = window.confirm(
			`Restore "${commit.message}"?\n\nThis replaces your current timeline with this version. Save your current work as a version first if you want to keep it.`,
		);
		if (!ok) return;
		await restore({ commitId: commit.id });
		toast.success("Version restored", { description: commit.message });
	};

	return (
		<li className="relative flex gap-3 pb-4">
			{/* graph rail */}
			<div className="flex flex-col items-center">
				<span
					className={cn(
						"mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
						isHead
							? "border-primary bg-primary"
							: "border-muted-foreground/40 bg-background",
					)}
				/>
				{!isLast && <span className="w-px flex-1 bg-border" />}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-2">
					<p className="text-sm font-medium leading-snug break-words">
						{commit.message}
					</p>
					{isHead ? (
						<Badge variant="secondary" className="shrink-0 gap-1 px-1.5 py-0 text-[10px]">
							<Check className="size-3" />
							current
						</Badge>
					) : (
						<Button
							variant="ghost"
							size="sm"
							disabled={busy}
							onClick={onRestore}
							className="h-6 shrink-0 gap-1 px-2 text-xs"
						>
							<RotateCcw className="size-3" />
							Restore
						</Button>
					)}
				</div>
				<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
					<span>{commit.author}</span>
					<span className="inline-flex items-center gap-1">
						<Clock className="size-3" />
						{relativeTime(commit.createdAt)}
					</span>
					<span className="inline-flex items-center gap-1">
						<Film className="size-3" />
						{commit.stats.scenes} scene{commit.stats.scenes === 1 ? "" : "s"}
					</span>
					<span className="inline-flex items-center gap-1">
						<Layers className="size-3" />
						{commit.stats.elements} clip{commit.stats.elements === 1 ? "" : "s"}
					</span>
					<span>{formatDuration(commit.stats.durationSeconds)}</span>
				</div>
			</div>
		</li>
	);
}
