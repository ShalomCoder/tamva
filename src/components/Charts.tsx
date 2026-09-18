import { useId, useRef, useState, type MouseEvent } from "react";
import { formatNumber } from "../lib/format";

export interface SeriesPoint {
  label: string;
  value: number;
}

const GRID_TICKS = 4;

function ticks(max: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < GRID_TICKS; i++) arr.push(Math.round((max * i) / (GRID_TICKS - 1)));
  return arr;
}

function nearestIndex(rect: DOMRect, count: number, clientX: number): number {
  const x = clientX - rect.left;
  const idx = Math.floor((x / rect.width) * count);
  return Math.min(count - 1, Math.max(0, idx));
}

/**
 * FLOAT SignalChart — thin bars that rise into place on a faint grid,
 * with a compact instrument readout that follows the cursor.
 */
export function BarChart({
  data,
  height = 200,
  color = "var(--primary)",
}: {
  data: SeriesPoint[];
  height?: number;
  color?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) return <p className="text-secondary">No data.</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (!wrapRef.current) return;
    setHover(nearestIndex(wrapRef.current.getBoundingClientRect(), data.length, e.clientX));
  }

  const readout = hover !== null ? data[hover] : null;

  return (
    <div ref={wrapRef} className="signal-chart" style={{ position: "relative", height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" role="img" aria-label="Column chart">
        {ticks(max).map((t, i) => (
          <line
            key={i}
            className="grid-line"
            x1="0"
            x2="100"
            y1={92 - (t / max) * 88}
            y2={92 - (t / max) * 88}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line className="grid-line" x1="0" x2="100" y1="92.5" y2="92.5" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const h = (d.value / max) * 88;
          const active = hover === i;
          return (
            <rect
              key={d.label}
              className="signal-bar"
              x={i * barWidth + barWidth * 0.14}
              y={92 - h}
              width={barWidth * 0.72}
              height={h}
              rx={1.8}
              fill={color}
              opacity={active ? 1 : 0.78}
              style={{ animationDelay: `${i * 45}ms` }}
            />
          );
        })}
      </svg>

      {readout ? (
        <div
          className="chart-readout"
          style={{
            position: "absolute",
            left: `max(10%, min(90%, ${((hover! + 0.5) / data.length) * 100}%))`,
            top: 4,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatNumber(readout.value)}</span>
          <span className="text-muted">{readout.label}</span>
        </div>
      ) : null}

      <div className="svg-chart__labels">
        {data.map((d) => (
          <span key={d.label} style={hover === null ? undefined : { fontWeight: 600, color: "var(--text-secondary)" }}>
            {d.label}
            {hover !== null && d.label === readout?.label ? " · " + formatNumber(d.value) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * FLOAT SignalChart — an animated trace drawing itself across a faint
 * grid, with glowing point markers and a crosshair + floating readout.
 */
export function LineChart({
  data,
  height = 200,
  color = "var(--info)",
}: {
  data: SeriesPoint[];
  height?: number;
  color?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId();

  if (data.length < 2) return <p className="text-secondary">Not enough data to plot a trend.</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 92 - (d.value / max) * 86,
  }));
  const linePath = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M ${pts[0].x},100 L ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${pts[pts.length - 1].x},100 Z`;

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (!wrapRef.current) return;
    setHover(nearestIndex(wrapRef.current.getBoundingClientRect(), data.length, e.clientX));
  }

  const active = hover !== null ? pts[hover] : null;
  const left = active ? Math.max(8, Math.min(92, active.x)) : 0;
  const top = active ? Math.max(6, Math.min(78, active.y)) : 0;

  return (
    <div ref={wrapRef} className="signal-chart" style={{ position: "relative", height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" role="img" aria-label="Line chart">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks(max).map((t, i) => (
          <line
            key={i}
            className="grid-line"
            x1="0"
            x2="100"
            y1={92 - (t / max) * 86}
            y2={92 - (t / max) * 86}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path className="trace-area" d={areaPath} fill={`url(#${gradId})`} />
        <path className="trace-path" d={linePath} stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />

        {pts.map((p, i) => (
          <circle
            key={i}
            className="trace-point"
            cx={p.x}
            cy={p.y}
            r={hover === i ? 2.4 : 1.3}
            fill="var(--canvas-1)"
            stroke={color}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {active ? (
          <g className="crosshair">
            <line className="crosshair-line" x1={active.x} x2={active.x} y1="0" y2="100" vectorEffect="non-scaling-stroke" />
            <line className="crosshair-line" x1="0" x2="100" y1={active.y} y2={active.y} vectorEffect="non-scaling-stroke" />
          </g>
        ) : null}
      </svg>

      {active && hover !== null ? (
        <div
          className="chart-readout"
          style={{
            position: "absolute",
            left: `${left}%`,
            top: `${top}%`,
            transform: active.y < 55 ? "translate(-50%, 12px)" : "translate(-50%, -130%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "6px 10px",
            borderRadius: 10,
            background: "rgba(13,17,22,.88)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(var(--blur-sm))",
            boxShadow: "var(--shadow-2)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatNumber(data[hover].value)}</span>
          <span className="text-muted">{data[hover].label}</span>
        </div>
      ) : null}

      <div className="svg-chart__labels">
        {data.map((d) => (
          <span key={d.label} style={hover === null ? undefined : { fontWeight: 600, color: "var(--text-secondary)" }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}