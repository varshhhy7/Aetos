"use client";

// Adapted from OpenCut's app/editor/[project_id]/page.tsx: takes `projectId` as
// a prop (instead of useParams) and drops the marketing ChangelogNotification.
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@oc/components/ui/resizable";
import { AssetsPanel } from "@oc/components/editor/panels/assets";
import { PropertiesPanel } from "@oc/components/editor/panels/properties";
import { Timeline } from "@oc/timeline/components";
import { PreviewPanel } from "@oc/preview/components";
import { EditorHeader } from "@oc/components/editor/editor-header";
import { EditorProvider } from "@oc/components/providers/editor-provider";
import { Onboarding } from "@oc/components/editor/onboarding";
import { MigrationDialog } from "@oc/project/components/migration-dialog";
import { usePanelStore } from "@oc/editor/panel-store";
import { usePasteMedia } from "@oc/media/use-paste-media";
import { MobileGate } from "@oc/components/editor/mobile-gate";
import { TooltipProvider } from "@oc/components/ui/tooltip";
import { Toaster } from "@oc/components/ui/sonner";
import { useMemo } from "react";
import { useEditor } from "@oc/editor/use-editor";
import {
	createPreviewOverlayControl,
	isPreviewOverlayVisible,
	mergePreviewOverlaySources,
} from "@oc/preview/overlays";
import { usePreviewStore } from "@oc/preview/preview-store";
import { getGuidePreviewOverlaySource } from "@oc/guides";
import {
	bookmarkNotesPreviewOverlay,
	getBookmarkPreviewOverlaySource,
} from "@oc/timeline/bookmarks/index";

export default function EditorShell({ projectId }: { projectId: string }) {
	// TooltipProvider + Toaster came from OpenCut's root layout (dropped here);
	// the editor's panels rely on a global TooltipProvider being present.
	return (
		<MobileGate>
			<TooltipProvider>
				<EditorProvider projectId={projectId}>
					<div className="bg-background flex h-screen w-screen flex-col overflow-hidden">
						<EditorHeader />
						<div className="min-h-0 min-w-0 flex-1">
							<EditorLayout />
						</div>
						<Onboarding />
						<MigrationDialog />
					</div>
				</EditorProvider>
				<Toaster />
			</TooltipProvider>
		</MobileGate>
	);
}

function EditorLayout() {
	usePasteMedia();
	const { panels, setPanel } = usePanelStore();
	const activeScene = useEditor((editor) =>
		editor.scenes.getActiveSceneOrNull(),
	);
	const currentTime = useEditor((editor) => editor.playback.getCurrentTime());
	const activeGuide = usePreviewStore((state) => state.activeGuide);
	const overlays = usePreviewStore((state) => state.overlays);
	const setOverlayVisibility = usePreviewStore(
		(state) => state.setOverlayVisibility,
	);
	const showBookmarkNotes = isPreviewOverlayVisible({
		overlay: bookmarkNotesPreviewOverlay,
		overlays,
	});

	const overlaySource = useMemo(
		() =>
			mergePreviewOverlaySources({
				sources: [
					getGuidePreviewOverlaySource({
						guideId: activeGuide,
					}),
					activeScene
						? getBookmarkPreviewOverlaySource({
								bookmarks: activeScene.bookmarks,
								time: currentTime,
								isVisible: showBookmarkNotes,
							})
						: {
								definitions: [bookmarkNotesPreviewOverlay],
								instances: [],
							},
				],
			}),
		[activeGuide, activeScene, currentTime, showBookmarkNotes],
	);

	const overlayControls = useMemo(
		() =>
			overlaySource.definitions.map((overlay) =>
				createPreviewOverlayControl({ overlay, overlays }),
			),
		[overlaySource.definitions, overlays],
	);

	return (
		<ResizablePanelGroup
			direction="vertical"
			className="size-full gap-[0.18rem]"
			onLayout={(sizes) => {
				setPanel({
					panel: "mainContent",
					size: sizes[0] ?? panels.mainContent,
				});
				setPanel({
					panel: "timeline",
					size: sizes[1] ?? panels.timeline,
				});
			}}
		>
			<ResizablePanel
				defaultSize={panels.mainContent}
				minSize={30}
				maxSize={85}
				className="min-h-0"
			>
				<ResizablePanelGroup
					direction="horizontal"
					className="size-full gap-[0.19rem] px-3"
					onLayout={(sizes) => {
						setPanel({ panel: "tools", size: sizes[0] ?? panels.tools });
						setPanel({ panel: "preview", size: sizes[1] ?? panels.preview });
						setPanel({
							panel: "properties",
							size: sizes[2] ?? panels.properties,
						});
					}}
				>
					<ResizablePanel
						defaultSize={panels.tools}
						minSize={15}
						maxSize={40}
						className="min-w-0"
					>
						<AssetsPanel />
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel
						defaultSize={panels.preview}
						minSize={30}
						className="min-h-0 min-w-0 flex-1"
					>
						<PreviewPanel
							overlayControls={overlayControls}
							overlayInstances={overlaySource.instances}
							onOverlayVisibilityChange={setOverlayVisibility}
						/>
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel
						defaultSize={panels.properties}
						minSize={15}
						maxSize={40}
						className="min-w-0"
					>
						<PropertiesPanel />
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>

			<ResizableHandle withHandle />

			<ResizablePanel
				defaultSize={panels.timeline}
				minSize={15}
				maxSize={70}
				className="min-h-0 px-3 pb-3"
			>
				<Timeline />
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
