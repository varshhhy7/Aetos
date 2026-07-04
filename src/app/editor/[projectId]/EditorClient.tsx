"use client";

import dynamic from "next/dynamic";

// The editor touches window, IndexedDB, OPFS, WebGPU and wasm — must not SSR.
const EditorShell = dynamic(() => import("@oc/editor/editor-shell"), {
	ssr: false,
	loading: () => (
		<div className="flex h-screen w-screen items-center justify-center bg-black text-sm text-neutral-400">
			Loading editor…
		</div>
	),
});

export function EditorClient({ projectId }: { projectId: string }) {
	// `.opencut-root dark` scopes OpenCut's shadcn theme to this subtree only.
	return (
		<div className="opencut-root dark">
			<EditorShell projectId={projectId} />
		</div>
	);
}
