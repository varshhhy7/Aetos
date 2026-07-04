const SIZE = 96;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICKS = [0, 90, 180, 270];

export function RadialGauge({
  value,
  label,
  accent = "teal",
}: {
  value: number;
  label: string;
  accent?: "teal" | "amber";
}) {
  const pct = Math.round(Math.min(100, Math.max(0, value)));
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  const color = accent === "amber" ? "var(--amber)" : "var(--teal)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {TICKS.map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = SIZE / 2 + (RADIUS + STROKE / 2 + 2) * Math.cos(rad);
            const y1 = SIZE / 2 + (RADIUS + STROKE / 2 + 2) * Math.sin(rad);
            const x2 = SIZE / 2 + (RADIUS + STROKE / 2 + 6) * Math.cos(rad);
            const y2 = SIZE / 2 + (RADIUS + STROKE / 2 + 6) * Math.sin(rad);
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--hairline-strong)"
                strokeWidth={1.5}
              />
            );
          })}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-aetos text-xl font-semibold text-ink">{pct}</span>
          <span className="font-mono-aetos text-[10px] text-ink-faint">percent</span>
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</span>
    </div>
  );
}
