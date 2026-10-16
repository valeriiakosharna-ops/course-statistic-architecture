import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, Minus, Plus } from "lucide-react";

export type GraphNode = {
  id: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  sub?: string;
  tone?: "blue" | "red" | "dark";
  inactive?: boolean;
};
export type GraphEdge = {
  from: string;
  to: string;
  label: string;
  dashed?: boolean;
};
export type GraphZone = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
};
export function Graph({
  title,
  nodes,
  edges,
  zones = [],
  height = 400,
  selected,
  onSelect,
}: {
  title: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  zones?: GraphZone[];
  height?: number;
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  const id = useId().replaceAll(":", "");
  const [zoom, setZoom] = useState(100);
  return (
    <div className="graph-shell">
      <div className="graph-toolbar">
        <span>{title}</span>
        <div>
          <small>
            {onSelect
              ? "Нажмите на блок · схему можно двигать"
              : "Стрелки показывают связи · схему можно двигать"}
          </small>
          <button
            aria-label="Уменьшить схему"
            onClick={() => setZoom(Math.max(80, zoom - 10))}
            disabled={zoom === 80}
          >
            <Minus size={15} />
          </button>
          <span>{zoom}%</span>
          <button
            aria-label="Увеличить схему"
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            disabled={zoom === 150}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      <div
        className="graph-scroll"
        tabIndex={0}
        role="region"
        aria-label={title}
      >
        <svg
          role="group"
          aria-label={title}
          viewBox={`0 0 1040 ${height}`}
          style={{ width: `${zoom}%`, minWidth: `${zoom * 8.4}px` }}
        >
          <defs>
            <marker
              id={`arrow-${id}`}
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path d="M0 0 L9 4.5 L0 9" fill="currentColor" />
            </marker>
            <marker
              id={`arrow-active-${id}`}
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path d="M0 0 L9 4.5 L0 9" fill="#2A668E" />
            </marker>
          </defs>
          {zones.map((z) => (
            <g key={z.title} className="graph-zone">
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="12" />
              <text x={z.x + 18} y={z.y + 25} className="zone-title">
                {z.title}
              </text>
              {z.sub && (
                <text x={z.x + 18} y={z.y + 43} className="zone-sub">
                  {z.sub}
                </text>
              )}
            </g>
          ))}
          {edges.map((e, i) => {
            const from = nodes.find((n) => n.id === e.from)!,
              to = nodes.find((n) => n.id === e.to)!;
            const vertical =
              Math.abs(to.y - from.y) > Math.abs(to.x - from.x) * 0.65;
            const w1 = from.w ?? 170,
              h1 = from.h ?? 68,
              w2 = to.w ?? 170,
              h2 = to.h ?? 68;
            const down = to.y >= from.y,
              right = to.x >= from.x;
            const x1 = vertical ? from.x + w1 / 2 : from.x + (right ? w1 : 0),
              y1 = vertical ? from.y + (down ? h1 : 0) : from.y + h1 / 2;
            const x2 = vertical ? to.x + w2 / 2 : to.x + (right ? 0 : w2),
              y2 = vertical ? to.y + (down ? 0 : h2) : to.y + h2 / 2;
            const mx = (x1 + x2) / 2,
              my = (y1 + y2) / 2;
            const path = vertical
              ? `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`
              : `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
            const active = selected === e.from || selected === e.to;
            const limit = vertical
              ? 25
              : Math.max(
                  10,
                  Math.min(25, Math.floor((Math.abs(x2 - x1) - 12) / 5.4)),
                );
            const lines: string[] = [];
            for (const word of e.label.split(" ")) {
              if (
                !lines.length ||
                lines[lines.length - 1].length + word.length + 1 > limit
              )
                lines.push(word);
              else lines[lines.length - 1] += ` ${word}`;
            }
            const labelWidth =
              Math.max(...lines.map((line) => line.length)) * 5.4 + 10;
            const labelHeight = lines.length * 13 + 7;
            return (
              <g
                key={i}
                className={`graph-edge ${active ? "edge-active" : ""}`}
              >
                <path
                  d={path}
                  fill="none"
                  strokeDasharray={e.dashed ? "5 4" : undefined}
                  markerEnd={`url(#arrow-${active ? `active-${id}` : id})`}
                />
                <rect
                  x={mx - labelWidth / 2}
                  y={my - labelHeight / 2}
                  width={labelWidth}
                  height={labelHeight}
                  rx="4"
                />
                <text
                  x={mx}
                  y={my - (lines.length - 1) * 6.5 + 3}
                  textAnchor="middle"
                >
                  {lines.map((line, index) => (
                    <tspan key={index} x={mx} dy={index ? 13 : 0}>
                      {line}
                      {index < lines.length - 1 ? " " : ""}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
          {nodes.map((n) => (
            <g
              key={n.id}
              className={`graph-node ${n.tone ?? ""} ${selected === n.id ? "is-selected" : ""} ${n.inactive ? "is-inactive" : ""}`}
              role={onSelect ? "button" : "group"}
              aria-label={`${n.title}${n.sub ? `: ${n.sub}` : ""}`}
              aria-pressed={onSelect ? selected === n.id : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onClick={() => onSelect?.(n.id)}
              onKeyDown={(e) => {
                if (onSelect && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelect(n.id);
                }
              }}
            >
              <rect
                x={n.x}
                y={n.y}
                width={n.w ?? 170}
                height={n.h ?? 68}
                rx="8"
              />
              <text x={n.x + 14} y={n.y + 27} className="node-title">
                {n.title}
              </text>
              {n.sub && (
                <text x={n.x + 14} y={n.y + 48} className="node-sub">
                  {n.sub}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
export function Flow({
  children,
  label,
}: {
  children: ReactNode[];
  label: string;
}) {
  return (
    <div className="simple-flow" role="group" aria-label={label}>
      {children.map((child, i) => (
        <div className="flow-part" key={i}>
          {child}
          {i < children.length - 1 && (
            <span className="flow-arrow">
              <ArrowRight size={22} />
              <ArrowDown size={22} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
export function Block({
  title,
  sub,
  children,
  tone = "",
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`block ${tone}`}>
      <strong>{title}</strong>
      {sub && <span>{sub}</span>}
      {children}
    </div>
  );
}
export function Heading({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="page-heading">
      <span className="kicker">{kicker}</span>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
  );
}
export function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-title">
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
export function Hint({ children }: { children: ReactNode }) {
  return <div className="hint">{children}</div>;
}
