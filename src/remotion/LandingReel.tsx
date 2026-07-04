import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ---------- tokens (mirrors globals.css) ---------- */
const INK = "#f4f4ef";
const INK_DIM = "#8f8d88";
const INK_FAINT = "#55534e";
const TEAL = "#2fd8c9";
const AMBER = "#f2a94e";
const LINE = "rgba(255,255,255,0.12)";
const LINE_STRONG = "rgba(255,255,255,0.24)";

const FONT_DISPLAY = "var(--font-newsreader), Georgia, serif";
const FONT_MONO = "var(--font-ibm-plex-mono), ui-monospace, monospace";
const FONT_BODY = "var(--font-space-grotesk), system-ui, sans-serif";

const SCENE = 90;
const SCENES = ["branch", "diff", "merge", "memory"];

/* ---------- shared helpers ---------- */
function sceneOpacity(frame: number, dur = SCENE) {
  const fin = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fout = interpolate(frame, [dur - 12, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(fin, fout);
}

function Eyebrow({ n, label, color = INK_DIM }: { n: string; label: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: FONT_MONO,
        fontSize: 14,
        letterSpacing: 4,
        textTransform: "uppercase",
      }}
    >
      <span style={{ color: INK_FAINT }}>{n}</span>
      <span style={{ width: 26, height: 1, background: color, opacity: 0.7 }} />
      <span style={{ color }}>{label}</span>
    </div>
  );
}

function SceneCaption({ text }: { text: string }) {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [10, 30], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const o = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 96,
        textAlign: "center",
        fontFamily: FONT_DISPLAY,
        fontSize: 40,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: INK,
        transform: `translateY(${y}px)`,
        opacity: o,
      }}
    >
      {text}
    </div>
  );
}

/* ---------- scene 1: branch ---------- */
function ClipBlock({
  x,
  y,
  label,
  sub,
  color = LINE_STRONG,
  delay,
  accent,
}: {
  x: number;
  y: number;
  label: string;
  sub?: string;
  color?: string;
  delay: number;
  accent?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120 } });
  const scale = interpolate(s, [0, 1], [0.7, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${scale})`,
        opacity: interpolate(s, [0, 1], [0, 1]),
        width: 118,
        height: 58,
        borderRadius: 10,
        border: `1px solid ${color}`,
        background: "rgba(255,255,255,0.035)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      {accent && (
        <span style={{ position: "absolute", top: 8, left: 10, width: 18, height: 2, background: accent }} />
      )}
      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: INK }}>{label}</span>
      {sub && (
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: INK_DIM,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function BranchScene() {
  const frame = useCurrentFrame();
  const op = sceneOpacity(frame);
  const trunkDraw = interpolate(frame, [6, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const branchDraw = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <svg width="1280" height="720" style={{ position: "absolute", inset: 0 }}>
        <line
          x1={250}
          y1={360}
          x2={820}
          y2={360}
          stroke={LINE_STRONG}
          strokeWidth={1.5}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - trunkDraw}
        />
        <path
          d="M540 335 C540 250 760 250 900 210"
          fill="none"
          stroke={TEAL}
          strokeWidth={1.5}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - branchDraw}
        />
      </svg>

      <div style={{ position: "absolute", left: 96, top: 150 }}>
        <Eyebrow n="01" label="branch" color={TEAL} />
      </div>

      <ClipBlock x={350} y={360} label="hook" sub="0—3s" delay={8} />
      <ClipBlock x={540} y={360} label="story" sub="3—9s" delay={14} />
      <ClipBlock x={730} y={360} label="cta" sub="9—12s" delay={20} />
      <ClipBlock x={900} y={210} label="social cut" sub="branch" delay={40} color={TEAL} accent={TEAL} />

      <SceneCaption text="fork every direction — lose nothing." />
    </AbsoluteFill>
  );
}

/* ---------- scene 2: diff ---------- */
function DiffChip({ label, color, delay }: { label: string; color: string; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140 } });
  return (
    <div
      style={{
        transform: `translateX(${interpolate(s, [0, 1], [-24, 0])}px)`,
        opacity: interpolate(s, [0, 1], [0, 1]),
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 999,
        border: `1px solid ${color}55`,
        background: `${color}18`,
        fontFamily: FONT_MONO,
        fontSize: 15,
        color: INK,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 99, background: color }} />
      {label}
    </div>
  );
}

function DiffCard({ label, x, delay }: { label: string; x: number; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 360,
        transform: `translate(-50%,-50%) scale(${interpolate(s, [0, 1], [0.85, 1])})`,
        opacity: interpolate(s, [0, 1], [0, 1]),
        width: 220,
        height: 150,
        borderRadius: 12,
        border: `1px solid ${LINE_STRONG}`,
        background: "rgba(255,255,255,0.03)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: INK }}>{label}</span>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: INK_DIM,
        }}
      >
        timeline
      </span>
    </div>
  );
}

function DiffScene() {
  const frame = useCurrentFrame();
  const op = sceneOpacity(frame);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", left: 96, top: 150 }}>
        <Eyebrow n="02" label="diff" color={TEAL} />
      </div>

      <DiffCard label="cut A" x={300} delay={4} />
      <DiffCard label="cut B" x={980} delay={10} />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 360,
          transform: "translate(-50%,-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <DiffChip label="pacing  +12%" color={TEAL} delay={22} />
        <DiffChip label="captions → bold" color={INK_DIM} delay={30} />
        <DiffChip label="cta moved  −4s" color={AMBER} delay={38} />
      </div>

      <SceneCaption text="see the decision, not the filename." />
    </AbsoluteFill>
  );
}

/* ---------- scene 3: merge ---------- */
function MergeChip({ label, color, delay }: { label: string; color: string; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 90 } });
  const y = interpolate(s, [0, 1], [255, 430]);
  const o = interpolate(frame - delay, [0, 6, 48, 56], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: y,
        transform: "translate(-50%,-50%)",
        opacity: o,
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${color}55`,
        background: `${color}18`,
        fontFamily: FONT_MONO,
        fontSize: 13,
        color: INK,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}

