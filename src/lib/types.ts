export type Project = {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  createdAt: string;
};

export type BranchStatus = "draft" | "approved" | "merged";

export type Branch = {
  id: string;
  projectId: string;
  name: string;
  parentBranchId?: string;
  status: BranchStatus;
  timeline: Timeline;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Timeline = {
  duration: number;
  globalStyle: GlobalStyle;
  clips: TimelineClip[];
  audio: AudioSettings;
  captions: CaptionSettings;
};

export type GlobalStyle = {
  pacing: string;
  colorGrade: string;
  musicMood: string;
  captionStyle: string;
  brandTone: string;
};

export type TimelineClip = {
  id: string;
  name: string;
  type: "video" | "image" | "text" | "audio";
  start: number;
  end: number;
  order: number;
  caption?: string;
  transition?: string;
  notes?: string;
};

export type AudioSettings = {
  musicMood: string;
  volume: number;
  voiceoverVolume: number;
};

export type CaptionSettings = {
  style: string;
  font: string;
  size: string;
  position: string;
};

export type Comment = {
  id: string;
  projectId: string;
  branchId: string;
  clipId?: string;
  timestampSeconds?: number;
  author: string;
  body: string;
  createdAt: string;
};

export type TeamMemory = {
  pacing: "slow" | "medium" | "fast" | "medium_fast";
  hookLengthPreference: string;
  captionStyle: string;
  colorGrade: string;
  musicMood: string;
  transitionStyle: string;
  ctaPlacement: string;
  brandTone: string;
  avoid: string[];
  confidence: number;
  lastUpdatedFromBranchId?: string;
  updatedAt: string;
};

export type DiffCategory =
  | "pacing"
  | "captions"
  | "audio"
  | "color"
  | "story"
  | "brand"
  | "cta"
  | "timeline";

export type DiffImpact = "low" | "medium" | "high";

// Domain-split ownership, mirroring vit's cuts/color/audio/effects/markers model.
// Different roles own different domains, so most edits merge without conflicts.
export type Domain = "cuts" | "color" | "audio" | "captions" | "brand";

export type DiffChange = {
  field: string;
  label: string;
  before: string | number;
  after: string | number;
  impact: DiffImpact;
  category: DiffCategory;
  domain?: Domain;
  clipId?: string;
  // "add" | "remove" | "modify" — for clip-level structural changes.
  kind?: "add" | "remove" | "modify";
};

export type SemanticDiff = {
  summary: string;
  changes: DiffChange[];
  recommendation: string;
};

export type MemorySuggestion = {
  id: string;
  message: string;
  field: string;
};

export type ActivityEvent = {
  id: string;
  projectId: string;
  branchId?: string;
  actor: string;
  eventType:
    | "branch_created"
    | "comment_added"
    | "branch_approved"
    | "memory_updated"
    | "branch_merged";
  message: string;
  createdAt: string;
};

// ── Post-merge validation (ported from vit's validator.py) ──────────────────

export type ValidationSeverity = "error" | "warning";

export type ValidationCategory =
  | "overlap"
  | "gap"
  | "orphaned_ref"
  | "duration"
  | "order"
  | "range"
  | "empty";

export type ValidationIssue = {
  severity: ValidationSeverity;
  category: ValidationCategory;
  message: string;
  clipId?: string;
};

// ── Three-way (BASE / OURS / THEIRS) merge ──────────────────────────────────

// Which side a merged field resolves to.
export type MergeSide = "ours" | "theirs";

// A single field reconciled across the three-way merge.
export type MergeField = {
  // Stable id, e.g. "style.pacing" or "clip.clip_hook.caption".
  key: string;
  label: string;
  domain: Domain;
  category: DiffCategory;
  clipId?: string;
  base: string; // formatted common-ancestor value
  ours: string;
  theirs: string;
  // "auto" = only one side changed (or a clean add/remove); "conflict" = both changed.
  kind: "auto" | "conflict";
  // Default resolution: auto-merged fields take the side that changed;
  // conflicts default to "ours" until the user chooses.
  resolution: MergeSide;
  // For clip add/remove conflicts (the classic vit "deleted clip still referenced" case).
  structural?: "add" | "remove";
};

export type ThreeWayMergeResult = {
  mergeBaseName: string;
  autoMerged: MergeField[];
  conflicts: MergeField[];
};
