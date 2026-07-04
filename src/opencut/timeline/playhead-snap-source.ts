import type { SnapPoint } from "@oc/timeline/snapping";
import type { MediaTime } from "@oc/wasm";

export function getPlayheadSnapPoints({
	playheadTime,
}: {
	playheadTime: MediaTime;
}): SnapPoint[] {
	return [{ time: playheadTime, type: "playhead" }];
}
