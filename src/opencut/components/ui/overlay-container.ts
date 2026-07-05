"use client";

// OpenCut's theme variables (--background, --popover, --border, …) are scoped to
// the `.opencut-root` element (see opencut-theme.css) so they never clobber
// Aetos's own tokens. Radix overlays, however, portal to `document.body` by
// default — outside that scope — so utilities like `bg-background` resolve to an
// undefined variable and the overlay renders transparent (editor content bleeds
// through it). Portaling into `.opencut-root` keeps overlays inside the themed
// subtree. `.opencut-root` establishes no transform/filter containing block, so
// `fixed`/absolute positioning still resolves against the viewport as before.
export function getOverlayContainer(): HTMLElement | undefined {
	if (typeof document === "undefined") return undefined;
	return (
		(document.querySelector(".opencut-root") as HTMLElement | null) ?? undefined
	);
}
