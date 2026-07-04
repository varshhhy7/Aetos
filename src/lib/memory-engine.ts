import { getBranchMetadata, type BranchMetadata } from "./diff-engine";
import type { Branch, MemorySuggestion, TeamMemory, Timeline } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizePacing(pacing: string): TeamMemory["pacing"] {
  if (pacing === "fast" || pacing === "medium" || pacing === "medium_fast" || pacing === "slow") {
    return pacing;
  }
  return "medium";
}

function bucketHookLength(hookLength: number): string {
  if (hookLength <= 3) return "under_3_seconds";
  if (hookLength <= 5) return "under_5_seconds";
  if (hookLength <= 8) return "under_8_seconds";
  return "flexible";
}

function normalizeCaptionStyle(captionStyle: string): string {
  if (captionStyle.includes("bold")) return "bold_high_contrast";
  if (captionStyle.includes("clean") || captionStyle.includes("minimal")) return "minimal_clean";
  return captionStyle;
}

function normalizeColorGrade(colorGrade: string): string {
  if (colorGrade.includes("warm")) return "warm";
  if (colorGrade.includes("premium")) return "warm";
  return "neutral";
}

function normalizeMusicMood(musicMood: string): string {
  if (musicMood === "energetic") return "energetic_but_not_loud";
  if (musicMood === "calm") return "calm";
  return musicMood;
}

function deriveTransitionStyle(timeline: Timeline): string {
  const transitions = timeline.clips.map((clip) => clip.transition ?? "cut");
  const cutHeavy = transitions.filter((t) => t === "cut").length >= transitions.length / 2;
  return cutHeavy ? "quick_clean_cuts" : "clean_transitions";
}

function bucketCtaPlacement(ctaTime: number, duration: number): string {
  const pct = duration > 0 ? ctaTime / duration : 1;
  if (pct <= 0.5) return "before_50_percent_mark";
  if (pct <= 0.75) return "before_final_25_percent";
  return "before_final_10_percent";
}

function deriveAvoid(meta: BranchMetadata, timeline: Timeline): string[] {
  const avoid: string[] = [];
  if (meta.hookLength > 6) avoid.push("slow_intro");
  const ctaPct = timeline.duration > 0 ? meta.ctaTime / timeline.duration : 1;
  if (ctaPct > 0.85) avoid.push("late_cta");
  if (meta.captionStyle.includes("minimal") && meta.pacing === "fast") avoid.push("cluttered_text");
  return avoid;
}

export function extractMemoryFromApprovedBranch(
  branch: Branch,
  existing?: TeamMemory,
): TeamMemory {
  const meta = getBranchMetadata(branch);
  const newAvoid = deriveAvoid(meta, branch.timeline);
  const mergedAvoid = existing
    ? Array.from(new Set([...existing.avoid, ...newAvoid])).slice(0, 6)
    : newAvoid;

  return {
    pacing: normalizePacing(meta.pacing),
    hookLengthPreference: bucketHookLength(meta.hookLength),
    captionStyle: normalizeCaptionStyle(meta.captionStyle),
    colorGrade: normalizeColorGrade(meta.colorGrade),
    musicMood: normalizeMusicMood(meta.musicMood),
    transitionStyle: deriveTransitionStyle(branch.timeline),
    ctaPlacement: bucketCtaPlacement(meta.ctaTime, branch.timeline.duration),
    brandTone: meta.brandTone,
    avoid: mergedAvoid,
    confidence: clamp((existing?.confidence ?? 0.5) + 0.12, 0.3, 0.97),
    lastUpdatedFromBranchId: branch.id,
    updatedAt: new Date().toISOString(),
  };
}

