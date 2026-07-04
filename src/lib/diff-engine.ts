import { domainForCategory } from "./domains";
import type { Branch, DiffChange, DiffImpact, SemanticDiff, TimelineClip } from "./types";

export type BranchMetadata = {
  pacing: string;
  colorGrade: string;
  musicMood: string;
  captionStyle: string;
  brandTone: string;
  hookLength: number;
  ctaTime: number;
  clipOrder: string[];
};

function findClip(clips: TimelineClip[], id: string): TimelineClip | undefined {
  return clips.find((clip) => clip.id === id);
}

export function getBranchMetadata(branch: Branch): BranchMetadata {
  const { timeline } = branch;
  const hook = findClip(timeline.clips, "clip_hook");
  const cta = findClip(timeline.clips, "clip_cta");
  const clipOrder = [...timeline.clips]
    .sort((a, b) => a.order - b.order)
    .map((clip) => clip.id);

  return {
    pacing: timeline.globalStyle.pacing,
    colorGrade: timeline.globalStyle.colorGrade,
    musicMood: timeline.audio.musicMood,
    captionStyle: timeline.captions.style,
    brandTone: timeline.globalStyle.brandTone,
    hookLength: hook ? hook.end - hook.start : 0,
    ctaTime: cta ? cta.start : timeline.duration,
    clipOrder,
  };
}

function impactFromDelta(delta: number, high: number, medium: number): DiffImpact {
  const abs = Math.abs(delta);
  if (abs >= high) return "high";
  if (abs >= medium) return "medium";
  return "low";
}

export function compareBranches(base: Branch, target: Branch): SemanticDiff {
  const baseMeta = getBranchMetadata(base);
  const targetMeta = getBranchMetadata(target);
  const changes: DiffChange[] = [];

  if (baseMeta.hookLength !== targetMeta.hookLength) {
    changes.push({
      field: "hookLength",
      label: "Hook length",
      before: `${baseMeta.hookLength}s`,
      after: `${targetMeta.hookLength}s`,
      impact: impactFromDelta(targetMeta.hookLength - baseMeta.hookLength, 4, 2),
      category: "pacing",
    });
  }

  if (baseMeta.pacing !== targetMeta.pacing) {
    changes.push({
      field: "pacing",
      label: "Pacing",
      before: baseMeta.pacing,
      after: targetMeta.pacing,
      impact: "medium",
      category: "pacing",
    });
  }

  if (baseMeta.captionStyle !== targetMeta.captionStyle) {
    changes.push({
      field: "captionStyle",
      label: "Caption style",
      before: baseMeta.captionStyle,
      after: targetMeta.captionStyle,
      impact: "medium",
      category: "captions",
    });
  }

  if (baseMeta.musicMood !== targetMeta.musicMood) {
    changes.push({
      field: "musicMood",
      label: "Music mood",
      before: baseMeta.musicMood,
      after: targetMeta.musicMood,
      impact: "medium",
      category: "audio",
    });
  }

  if (baseMeta.colorGrade !== targetMeta.colorGrade) {
    changes.push({
      field: "colorGrade",
      label: "Color grade",
      before: baseMeta.colorGrade,
      after: targetMeta.colorGrade,
      impact: "low",
      category: "color",
    });
  }

  if (baseMeta.brandTone !== targetMeta.brandTone) {
    changes.push({
      field: "brandTone",
      label: "Brand tone",
      before: baseMeta.brandTone,
      after: targetMeta.brandTone,
      impact: "low",
      category: "brand",
    });
  }

  if (baseMeta.ctaTime !== targetMeta.ctaTime) {
    changes.push({
      field: "ctaTime",
      label: "CTA placement",
      before: `${baseMeta.ctaTime}s`,
      after: `${targetMeta.ctaTime}s`,
      impact: impactFromDelta(targetMeta.ctaTime - baseMeta.ctaTime, 15, 5),
      category: "cta",
    });
  }

  const orderChanged =
    baseMeta.clipOrder.join(",") !== targetMeta.clipOrder.join(",") &&
    baseMeta.clipOrder.length === targetMeta.clipOrder.length &&
    baseMeta.clipOrder.every((id) => targetMeta.clipOrder.includes(id));

  if (orderChanged) {
    const baseNames = baseMeta.clipOrder
      .map((id) => findClip(base.timeline.clips, id)?.name ?? id)
      .join(" -> ");
    const targetNames = targetMeta.clipOrder
      .map((id) => findClip(target.timeline.clips, id)?.name ?? id)
      .join(" -> ");
    changes.push({
      field: "clipOrder",
      label: "Clip order",
      before: baseNames,
      after: targetNames,
      impact: "high",
      category: "story",
    });
  }

  if (base.timeline.duration !== target.timeline.duration) {
    changes.push({
      field: "duration",
      label: "Total duration",
      before: `${base.timeline.duration}s`,
      after: `${target.timeline.duration}s`,
      impact: impactFromDelta(target.timeline.duration - base.timeline.duration, 20, 8),
      category: "timeline",
    });
  }

  changes.push(...compareClips(base.timeline.clips, target.timeline.clips));

  // Tag every change with its owning domain (vit-style domain split).
  for (const change of changes) {
    change.domain = change.domain ?? domainForCategory(change.category);
  }

  const summary = buildSummary(base, target, changes);
  const recommendation = buildRecommendation(target, changes);

  return { summary, changes, recommendation };
}

