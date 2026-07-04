import type { Timeline, TimelineClip, ValidationIssue } from "./types";

/**
 * Post-merge validation, ported from vit's validator.py.
 *
 * A clean git/field merge can still produce a semantically broken timeline —
 * overlapping clips, orphaned references, a CTA that no longer lands last.
 * These rule-based checks run after every merge; in vit their output also feeds
 * the AI resolver. Empty result = valid.
 */
export function validateTimeline(timeline: Timeline): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const clips = timeline.clips;

  issues.push(...checkDuplicateIds(clips));
  issues.push(...checkClipDurations(clips));
  issues.push(...checkOverlapsAndGaps(clips));
  issues.push(...checkOrderConsistency(clips));
  issues.push(...checkTimelineDuration(timeline));
  issues.push(...checkCtaPlacement(timeline));
  issues.push(...checkEmptyCaptions(clips));
  issues.push(...checkAudioRanges(timeline));

  return issues;
}

// Two clips sharing an id → a merge kept a stale reference (vit: orphaned_ref).
function checkDuplicateIds(clips: TimelineClip[]): ValidationIssue[] {
  const seen = new Set<string>();
  const issues: ValidationIssue[] = [];
  for (const clip of clips) {
    if (seen.has(clip.id)) {
      issues.push({
        severity: "error",
        category: "orphaned_ref",
        message: `Duplicate clip id '${clip.id}' (${clip.name}) — a merge kept two copies`,
        clipId: clip.id,
      });
    }
    seen.add(clip.id);
  }
  return issues;
}

function checkClipDurations(clips: TimelineClip[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const clip of clips) {
    if (clip.end <= clip.start) {
      issues.push({
        severity: "error",
        category: "range",
        message: `Clip '${clip.name}' has a non-positive duration (${clip.start}s → ${clip.end}s)`,
        clipId: clip.id,
      });
    }
  }
  return issues;
}

// vit _check_overlapping_clips, plus gap detection on the single video track.
function checkOverlapsAndGaps(clips: TimelineClip[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sorted = [...clips].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.end > next.start) {
      issues.push({
        severity: "error",
        category: "overlap",
        message: `'${current.name}' (ends ${current.end}s) overlaps '${next.name}' (starts ${next.start}s)`,
        clipId: next.id,
      });
    } else if (current.end < next.start) {
      issues.push({
        severity: "warning",
        category: "gap",
        message: `Gap on the timeline between '${current.name}' (${current.end}s) and '${next.name}' (${next.start}s)`,
        clipId: next.id,
      });
    }
  }
  return issues;
}

// The `order` field should agree with on-timeline start times after a merge.
function checkOrderConsistency(clips: TimelineClip[]): ValidationIssue[] {
  const byOrder = [...clips].sort((a, b) => a.order - b.order).map((c) => c.id);
  const byStart = [...clips].sort((a, b) => a.start - b.start).map((c) => c.id);
  if (byOrder.join(",") !== byStart.join(",")) {
    return [
      {
        severity: "warning",
        category: "order",
        message: "Clip order fields disagree with their timeline start times — a merge may have reordered one but not the other",
      },
    ];
  }
  return [];
}

function checkTimelineDuration(timeline: Timeline): ValidationIssue[] {
  if (timeline.clips.length === 0) return [];
  const maxEnd = Math.max(...timeline.clips.map((c) => c.end));
  if (Math.abs(maxEnd - timeline.duration) > 0.001) {
    return [
      {
        severity: "warning",
        category: "duration",
        message: `Timeline duration is ${timeline.duration}s but the last clip ends at ${maxEnd}s`,
      },
    ];
  }
  return [];
}

function checkCtaPlacement(timeline: Timeline): ValidationIssue[] {
  const cta = timeline.clips.find((c) => c.id === "clip_cta");
  if (!cta) return [];
  const latestEnd = Math.max(...timeline.clips.map((c) => c.end));
  if (cta.end < latestEnd - 0.001) {
    return [
      {
        severity: "warning",
        category: "order",
        message: `CTA ends at ${cta.end}s but the timeline runs to ${latestEnd}s — the call to action no longer lands last`,
        clipId: cta.id,
      },
    ];
  }
  return [];
}

function checkEmptyCaptions(clips: TimelineClip[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const clip of clips) {
    if (clip.caption !== undefined && clip.caption.trim() === "") {
      issues.push({
        severity: "warning",
        category: "empty",
        message: `Clip '${clip.name}' has an empty caption`,
        clipId: clip.id,
      });
    }
  }
  return issues;
}

function checkAudioRanges(timeline: Timeline): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { volume, voiceoverVolume } = timeline.audio;
  for (const [label, value] of [
    ["Music volume", volume],
    ["Voiceover volume", voiceoverVolume],
  ] as const) {
    if (value < 0 || value > 100) {
      issues.push({
        severity: "error",
        category: "range",
        message: `${label} (${value}) is outside the valid 0–100 range`,
      });
    }
  }
  return issues;
}

/** One-line summary of validation results, e.g. "2 errors, 1 warning". */
export function summarizeValidation(issues: ValidationIssue[]): string {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  if (errors === 0 && warnings === 0) return "No issues found";
  const parts: string[] = [];
  if (errors) parts.push(`${errors} error${errors === 1 ? "" : "s"}`);
  if (warnings) parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
  return parts.join(", ");
}
