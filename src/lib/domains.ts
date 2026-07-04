import type { DiffCategory, DiffChange, Domain } from "./types";

/**
 * Domain-split model, mirroring vit's cuts / color / audio / effects / markers
 * split (see vit/README.md). Each domain has a nominal owner role, so different
 * collaborators edit different domains and most changes merge without conflict.
 */
export type DomainInfo = {
  id: Domain;
  label: string;
  owner: string;
  accent: string; // hex, matches the collaborator palette in store.ts
};

export const DOMAINS: DomainInfo[] = [
  { id: "cuts", label: "Cuts", owner: "Editor", accent: "#f97316" },
  { id: "color", label: "Color", owner: "Colorist", accent: "#a855f7" },
  { id: "audio", label: "Audio", owner: "Sound", accent: "#22d3ee" },
  { id: "captions", label: "Captions", owner: "Design", accent: "#34d399" },
  { id: "brand", label: "Brand", owner: "Strategy", accent: "#eab308" },
];

export const DOMAIN_ORDER: Domain[] = DOMAINS.map((d) => d.id);

const DOMAIN_BY_ID: Record<Domain, DomainInfo> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d]),
) as Record<Domain, DomainInfo>;

export function domainInfo(domain: Domain): DomainInfo {
  return DOMAIN_BY_ID[domain];
}

// Which domain owns each diff category.
const CATEGORY_DOMAIN: Record<DiffCategory, Domain> = {
  pacing: "cuts",
  story: "cuts",
  cta: "cuts",
  timeline: "cuts",
  color: "color",
  audio: "audio",
  captions: "captions",
  brand: "brand",
};

export function domainForCategory(category: DiffCategory): Domain {
  return CATEGORY_DOMAIN[category] ?? "cuts";
}

/** Resolve a change's domain, falling back to its category mapping. */
export function domainOf(change: DiffChange): Domain {
  return change.domain ?? domainForCategory(change.category);
}

/** Group changes by domain, preserving DOMAIN_ORDER and dropping empty domains. */
export function groupByDomain<T extends DiffChange>(changes: T[]): Array<{ domain: DomainInfo; changes: T[] }> {
  const buckets = new Map<Domain, T[]>();
  for (const change of changes) {
    const domain = domainOf(change);
    const list = buckets.get(domain) ?? [];
    list.push(change);
    buckets.set(domain, list);
  }
  return DOMAIN_ORDER.filter((id) => buckets.has(id)).map((id) => ({
    domain: DOMAIN_BY_ID[id],
    changes: buckets.get(id)!,
  }));
}
