import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CaptionSettings, GlobalStyle, Timeline, TimelineClip } from "@/lib/types";

const COLOR_GRADE_FILTERS: Record<string, string> = {
  neutral: "none",
  warm: "sepia(0.18) saturate(1.25) contrast(1.05) brightness(1.03)",
  premium_warm: "sepia(0.28) saturate(1.15) contrast(1.12) brightness(0.98)",
};

const MUSIC_ENERGY: Record<string, number> = {
  calm: 0.35,
  confident: 0.6,
  cinematic: 0.7,
  energetic: 1,
};

const CAPTION_STYLES: Record<string, { color: string; weight: number }> = {
  minimal_white: { color: "#f4f4ef", weight: 400 },
  bold_yellow: { color: "#f2c94e", weight: 700 },
  clean_white: { color: "#f4f4ef", weight: 500 },
  bold_white: { color: "#f4f4ef", weight: 700 },
};

function hashHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return hash;
}

function captionOffset(position: string): { top?: number; bottom?: number } {
  if (position.startsWith("top")) return { top: 48 };
  if (position === "center") return {};
  return { bottom: 48 };
}

function ClipScene({
  clip,
  globalStyle,
  captions,
  durationInFrames,
  isFirst,
}: {
  clip: TimelineClip;
  globalStyle: GlobalStyle;
  captions: CaptionSettings;
  durationInFrames: number;
  isFirst: boolean;
}) {
  const frame = useCurrentFrame();
  const fadeFrames = Math.min(12, Math.floor(durationInFrames / 2));
  const transition = clip.transition ?? "cut";

  let opacity = 1;
  let translateX = 0;

  if (transition === "fade") {
    const fadeIn = isFirst
      ? 1
      : interpolate(frame, [0, fadeFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
    const fadeOut = interpolate(
      frame,
      [durationInFrames - fadeFrames, durationInFrames],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    opacity = Math.min(fadeIn, fadeOut);
  } else if (transition === "fade_out") {
    opacity = interpolate(
      frame,
      [durationInFrames - fadeFrames, durationInFrames],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
  } else if (transition === "slide" && !isFirst) {
    translateX = interpolate(frame, [0, fadeFrames], [48, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    opacity = interpolate(frame, [0, Math.max(1, fadeFrames / 2)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  const hue = hashHue(clip.id);
  const filter = COLOR_GRADE_FILTERS[globalStyle.colorGrade] ?? "saturate(1.05)";
  const captionStyle = CAPTION_STYLES[captions.style] ?? CAPTION_STYLES.minimal_white;
  const offset = captionOffset(captions.position);

  return (
    <AbsoluteFill style={{ opacity, transform: `translateX(${translateX}px)` }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 45% 15%), hsl(${hue + 40} 40% 7%))`,
          filter,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(244,244,239,0.55)",
            marginBottom: 12,
          }}
        >
          {String(clip.order).padStart(2, "0")} · {clip.type}
        </div>
        <div
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 40,
            fontWeight: 500,
            color: "#f4f4ef",
          }}
        >
          {clip.name}
        </div>
      </AbsoluteFill>
      {clip.caption && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: offset.top !== undefined ? "flex-start" : offset.bottom !== undefined ? "flex-end" : "center",
            paddingTop: offset.top,
            paddingBottom: offset.bottom,
          }}
        >
          <div
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 20,
              fontWeight: captionStyle.weight,
              color: captionStyle.color,
              background: "rgba(0,0,0,0.45)",
              padding: "8px 18px",
              borderRadius: 8,
              maxWidth: "80%",
              textAlign: "center",
            }}
          >
            {clip.caption}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

function MusicMoodBars({ mood, frame }: { mood: string; frame: number }) {
  const energy = MUSIC_ENERGY[mood] ?? 0.5;
  const bars = [0, 1, 2, 3, 4];
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        display: "flex",
        alignItems: "flex-end",
        gap: 3,
        height: 18,
      }}
    >
      {bars.map((i) => {
        const phase = frame / 4 + i * 1.3;
        const height = 4 + (Math.sin(phase) * 0.5 + 0.5) * 14 * energy;
        return (
          <div
            key={i}
            style={{
              width: 3,
              height,
              borderRadius: 2,
              background: i % 2 === 0 ? "rgba(47,216,201,0.8)" : "rgba(242,169,78,0.8)",
            }}
          />
        );
      })}
    </div>
  );
}

function Playhead({ frame, totalFrames }: { frame: number; totalFrames: number }) {
  const pct = Math.min(100, (frame / Math.max(1, totalFrames)) * 100);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 3,
        background: "rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "#2fd8c9",
        }}
      />
    </div>
  );
}

export function BranchComposition({ timeline }: { timeline: Timeline }) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const totalFrames = Math.round(timeline.duration * fps);
  const clips = [...timeline.clips].sort((a, b) => a.order - b.order);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {clips.map((clip, index) => {
        const startFrame = Math.round(clip.start * fps);
        const durationInFrames = Math.max(1, Math.round((clip.end - clip.start) * fps));
        return (
          <Sequence key={clip.id} from={startFrame} durationInFrames={durationInFrames}>
            <ClipScene
              clip={clip}
              globalStyle={timeline.globalStyle}
              captions={timeline.captions}
              durationInFrames={durationInFrames}
              isFirst={index === 0}
            />
          </Sequence>
        );
      })}
      <MusicMoodBars mood={timeline.audio.musicMood} frame={frame} />
      <Playhead frame={frame} totalFrames={totalFrames} />
    </AbsoluteFill>
  );
}
