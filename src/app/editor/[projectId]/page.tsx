import { EditorClient } from "./EditorClient";

// Standalone embedded OpenCut editor. The project id self-bootstraps: if it
// isn't in IndexedDB yet, EditorProvider creates a fresh project.
export default async function EditorPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	const { projectId } = await params;
	return <EditorClient projectId={projectId} />;
}
