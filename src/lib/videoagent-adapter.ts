import type { Timeline } from "./types";

export type VideoAgentStrategy = "viral" | "premium" | "story" | "brand_safe";

export type VideoAgentEditAction = {
  id: string;
  type: "trim" | "reorder" | "caption" | "music" | "transition" | "color" | "cta";
  target: string;
  before: string;
  after: string;
  reason: string;
};

export type VideoAgentBranchPlan = {
  id: string;
  name: string;
  agentType: VideoAgentStrategy;
  verifierScore: number;
  summary: string;
  recommendation: string;
  editActions: VideoAgentEditAction[];
  timeline: Timeline;
};

export type VideoAgentRunRequest = {
  projectId: string;
  sourceBranchId: string;
  sourceBranchName: string;
  goal?: string;
  strategies?: VideoAgentStrategy[];
  timeline: Timeline;
};

export type VideoAgentRunResponse = {
  provider: "videoagent-mock";
  mode: "hackathon-adapter";
  projectId: string;
  sourceBranchId: string;
  generatedAt: string;
  plans: VideoAgentBranchPlan[];
};

const DEFAULT_STRATEGIES: VideoAgentStrategy[] = [
  "viral",
  "premium",
  "story",
  "brand_safe",
];

function cloneTimeline(timeline: Timeline): Timeline {
  return JSON.parse(JSON.stringify(timeline)) as Timeline;
}

function formatSeconds(value: number): string {
  return `${value}s`;
}

function relayoutTimeline(timeline: Timeline, durations: Record<string, number>) {
  let cursor = 0;
  timeline.clips = timeline.clips
    .map((clip, index) => {
      const duration = durations[clip.id] ?? clip.end - clip.start;
      const nextClip = {
        ...clip,
        start: cursor,
        end: cursor + duration,
        order: index + 1,
      };
      cursor += duration;
      return nextClip;
    });
  timeline.duration = cursor;
}

function moveClipBefore(timeline: Timeline, clipId: string, beforeClipId: string) {
  const moving = timeline.clips.find((clip) => clip.id === clipId);
  if (!moving) return;

  const remaining = timeline.clips.filter((clip) => clip.id !== clipId);
  const targetIndex = remaining.findIndex((clip) => clip.id === beforeClipId);
  if (targetIndex === -1) return;

  remaining.splice(targetIndex, 0, moving);
  timeline.clips = remaining;
}

