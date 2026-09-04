"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 64,
  height = 24,
  positive = true,
  className = "",
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  const color = positive ? "var(--positive)" : "var(--negative)";

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity={0.9}
      />
    </svg>
  );
}
