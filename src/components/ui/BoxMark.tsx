export function BoxMark({ size = 28 }: { size?: number }) {
  return (
    <span className="box-mark" style={{ width: size, height: size }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 16 16" fill="none">
        <path
          d="M3 12L13 4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="3" cy="12" r="1.4" fill="currentColor" />
        <circle cx="13" cy="4" r="1.4" fill="currentColor" />
      </svg>
    </span>
  );
}
