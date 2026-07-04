import type { SemanticDiff } from "@/lib/types";
import { groupByDomain } from "@/lib/domains";
import { CategoryLabel, ImpactBadge } from "./ui/Badge";

export function DiffPanel({ diff, baseName, targetName }: { diff: SemanticDiff; baseName: string; targetName: string }) {
  const grouped = groupByDomain(diff.changes);

  return (
    <div className="panel p-5">
      <h3 className="gi-display font-display text-base font-medium text-ink">What changed</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-dim">{diff.summary}</p>

      {diff.changes.length === 0 ? (
        <p className="mt-4 text-sm text-ink-faint">
          {targetName} matches {baseName} across every tracked field.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {grouped.map(({ domain, changes }) => (
            <div key={domain.id}>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: domain.accent }}
                />
                <CategoryLabel>{domain.label}</CategoryLabel>
                <span className="text-xs text-ink-faint">· {domain.owner}</span>
              </div>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {changes.map((change) => (
                  <div
                    key={change.field}
                    className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-white/[0.02] px-3 py-2"
                  >
                    <span className="text-sm text-ink">{change.label}</span>
                    <div className="flex items-center gap-2 font-mono-aetos text-xs">
                      <span className="text-ink-faint line-through">{change.before}</span>
                      <span className="text-ink-dim">→</span>
                      <span className="text-ink">{change.after}</span>
                      <ImpactBadge impact={change.impact} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-lg border border-teal/20 bg-teal/[0.05] p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-teal">Recommendation</p>
        <p className="mt-1 text-sm text-ink-dim">{diff.recommendation}</p>
      </div>
    </div>
  );
}
