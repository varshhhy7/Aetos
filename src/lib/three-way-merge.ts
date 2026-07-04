import { clipFields, GLOBAL_FIELDS, type FieldDesc, type Scalar } from "./field-model";
import { validateTimeline } from "./validator";
import type {
  Branch,
  MergeField,
  MergeSide,
  ThreeWayMergeResult,
  Timeline,
  TimelineClip,
  ValidationIssue,
} from "./types";

/**
 * Three-way (BASE / OURS / THEIRS) merge, modelled on vit's git merge + AI
 * resolution flow (see vit/vit/core.py and ai_merge.py). We find the common
 * ancestor of two branches, then reconcile every field:
 *
 *   - only one side changed a field → take that side automatically
 *   - both sides changed it differently → a conflict the user resolves
 *   - a clip deleted on one side but modified on the other → the classic
 *     cross-domain conflict vit's AI resolver exists to handle
 */

function clone(timeline: Timeline): Timeline {
  return JSON.parse(JSON.stringify(timeline)) as Timeline;
}

function eq(a: Scalar | undefined, b: Scalar | undefined): boolean {
  return a === b;
}

function clipById(t: Timeline, id: string): TimelineClip | undefined {
  return t.clips.find((c) => c.id === id);
}

function clipDiffers(a: TimelineClip, b: TimelineClip): boolean {
  return (
    a.start !== b.start ||
    a.end !== b.end ||
    a.order !== b.order ||
    a.caption !== b.caption ||
    a.transition !== b.transition ||
    a.name !== b.name
  );
}

function clipSummary(clip: TimelineClip): string {
  return `${clip.name} (${clip.start}s–${clip.end}s)`;
}

// ── Internal merge plan (shared by preview and resolution) ──────────────────

type ScalarItem = {
  kind: "scalar";
  desc: FieldDesc;
  baseVal: Scalar | undefined;
  ourVal: Scalar | undefined;
  theirVal: Scalar | undefined;
  status: "auto" | "conflict";
  defaultSide: MergeSide;
};

type StructuralItem = {
  kind: "structural";
  op: "add" | "remove";
  clipId: string;
  label: string;
  domain: "cuts";
  presentIfOurs: boolean;
  presentIfTheirs: boolean;
  ourClip?: TimelineClip;
  theirClip?: TimelineClip;
  baseClip?: TimelineClip;
  baseText: string;
  oursText: string;
  theirsText: string;
  status: "auto" | "conflict";
  defaultSide: MergeSide;
};

type PlanItem = ScalarItem | StructuralItem;

function computeMergePlan(base: Timeline, ours: Timeline, theirs: Timeline): PlanItem[] {
  const items: PlanItem[] = [];

  // Scalar fields: global + fields of clips that survive on both sides.
  const survivors = ours.clips.filter((c) => clipById(theirs, c.id));
  const scalarFields: FieldDesc[] = [
    ...GLOBAL_FIELDS,
    ...survivors.flatMap((c) => clipFields(c.id, c.name)),
  ];

  for (const desc of scalarFields) {
    const baseVal = desc.read(base);
    const ourVal = desc.read(ours);
    const theirVal = desc.read(theirs);

    if (eq(ourVal, theirVal)) continue; // identical on both sides — nothing to do

    const ourChanged = !eq(ourVal, baseVal);
    const theirChanged = !eq(theirVal, baseVal);

    if (theirChanged && !ourChanged) {
      // Incoming change from theirs — pull it in cleanly.
      items.push({ kind: "scalar", desc, baseVal, ourVal, theirVal, status: "auto", defaultSide: "theirs" });
    } else if (ourChanged && theirChanged) {
      // Both sides diverged — a real conflict.
      items.push({ kind: "scalar", desc, baseVal, ourVal, theirVal, status: "conflict", defaultSide: "ours" });
    }
    // ours-only change → merged already equals ours, no action needed.
  }

  // Structural: clip presence differences.
  const ids = new Set<string>([...base.clips, ...ours.clips, ...theirs.clips].map((c) => c.id));
  for (const id of ids) {
    const b = clipById(base, id);
    const o = clipById(ours, id);
    const t = clipById(theirs, id);
    if (o && t) continue; // survivor — scalar path handled it

    if (t && !o) {
      // Present in theirs, absent in ours.
      if (b) {
        // Ours deleted a clip theirs kept.
        if (clipDiffers(t, b)) {
          items.push(makeStructural("add", id, "conflict", {
            presentIfOurs: false,
            presentIfTheirs: true,
            baseClip: b,
            theirClip: t,
            defaultSide: "ours",
            oursText: "(removed)",
          }));
        }
        // else: ours deleted it, theirs unchanged → honor the deletion, no action.
      } else {
        // Brand-new clip added by theirs.
        items.push(makeStructural("add", id, "auto", {
          presentIfOurs: false,
          presentIfTheirs: true,
          theirClip: t,
          defaultSide: "theirs",
          baseText: "(none)",
          oursText: "(none)",
        }));
      }
    } else if (o && !t) {
      // Present in ours, absent in theirs.
      if (b) {
        // Theirs deleted a clip ours kept.
        if (clipDiffers(o, b)) {
          items.push(makeStructural("remove", id, "conflict", {
            presentIfOurs: true,
            presentIfTheirs: false,
            baseClip: b,
            ourClip: o,
            defaultSide: "ours",
            theirsText: "(removed)",
          }));
        } else {
          // Ours unchanged, theirs deleted → pull in the deletion.
          items.push(makeStructural("remove", id, "auto", {
            presentIfOurs: true,
            presentIfTheirs: false,
            baseClip: b,
            ourClip: o,
            defaultSide: "theirs",
            theirsText: "(removed)",
          }));
        }
      }
      // else: ours added a new clip theirs never had → merged keeps it, no action.
    }
  }

  return items;
}

