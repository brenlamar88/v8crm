/* ----------------------------------------------------------------------------
   Sparkline — a compact area+line chart. Draws itself from a series of numbers
   with a violet gradient fill, echoing the reference's lit chart floor. The
   line stroke-draws in on mount using the slow token duration.
   -------------------------------------------------------------------------- */
import { useId } from "react";

export function Sparkline({
  data,
  width = 240,
  height = 64,
  tone = "accent",
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: "accent" | "up" | "down";
}) {
  const id = useId().replace(/:/g, "");
  const pad = 3;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${points[0][0]},${height} ${line} ${points[points.length - 1][0]},${height}`;

  const stroke = {
    accent: "var(--v8-accent-400)",
    up: "var(--v8-up)",
    down: "var(--v8-down)",
  }[tone];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label="trend"
    >
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#fill-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: "count-in 0ms, dash var(--v8-dur-slow) var(--v8-ease-out) forwards",
        }}
      />
      <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}
