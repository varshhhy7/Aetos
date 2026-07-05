"use client";

import { Player } from "@remotion/player";
import type { Branch } from "@/lib/types";
import { BranchComposition } from "@/remotion/BranchComposition";
import { Tag } from "./ui/Badge";
import { StatusBadge } from "./ui/Badge";

const FPS = 30;

export function VideoPreview({ branch }: { branch: Branch }) {
  const { timeline } = branch;
  const hook = timeline.clips.find((c) => c.id === "clip_hook");
  const cta = timeline.clips.find((c) => c.id === "clip_cta");

  return (
    <div className="hud-frame overflow-hidden rounded-none">
      <span className="hud-corner tl" />
      <span className="hud-corner tr" />
      <span className="hud-corner bl" />
      <span className="hud-corner br" />

      <div className="relative aspect-video w-full">
        <Player
          key={branch.id}
          component={BranchComposition}
          inputProps={{ timeline }}
          durationInFrames={Math.max(1, Math.round(timeline.duration * FPS))}
          fps={FPS}
          compositionWidth={1280}
          compositionHeight={720}
          style={{ width: "100%", height: "100%" }}
          controls
          autoPlay={true}
          loop
        />

        <div className="pointer-events-none absolute left-4 top-4">
          <StatusBadge status={branch.status} />
        </div>
        <div className="pointer-events-none absolute right-4 top-4">
          <span className="rounded-full border border-hairline bg-void/70 px-3 py-1 text-xs font-medium text-ink">
            {branch.name}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-hairline p-4">
        <Tag>{timeline.globalStyle.pacing} pacing</Tag>
        <Tag>{timeline.captions.style.replace(/_/g, " ")}</Tag>
        <Tag>{timeline.audio.musicMood} music</Tag>
        <Tag>{timeline.globalStyle.colorGrade.replace(/_/g, " ")} grade</Tag>
        {hook && <Tag>hook {hook.end - hook.start}s</Tag>}
        {cta && <Tag>CTA at {cta.start}s</Tag>}
      </div>
    </div>
  );
}