function buildPlan({
  agentType,
  source,
  goal,
}: {
  agentType: VideoAgentStrategy;
  source: Timeline;
  goal: string;
}): VideoAgentBranchPlan {
  const timeline = cloneTimeline(source);
  const hook = timeline.clips.find((clip) => clip.id === "clip_hook");
  const cta = timeline.clips.find((clip) => clip.id === "clip_cta");
  const product = timeline.clips.find((clip) => clip.id === "clip_product");
  const proof = timeline.clips.find((clip) => clip.id === "clip_testimonial");
  const hookBefore = hook ? formatSeconds(hook.end - hook.start) : "unknown";
  const ctaBefore = cta ? formatSeconds(cta.start) : "unknown";

  if (agentType === "viral") {
    timeline.globalStyle.pacing = "fast";
    timeline.globalStyle.colorGrade = "warm";
    timeline.globalStyle.musicMood = "energetic";
    timeline.globalStyle.captionStyle = "bold_white";
    timeline.globalStyle.brandTone = "high_retention_social";
    timeline.audio.musicMood = "energetic";
    timeline.audio.volume = Math.min(82, timeline.audio.volume + 10);
    timeline.captions.style = "bold_white";
    timeline.captions.size = "large";
    if (hook) {
      hook.caption = "Stop reviewing five final files";
      hook.transition = "cut";
    }
    if (cta) {
      cta.caption = "Run the agent arena";
      cta.transition = "cut";
    }
    if (product && proof) {
      moveClipBefore(timeline, proof.id, product.id);
    }
    relayoutTimeline(timeline, { clip_hook: 3, clip_problem: 7, clip_testimonial: 8, clip_product: 10, clip_cta: 7 });
    return {
      id: "videoagent-viral",
      name: "VideoAgent Viral Cut",
      agentType,
      verifierScore: 82,
      summary: `Optimized ${goal} for hook strength, faster pacing, retention, and short-form energy.`,
      recommendation: "Keep the hook and earlier proof. Review music intensity before merging.",
      editActions: [
        {
          id: "viral-hook",
          type: "trim",
          target: "Hook",
          before: hookBefore,
          after: "3s",
          reason: "A shorter hook improves feed retention.",
        },
        {
          id: "viral-proof-order",
          type: "reorder",
          target: "Customer Proof",
          before: "After Product Demo",
          after: "Before Product Demo",
          reason: "Proof arrives before feature details to establish trust earlier.",
        },
        {
          id: "viral-cta",
          type: "cta",
          target: "CTA",
          before: ctaBefore,
          after: cta ? formatSeconds(cta.start) : "28s",
          reason: "The CTA appears before audience drop-off.",
        },
      ],
      timeline,
    };
  }

  if (agentType === "premium") {
    timeline.globalStyle.pacing = "medium_fast";
    timeline.globalStyle.colorGrade = "premium_warm";
    timeline.globalStyle.musicMood = "cinematic";
    timeline.globalStyle.captionStyle = "clean_white";
    timeline.globalStyle.brandTone = "investor_grade";
    timeline.audio.musicMood = "cinematic";
    timeline.audio.volume = Math.max(58, timeline.audio.volume - 8);
    timeline.captions.style = "clean_white";
    if (hook) {
      hook.caption = "Git, Figma, and Gym for video agents";
      hook.transition = "cross_dissolve";
    }
    if (cta) {
      cta.caption = "Compare branches";
      cta.transition = "fade_out";
    }
    relayoutTimeline(timeline, { clip_hook: 5, clip_problem: 11, clip_product: 16, clip_testimonial: 11, clip_cta: 10 });
    return {
      id: "videoagent-premium",
      name: "VideoAgent Premium Cut",
      agentType,
      verifierScore: 76,
      summary: `Optimized ${goal} for polish, premium tone, controlled transitions, and investor clarity.`,
      recommendation: "Keep the color and CTA tone. Consider trimming the product section.",
      editActions: [
        {
          id: "premium-hook",
          type: "caption",
          target: "Hook",
          before: hook?.caption ?? "unknown",
          after: "Git, Figma, and Gym for video agents",
          reason: "The opening line explains the product mental model quickly.",
        },
        {
          id: "premium-music",
          type: "music",
          target: "Audio",
          before: source.audio.musicMood,
          after: "cinematic",
          reason: "Cinematic audio better matches investor-facing positioning.",
        },
      ],
      timeline,
    };
  }

  if (agentType === "story") {
    timeline.globalStyle.pacing = "medium";
    timeline.globalStyle.colorGrade = "warm";
    timeline.globalStyle.musicMood = "focused";
    timeline.globalStyle.captionStyle = "bold_white";
    timeline.globalStyle.brandTone = "narrative_clear";
    timeline.audio.musicMood = "focused";
    timeline.captions.style = "bold_white";
    if (hook) {
      hook.caption = "One raw video becomes an agent learning loop";
      hook.transition = "cut";
    }
    if (product && proof) {
      moveClipBefore(timeline, proof.id, product.id);
    }
    if (cta) {
      cta.caption = "Merge best decisions";
    }
    relayoutTimeline(timeline, { clip_hook: 4, clip_problem: 10, clip_testimonial: 12, clip_product: 13, clip_cta: 9 });
    return {
      id: "videoagent-story",
      name: "VideoAgent Story Cut",
      agentType,
      verifierScore: 88,
      summary: `Optimized ${goal} for narrative order, emotional clarity, and viewer understanding.`,
      recommendation: "Keep the reordered proof and story arc. Pair with premium color if merging.",
      editActions: [
        {
          id: "story-order",
          type: "reorder",
          target: "Customer Proof",
          before: "After Product Demo",
          after: "Before Product Demo",
          reason: "Proof makes the product explanation easier to trust.",
        },
        {
          id: "story-hook",
          type: "caption",
          target: "Hook",
          before: hook?.caption ?? "unknown",
          after: "One raw video becomes an agent learning loop",
          reason: "The hook frames the full Aetos workflow in one sentence.",
        },
      ],
      timeline,
    };
  }

  timeline.globalStyle.pacing = "medium";
  timeline.globalStyle.colorGrade = "premium_warm";
  timeline.globalStyle.musicMood = "restrained";
  timeline.globalStyle.captionStyle = "clean_white";
  timeline.globalStyle.brandTone = "brand_safe";
  timeline.audio.musicMood = "restrained";
  timeline.audio.volume = Math.max(55, timeline.audio.volume - 12);
  timeline.captions.style = "clean_white";
  for (const clip of timeline.clips) {
    if (clip.transition === "flash" || clip.transition === "quick_zoom") {
      clip.transition = "cut";
    }
  }
  if (hook) {
    hook.caption = "Autonomous editing with human judgment intact";
    hook.transition = "cut";
  }
  if (cta) {
    cta.caption = "Score agent cuts";
  }
  relayoutTimeline(timeline, { clip_hook: 4, clip_problem: 10, clip_product: 15, clip_testimonial: 13, clip_cta: 10 });
  return {
    id: "videoagent-brand-safe",
    name: "VideoAgent Brand-Safe Cut",
    agentType,
    verifierScore: 91,
    summary: `Optimized ${goal} for brand fit, clean captions, restrained audio, and client-safe transitions.`,
    recommendation: "Best overall merge candidate for client review.",
    editActions: [
      {
        id: "brand-music",
        type: "music",
        target: "Audio",
        before: source.audio.musicMood,
        after: "restrained",
        reason: "Lower intensity protects brand fit.",
      },
      {
        id: "brand-transition",
        type: "transition",
        target: "Timeline",
        before: "High-intensity presets",
        after: "Clean cuts and fades",
        reason: "Simple transitions reduce off-brand visual noise.",
      },
    ],
    timeline,
  };
}

export function runHackathonVideoAgentAdapter(
  request: VideoAgentRunRequest,
): VideoAgentRunResponse {
  const strategies = request.strategies?.length ? request.strategies : DEFAULT_STRATEGIES;
  const goal = request.goal?.trim() || "the launch video";

  return {
    provider: "videoagent-mock",
    mode: "hackathon-adapter",
    projectId: request.projectId,
    sourceBranchId: request.sourceBranchId,
    generatedAt: new Date().toISOString(),
    plans: strategies.map((agentType) =>
      buildPlan({
        agentType,
        source: request.timeline,
        goal,
      }),
    ),
  };
}