function MergeScene() {
  const frame = useCurrentFrame();
  const op = sceneOpacity(frame);
  const check = spring({ frame: frame - 58, fps: 30, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", left: 96, top: 150 }}>
        <Eyebrow n="03" label="merge" color={AMBER} />
      </div>

      <svg width="1280" height="720" style={{ position: "absolute", inset: 0 }}>
        <line x1={640} y1={250} x2={640} y2={440} stroke={LINE} strokeWidth={1.5} strokeDasharray="4 6" />
      </svg>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 225,
          transform: "translate(-50%,-50%)",
          width: 180,
          height: 56,
          borderRadius: 10,
          border: `1px solid ${TEAL}66`,
          background: `${TEAL}14`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_BODY,
          fontSize: 15,
          color: INK,
        }}
      >
        social cut
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 460,
          transform: "translate(-50%,-50%)",
          width: 260,
          height: 60,
          borderRadius: 10,
          border: `1px solid ${LINE_STRONG}`,
          background: "rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontFamily: FONT_BODY,
          fontSize: 16,
          color: INK,
        }}
      >
        trunk
        <span
          style={{
            opacity: interpolate(check, [0, 1], [0, 1]),
            transform: `scale(${interpolate(check, [0, 1], [0.5, 1])})`,
            color: TEAL,
            fontFamily: FONT_MONO,
            fontSize: 14,
          }}
        >
          ✓ merged
        </span>
      </div>

      <MergeChip label="pacing" color={TEAL} delay={16} />
      <MergeChip label="cta timing" color={AMBER} delay={28} />

      <SceneCaption text="keep only what earns it." />
    </AbsoluteFill>
  );
}

/* ---------- scene 4: memory ---------- */
function MemoryBar({ label, target, delay }: { label: string; target: number; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const w = interpolate(s, [0, 1], [0, target]);
  return (
    <div style={{ marginBottom: 22, width: 520 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 9,
          fontFamily: FONT_MONO,
          fontSize: 13,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: INK_DIM,
        }}
      >
        <span>{label}</span>
        <span style={{ color: AMBER }}>{Math.round(w)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, background: AMBER, borderRadius: 99 }} />
      </div>
    </div>
  );
}

function MemoryScene() {
  const frame = useCurrentFrame();
  const op = sceneOpacity(frame);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", left: 96, top: 150 }}>
        <Eyebrow n="04" label="memory" color={AMBER} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 380,
          transform: "translate(-50%,-50%)",
        }}
      >
        <MemoryBar label="pacing model" target={92} delay={12} />
        <MemoryBar label="caption style" target={78} delay={22} />
        <MemoryBar label="brand tone" target={86} delay={32} />
      </div>

      <SceneCaption text="reviews that get shorter every month." />
    </AbsoluteFill>
  );
}

/* ---------- persistent HUD chrome ---------- */
function Grid() {
  return (
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

function Scanline() {
  const frame = useCurrentFrame();
  const y = ((frame % 150) / 150) * 720;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        height: 2,
        background: "linear-gradient(90deg, transparent, rgba(47,216,201,0.25), transparent)",
      }}
    />
  );
}

function TopChrome() {
  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 96,
        right: 96,
        display: "flex",
        justifyContent: "space-between",
        fontFamily: FONT_MONO,
        fontSize: 12,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: INK_FAINT,
      }}
    >
      <span>aetos // pitch reel</span>
      <span>ver 0.1</span>
    </div>
  );
}

function BottomChrome({ active }: { active: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: 96,
        right: 96,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      {SCENES.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 99,
              background: i === active ? TEAL : "rgba(255,255,255,0.18)",
            }}
          />
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: i === active ? INK : INK_FAINT,
            }}
          >
            {s}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- root ---------- */
export function LandingReel() {
  const frame = useCurrentFrame();
  const active = Math.min(SCENES.length - 1, Math.floor(frame / SCENE));

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT_BODY }}>
      <Grid />
      <Scanline />
      <TopChrome />

      <Sequence from={0} durationInFrames={SCENE}>
        <BranchScene />
      </Sequence>
      <Sequence from={SCENE} durationInFrames={SCENE}>
        <DiffScene />
      </Sequence>
      <Sequence from={SCENE * 2} durationInFrames={SCENE}>
        <MergeScene />
      </Sequence>
      <Sequence from={SCENE * 3} durationInFrames={SCENE}>
        <MemoryScene />
      </Sequence>

      <BottomChrome active={active} />
    </AbsoluteFill>
  );
}

export const LANDING_REEL_DURATION = SCENE * SCENES.length;
export const LANDING_REEL_FPS = 30;
