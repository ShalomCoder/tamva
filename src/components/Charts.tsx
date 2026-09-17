import { formatNumber } from "../lib/format";

export interface SeriesPoint {
  label: string;
  value: number;
}

/** Minimal dependency-free column chart rendered as SVG. */
export function BarChart({ data, height = 200, color = "var(--primary)" }: { data: SeriesPoint[]; height?: number; color?: string }) {
  if (data.length === 0) return <p className="text-secondary">No data.</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;
  return (
    <div className="svg-chart" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
        {data.map((d, i) => {
          const h = (d.value / max) * 88;
          return (
            <rect
              key={d.label}
              x={i * barWidth + barWidth * 0.15}
              y={92 - h}
              width={barWidth * 0.7}
              height={h}
              rx={1}
              fill={color}
              opacity={0.85}
            >
              <title>{`${d.label}: ${formatNumber(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="svg-chart__labels">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Minimal dependency-free line chart rendered as SVG. */
export function LineChart({ data, height = 200, color = "var(--info)" }: { data: SeriesPoint[]; height?: number; color?: string }) {
  if (data.length < 2) return <p className="text-secondary">Not enough data to plot a trend.</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const points = data
    .map((d, i) => `${(i / (data.length - 1)) * 100},${92 - (d.value / max) * 86}`)
    .join(" ");
  return (
    <div className="svg-chart" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="svg-chart__labels">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