// Clip-level structural + content changes. Hook/CTA timing is already
// summarized via hookLength/ctaTime, so we skip their timing here to avoid dupes.
const TIMING_SUMMARIZED = new Set(["clip_hook", "clip_cta"]);

function compareClips(baseClips: TimelineClip[], targetClips: TimelineClip[]): DiffChange[] {
  const changes: DiffChange[] = [];
  const baseById = new Map(baseClips.map((c) => [c.id, c]));
  const targetById = new Map(targetClips.map((c) => [c.id, c]));

  for (const clip of targetClips) {
    if (!baseById.has(clip.id)) {
      changes.push({
        field: `clip:${clip.id}:add`,
        label: `${clip.name} added`,
        before: "—",
        after: `${clip.start}s–${clip.end}s`,
        impact: "high",
        category: "story",
        clipId: clip.id,
        kind: "add",
      });
    }
  }

  for (const clip of baseClips) {
    if (!targetById.has(clip.id)) {
      changes.push({
        field: `clip:${clip.id}:remove`,
        label: `${clip.name} removed`,
        before: `${clip.start}s–${clip.end}s`,
        after: "—",
        impact: "high",
        category: "story",
        clipId: clip.id,
        kind: "remove",
      });
      continue;
    }

    const next = targetById.get(clip.id)!;
    if (clip.caption !== next.caption) {
      changes.push({
        field: `clip:${clip.id}:caption`,
        label: `${clip.name} caption`,
        before: clip.caption ?? "—",
        after: next.caption ?? "—",
        impact: "low",
        category: "captions",
        clipId: clip.id,
        kind: "modify",
      });
    }
    if (clip.transition !== next.transition) {
      changes.push({
        field: `clip:${clip.id}:transition`,
        label: `${clip.name} transition`,
        before: clip.transition ?? "—",
        after: next.transition ?? "—",
        impact: "low",
        category: "timeline",
        clipId: clip.id,
        kind: "modify",
      });
    }
    if (
      !TIMING_SUMMARIZED.has(clip.id) &&
      (clip.start !== next.start || clip.end !== next.end)
    ) {
      changes.push({
        field: `clip:${clip.id}:timing`,
        label: `${clip.name} timing`,
        before: `${clip.start}s–${clip.end}s`,
        after: `${next.start}s–${next.end}s`,
        impact: "medium",
        category: "timeline",
        clipId: clip.id,
        kind: "modify",
      });
    }
  }

  return changes;
}

function buildSummary(base: Branch, target: Branch, changes: DiffChange[]): string {
  if (changes.length === 0) {
    return `${target.name} is identical to ${base.name} across every tracked field.`;
  }

  const highlights = [...changes]
    .sort((a, b) => impactRank(b.impact) - impactRank(a.impact))
    .slice(0, 3)
    .map((change) => change.label.toLowerCase());

  const highlightText =
    highlights.length > 1
      ? `${highlights.slice(0, -1).join(", ")} and ${highlights[highlights.length - 1]}`
      : highlights[0];

  return `Compared to ${base.name}, ${target.name} changes ${highlightText}.`;
}

function impactRank(impact: DiffImpact): number {
  return impact === "high" ? 3 : impact === "medium" ? 2 : 1;
}

function buildRecommendation(target: Branch, changes: DiffChange[]): string {
  const categories = new Set(changes.map((change) => change.category));
  const hookChange = changes.find((change) => change.field === "hookLength");
  const ctaChange = changes.find((change) => change.field === "ctaTime");

  const isFasterAndShorter =
    hookChange !== undefined && Number(String(hookChange.after).replace("s", "")) < 5;
  const isEarlierCta =
    ctaChange !== undefined && Number(String(ctaChange.after).replace("s", "")) < 35;

  if (isFasterAndShorter && isEarlierCta) {
    return `Use "${target.name}" for social platforms, but review the audio and brand tone before sending it to enterprise or investor audiences.`;
  }

  if (categories.has("brand") && categories.has("cta")) {
    return `"${target.name}" reads as a more premium, client-facing cut. Good for investor or enterprise contexts.`;
  }

  if (changes.length === 0) {
    return `No changes detected between the two branches.`;
  }

  return `Review the ${changes.length} change${changes.length === 1 ? "" : "s"} in "${target.name}" before deciding which audience it best fits.`;
}
