"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EditorCore } from "@oc/core";
import { useEditor } from "@oc/editor/use-editor";
import { useKeybindingsListener } from "@oc/actions/use-keybindings";
import { useKeybindingsStore } from "@oc/actions/keybindings-store";
import { useTimelineStore } from "@oc/timeline/timeline-store";
import { useEditorActions } from "@oc/actions/use-editor-actions";
import { loadFontAtlas } from "@oc/fonts/google-fonts";
import {
	initializeGpuRenderer,
	isGpuAvailable,
} from "@oc/services/renderer/gpu-renderer";
import { storageService } from "@oc/services/storage/service";

interface EditorProviderProps {
	projectId: string;
	children: React.ReactNode;
}

export function EditorProvider({ projectId, children }: EditorProviderProps) {
	const activeProject = useEditor((e) => e.project.getActiveOrNull());
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { setLoadingProject } = useKeybindingsStore();

	useEffect(() => {
		setLoadingProject(isLoading);
	}, [isLoading, setLoadingProject]);

	useEffect(() => {
		let cancelled = false;
		const editor = EditorCore.getInstance();

		const loadProject = async () => {
			try {
				setIsLoading(true);
				await initializeGpuRenderer();
				editor.renderer.setDegraded(!isGpuAvailable());

				// Self-bootstrap: if this id has no project yet, create one under the
				// SAME id (keeps the /editor/<id> URL stable, no throw, no redirect).
				const existing = await storageService.loadProject({ id: projectId });
				if (cancelled) return;
				if (!existing) {
					await editor.project.createNewProject({
						name: "Untitled Project",
						id: projectId,
					});
					if (cancelled) return;
				}

				await editor.project.loadProject({ id: projectId });
				if (cancelled) return;

				setIsLoading(false);
				loadFontAtlas();
			} catch (err) {
				if (cancelled) return;

				const wasmPanic = (window as Window & { __wasmPanic?: string })
					.__wasmPanic;
				if (wasmPanic) {
					delete (window as Window & { __wasmPanic?: string }).__wasmPanic;
					setError(wasmPanic);
				} else {
					setError(
						err instanceof Error ? err.message : "Failed to load project",
					);
				}
				setIsLoading(false);
			}
		};

		loadProject();

		return () => {
			cancelled = true;
		};
	}, [projectId, router]);

	if (error) {
		return (
			<div className="bg-background flex h-screen w-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<p className="text-destructive text-sm">{error}</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="bg-background flex h-screen w-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="text-muted-foreground size-8 animate-spin" />
					<p className="text-muted-foreground text-sm">Loading project...</p>
				</div>
			</div>
		);
	}

	if (!activeProject) {
		return (
			<div className="bg-background flex h-screen w-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="text-muted-foreground size-8 animate-spin" />
					<p className="text-muted-foreground text-sm">Exiting project...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<EditorRuntimeBindings />
			{children}
		</>
	);
}

function EditorRuntimeBindings() {
	const editor = useEditor();
	const rippleEditingEnabled = useTimelineStore(
		(state) => state.rippleEditingEnabled,
	);

	useEffect(() => {
		editor.command.isRippleEnabled = rippleEditingEnabled;
	}, [editor, rippleEditingEnabled]);

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!editor.save.getIsDirty()) return;
			event.preventDefault();
			(event as unknown as { returnValue: string }).returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [editor]);

	useEditorActions();
	useKeybindingsListener();
	return null;
}