export function suggestEditsFromMemory(branch: Branch, memory: TeamMemory): MemorySuggestion[] {
  const meta = getBranchMetadata(branch);
  const suggestions: MemorySuggestion[] = [];

  const hookBucket = bucketHookLength(meta.hookLength);
  if (hookBucket !== memory.hookLengthPreference) {
    suggestions.push({
      id: "suggestion-hook",
      field: "hookLength",
      message: `Your hook is ${meta.hookLength}s. Approved cuts usually keep hooks ${memory.hookLengthPreference.replace(/_/g, " ")}.`,
    });
  }

  const ctaBucket = bucketCtaPlacement(meta.ctaTime, branch.timeline.duration);
  if (ctaBucket !== memory.ctaPlacement) {
    suggestions.push({
      id: "suggestion-cta",
      field: "ctaTime",
      message: `Your CTA appears at ${meta.ctaTime}s. Team memory prefers CTA placement ${memory.ctaPlacement.replace(/_/g, " ")}.`,
    });
  }

  const captionBucket = normalizeCaptionStyle(meta.captionStyle);
  if (captionBucket !== memory.captionStyle) {
    suggestions.push({
      id: "suggestion-captions",
      field: "captionStyle",
      message: `Captions are ${meta.captionStyle.replace(/_/g, " ")}. Approved cuts use ${memory.captionStyle.replace(/_/g, " ")} captions.`,
    });
  }

  const musicBucket = normalizeMusicMood(meta.musicMood);
  if (musicBucket !== memory.musicMood) {
    suggestions.push({
      id: "suggestion-music",
      field: "musicMood",
      message: `Music is ${meta.musicMood}. This brand usually performs better with ${memory.musicMood.replace(/_/g, " ")} music.`,
    });
  }

  const colorBucket = normalizeColorGrade(meta.colorGrade);
  if (colorBucket !== memory.colorGrade) {
    suggestions.push({
      id: "suggestion-color",
      field: "colorGrade",
      message: `Color grade is ${meta.colorGrade.replace(/_/g, " ")}. Approved cuts usually use a ${memory.colorGrade} grade.`,
    });
  }

  return suggestions.slice(0, 5);
}

function reverseHookLength(pref: string): number | null {
  if (pref === "under_3_seconds") return 3;
  if (pref === "under_5_seconds") return 5;
  if (pref === "under_8_seconds") return 8;
  return null;
}

function reverseCtaTime(pref: string, duration: number): number | null {
  if (pref === "before_50_percent_mark") return Math.round(duration * 0.45);
  if (pref === "before_final_25_percent") return Math.round(duration * 0.7);
  if (pref === "before_final_10_percent") return Math.round(duration * 0.92);
  return null;
}

function reverseCaptionStyle(pref: string): string {
  if (pref === "bold_high_contrast") return "bold_yellow";
  if (pref === "minimal_clean") return "minimal_white";
  return pref;
}

function reverseMusicMood(pref: string): string {
  if (pref === "energetic_but_not_loud") return "energetic";
  return pref;
}

export function applyMemoryToTimeline(branch: Branch, memory: TeamMemory): Timeline {
  const timeline: Timeline = JSON.parse(JSON.stringify(branch.timeline));

  const hookTarget = reverseHookLength(memory.hookLengthPreference);
  const hook = timeline.clips.find((clip) => clip.id === "clip_hook");
  if (hook && hookTarget !== null) {
    hook.end = hook.start + hookTarget;
  }

  const ctaTarget = reverseCtaTime(memory.ctaPlacement, timeline.duration);
  const cta = timeline.clips.find((clip) => clip.id === "clip_cta");
  if (cta && ctaTarget !== null) {
    const ctaDuration = cta.end - cta.start;
    cta.start = ctaTarget;
    cta.end = ctaTarget + ctaDuration;
  }

  timeline.captions.style = reverseCaptionStyle(memory.captionStyle);
  timeline.globalStyle.captionStyle = timeline.captions.style;
  timeline.audio.musicMood = reverseMusicMood(memory.musicMood);
  timeline.globalStyle.musicMood = timeline.audio.musicMood;
  timeline.globalStyle.colorGrade = memory.colorGrade;
  timeline.globalStyle.pacing = memory.pacing;
  timeline.globalStyle.brandTone = memory.brandTone;

  return timeline;
}

export function calculateBrandMatchScore(branch: Branch, memory: TeamMemory): number {
  const meta = getBranchMetadata(branch);
  const checks = [
    normalizePacing(meta.pacing) === memory.pacing,
    bucketHookLength(meta.hookLength) === memory.hookLengthPreference,
    normalizeCaptionStyle(meta.captionStyle) === memory.captionStyle,
    normalizeColorGrade(meta.colorGrade) === memory.colorGrade,
    normalizeMusicMood(meta.musicMood) === memory.musicMood,
    bucketCtaPlacement(meta.ctaTime, branch.timeline.duration) === memory.ctaPlacement,
  ];
  const matches = checks.filter(Boolean).length;
  return Math.round((matches / checks.length) * 100);
}