function makeStructural(
  op: "add" | "remove",
  clipId: string,
  status: "auto" | "conflict",
  opts: {
    presentIfOurs: boolean;
    presentIfTheirs: boolean;
    defaultSide: MergeSide;
    baseClip?: TimelineClip;
    ourClip?: TimelineClip;
    theirClip?: TimelineClip;
    baseText?: string;
    oursText?: string;
    theirsText?: string;
  },
): StructuralItem {
  const name = (opts.ourClip ?? opts.theirClip ?? opts.baseClip)?.name ?? clipId;
  return {
    kind: "structural",
    op,
    clipId,
    label: `${name} — clip ${op === "add" ? "added" : "removed"}`,
    domain: "cuts",
    presentIfOurs: opts.presentIfOurs,
    presentIfTheirs: opts.presentIfTheirs,
    ourClip: opts.ourClip,
    theirClip: opts.theirClip,
    baseClip: opts.baseClip,
    baseText: opts.baseText ?? (opts.baseClip ? clipSummary(opts.baseClip) : "(none)"),
    oursText: opts.oursText ?? (opts.ourClip ? clipSummary(opts.ourClip) : "(none)"),
    theirsText: opts.theirsText ?? (opts.theirClip ? clipSummary(opts.theirClip) : "(none)"),
    status,
    defaultSide: opts.defaultSide,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

function toMergeField(item: PlanItem): MergeField {
  if (item.kind === "scalar") {
    return {
      key: item.desc.key,
      label: item.desc.label,
      domain: item.desc.domain,
      category: item.desc.category,
      clipId: item.desc.clipId,
      base: item.desc.format(item.baseVal),
      ours: item.desc.format(item.ourVal),
      theirs: item.desc.format(item.theirVal),
      kind: item.status,
      resolution: item.defaultSide,
    };
  }
  return {
    key: `clip.${item.clipId}.__presence`,
    label: item.label,
    domain: item.domain,
    category: "story",
    clipId: item.clipId,
    base: item.baseText,
    ours: item.oursText,
    theirs: item.theirsText,
    kind: item.status,
    resolution: item.defaultSide,
    structural: item.op,
  };
}

export function threeWayMerge(
  base: Timeline,
  ours: Timeline,
  theirs: Timeline,
  mergeBaseName: string,
): ThreeWayMergeResult {
  const plan = computeMergePlan(base, ours, theirs);
  const fields = plan.map(toMergeField);
  return {
    mergeBaseName,
    autoMerged: fields.filter((f) => f.kind === "auto"),
    conflicts: fields.filter((f) => f.kind === "conflict"),
  };
}

/**
 * Apply the merge, honoring per-field resolution overrides (keyed by MergeField.key).
 * Returns the merged timeline plus the post-merge validation report.
 */
export function resolveMergedTimeline(
  base: Timeline,
  ours: Timeline,
  theirs: Timeline,
  decisions: Record<string, MergeSide> = {},
): { timeline: Timeline; validation: ValidationIssue[] } {
  const merged = clone(ours);
  const plan = computeMergePlan(base, ours, theirs);

  for (const item of plan) {
    if (item.kind === "scalar") {
      const side = decisions[item.desc.key] ?? item.defaultSide;
      const value = side === "theirs" ? item.theirVal : item.ourVal;
      if (value !== undefined) item.desc.write(merged, value);
    } else {
      const key = `clip.${item.clipId}.__presence`;
      const side = decisions[key] ?? item.defaultSide;
      const present = side === "ours" ? item.presentIfOurs : item.presentIfTheirs;
      merged.clips = merged.clips.filter((c) => c.id !== item.clipId);
      if (present) {
        const src = side === "theirs" ? item.theirClip ?? item.baseClip : item.ourClip ?? item.baseClip;
        if (src) merged.clips.push(JSON.parse(JSON.stringify(src)) as TimelineClip);
      }
    }
  }

  merged.clips.sort((a, b) => a.start - b.start || a.order - b.order);
  return { timeline: merged, validation: validateTimeline(merged) };
}

/**
 * Find the common-ancestor branch of two branches by walking parentBranchId
 * chains. Falls back to `undefined` when the branches share no history.
 */
export function findMergeBase(
  getBranch: (id: string) => Branch | undefined,
  oursId: string,
  theirsId: string,
): Branch | undefined {
  const ancestorsOf = (id: string): string[] => {
    const chain: string[] = [];
    let current: Branch | undefined = getBranch(id);
    const guard = new Set<string>();
    while (current && !guard.has(current.id)) {
      chain.push(current.id);
      guard.add(current.id);
      current = current.parentBranchId ? getBranch(current.parentBranchId) : undefined;
    }
    return chain;
  };

  const theirChain = new Set(ancestorsOf(theirsId));
  for (const id of ancestorsOf(oursId)) {
    if (theirChain.has(id)) return getBranch(id);
  }
  return undefined;
}
