import type { DiffCategory, Domain, Timeline, TimelineClip } from "./types";

/**
 * Canonical field model — the merge/diff surface of a timeline.
 *
 * vit splits a timeline into domain JSON files (cuts.json, color.json, …) and
 * merges them field by field. We keep a single Timeline object but describe it
 * as a flat list of typed, domain-tagged fields with read/write accessors, so
 * the diff and three-way-merge engines can reason about it uniformly.
 */
export type Scalar = string | number;

export type FieldDesc = {
  key: string;
  label: string;
  domain: Domain;
  category: DiffCategory;
  clipId?: string;
  read: (t: Timeline) => Scalar | undefined;
  write: (t: Timeline, value: Scalar) => void;
  format: (value: Scalar | undefined) => string;
};

const asSeconds = (v: Scalar | undefined) => (v === undefined ? "(none)" : `${v}s`);
const asText = (v: Scalar | undefined) => (v === undefined ? "(none)" : String(v));

function findClip(t: Timeline, id: string): TimelineClip | undefined {
  return t.clips.find((c) => c.id === id);
}

// Global (timeline-wide) fields. musicMood and captionStyle are mirrored into
// globalStyle so the rest of the app keeps seeing a consistent snapshot.
export const GLOBAL_FIELDS: FieldDesc[] = [
  {
    key: "style.pacing",
    label: "Pacing",
    domain: "cuts",
    category: "pacing",
    read: (t) => t.globalStyle.pacing,
    write: (t, v) => {
      t.globalStyle.pacing = String(v);
    },
    format: asText,
  },
  {
    key: "style.colorGrade",
    label: "Color grade",
    domain: "color",
    category: "color",
    read: (t) => t.globalStyle.colorGrade,
    write: (t, v) => {
      t.globalStyle.colorGrade = String(v);
    },
    format: asText,
  },
  {
    key: "style.brandTone",
    label: "Brand tone",
    domain: "brand",
    category: "brand",
    read: (t) => t.globalStyle.brandTone,
    write: (t, v) => {
      t.globalStyle.brandTone = String(v);
    },
    format: asText,
  },
  {
    key: "audio.musicMood",
    label: "Music mood",
    domain: "audio",
    category: "audio",
    read: (t) => t.audio.musicMood,
    write: (t, v) => {
      t.audio.musicMood = String(v);
      t.globalStyle.musicMood = String(v);
    },
    format: asText,
  },
  {
    key: "audio.volume",
    label: "Music volume",
    domain: "audio",
    category: "audio",
    read: (t) => t.audio.volume,
    write: (t, v) => {
      t.audio.volume = Number(v);
    },
    format: asText,
  },
  {
    key: "audio.voiceoverVolume",
    label: "Voiceover volume",
    domain: "audio",
    category: "audio",
    read: (t) => t.audio.voiceoverVolume,
    write: (t, v) => {
      t.audio.voiceoverVolume = Number(v);
    },
    format: asText,
  },
  {
    key: "captions.style",
    label: "Caption style",
    domain: "captions",
    category: "captions",
    read: (t) => t.captions.style,
    write: (t, v) => {
      t.captions.style = String(v);
      t.globalStyle.captionStyle = String(v);
    },
    format: asText,
  },
  {
    key: "captions.font",
    label: "Caption font",
    domain: "captions",
    category: "captions",
    read: (t) => t.captions.font,
    write: (t, v) => {
      t.captions.font = String(v);
    },
    format: asText,
  },
  {
    key: "captions.size",
    label: "Caption size",
    domain: "captions",
    category: "captions",
    read: (t) => t.captions.size,
    write: (t, v) => {
      t.captions.size = String(v);
    },
    format: asText,
  },
  {
    key: "captions.position",
    label: "Caption position",
    domain: "captions",
    category: "captions",
    read: (t) => t.captions.position,
    write: (t, v) => {
      t.captions.position = String(v);
    },
    format: asText,
  },
  {
    key: "duration",
    label: "Total duration",
    domain: "cuts",
    category: "timeline",
    read: (t) => t.duration,
    write: (t, v) => {
      t.duration = Number(v);
    },
    format: asSeconds,
  },
];

// Per-clip fields, generated for a given clip id.
export function clipFields(clipId: string, clipName: string): FieldDesc[] {
  const label = (suffix: string) => `${clipName} — ${suffix}`;
  return [
    {
      key: `clip.${clipId}.start`,
      label: label("start"),
      domain: "cuts",
      category: "timeline",
      clipId,
      read: (t) => findClip(t, clipId)?.start,
      write: (t, v) => {
        const c = findClip(t, clipId);
        if (c) c.start = Number(v);
      },
      format: asSeconds,
    },
    {
      key: `clip.${clipId}.end`,
      label: label("end"),
      domain: "cuts",
      category: "timeline",
      clipId,
      read: (t) => findClip(t, clipId)?.end,
      write: (t, v) => {
        const c = findClip(t, clipId);
        if (c) c.end = Number(v);
      },
      format: asSeconds,
    },
    {
      key: `clip.${clipId}.order`,
      label: label("order"),
      domain: "cuts",
      category: "story",
      clipId,
      read: (t) => findClip(t, clipId)?.order,
      write: (t, v) => {
        const c = findClip(t, clipId);
        if (c) c.order = Number(v);
      },
      format: asText,
    },
    {
      key: `clip.${clipId}.caption`,
      label: label("caption"),
      domain: "captions",
      category: "captions",
      clipId,
      read: (t) => findClip(t, clipId)?.caption,
      write: (t, v) => {
        const c = findClip(t, clipId);
        if (c) c.caption = String(v);
      },
      format: (v) => (v === undefined ? "(none)" : `“${v}”`),
    },
    {
      key: `clip.${clipId}.transition`,
      label: label("transition"),
      domain: "cuts",
      category: "timeline",
      clipId,
      read: (t) => findClip(t, clipId)?.transition,
      write: (t, v) => {
        const c = findClip(t, clipId);
        if (c) c.transition = String(v);
      },
      format: asText,
    },
  ];
}
