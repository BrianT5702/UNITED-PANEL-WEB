"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import type { ActionPoint, Bucket } from "@/lib/analytics-types";
import { EVENT_LABELS, fmtDuration } from "@/lib/analytics-types";

export const nf = (n: number) => Math.round(n).toLocaleString("en");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-09-25" → "25 Sep" (hour labels like "3 PM" pass through) */
export function shortLabel(label: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : label;
}
export function longLabel(label: string, bucket: "hour" | "day" | "week"): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  if (!m) return label;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const base = `${wd}, ${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return bucket === "week" ? `Week of ${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : base;
}

function niceMax(max: number): number {
  if (max <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}
function niceDurationMax(maxSec: number): number {
  const steps = [10, 20, 30, 60, 120, 180, 300, 600, 1200, 1800, 3600, 7200];
  return steps.find((s) => s >= maxSec) ?? Math.ceil(maxSec / 3600) * 3600;
}

/* ───────────── Sparkline ───────────── */
export function Sparkline({ values, tone = "accent", future }: { values: number[]; tone?: "accent" | "good" | "bad" | "steel"; future?: boolean[] }) {
  const id = useId().replace(/:/g, "");
  const vals = values.filter((_, i) => !future?.[i]);
  if (vals.length < 2 || vals.every((v) => v === 0)) {
    return <svg className="an2-spark is-flat" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="120" y1="30" y2="30" /></svg>;
  }
  const max = Math.max(...vals);
  const min = Math.min(...vals, 0);
  const span = max - min || 1;
  const n = vals.length;
  const x = (i: number) => (i / (n - 1)) * 120;
  const y = (v: number) => 31 - ((v - min) / span) * 26;
  const line = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className={`an2-spark is-${tone}`} viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sp${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L120,36 L0,36 Z`} fill={`url(#sp${id})`} stroke="none" />
      <path d={line} className="an2-spark-line" />
    </svg>
  );
}

/* ───────────── Interactive trend (area/line + compare overlay) ───────────── */
export type SeriesPoint = { label: string; value: number; future?: boolean; extra?: { name: string; text: string }[] };

export function TrendChart({
  series,
  prev,
  format = nf,
  unit,
  bucket,
  yDuration,
  height = 280,
  name,
}: {
  series: SeriesPoint[];
  prev: SeriesPoint[] | null;
  format?: (v: number) => string;
  unit: string;
  bucket: "hour" | "day" | "week";
  yDuration?: boolean;
  height?: number;
  name: string;
}) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 860;
  const H = height;
  const L = 46;
  const R = 16;
  const T = 16;
  const B = 32;
  const n = series.length;
  const dataMax = Math.max(0, ...series.filter((p) => !p.future).map((p) => p.value), ...(prev ? prev.map((p) => p.value) : []));
  const top = yDuration ? niceDurationMax(dataMax) : niceMax(dataMax);
  const x = (i: number) => L + (n <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1));
  const y = (v: number) => T + (1 - Math.min(v, top) / top) * (H - T - B);
  const last = (() => {
    let k = n - 1;
    while (k > 0 && series[k].future) k -= 1;
    return k;
  })();
  const pts = series.slice(0, last + 1);
  const smooth = (arr: { v: number; i: number }[]) => {
    if (!arr.length) return "";
    if (arr.length === 1) return `M${x(arr[0].i)},${y(arr[0].v)}`;
    let d = `M${x(arr[0].i).toFixed(1)},${y(arr[0].v).toFixed(1)}`;
    for (let k = 1; k < arr.length; k++) {
      const p0 = arr[k - 1];
      const p1 = arr[k];
      const cx = (x(p0.i) + x(p1.i)) / 2;
      d += ` C${cx.toFixed(1)},${y(p0.v).toFixed(1)} ${cx.toFixed(1)},${y(p1.v).toFixed(1)} ${x(p1.i).toFixed(1)},${y(p1.v).toFixed(1)}`;
    }
    return d;
  };
  const curve = smooth(pts.map((p, i) => ({ v: p.value, i })));
  const area = pts.length ? `${curve} L${x(pts.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : "";
  const prevCurve = prev ? smooth(prev.slice(0, n).map((p, i) => ({ v: p.value, i }))) : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const labelEvery = Math.max(1, Math.ceil(n / (bucket === "hour" ? 8 : 9)));
  const hp = hover !== null ? series[hover] : null;
  const pp = hover !== null && prev ? prev[hover] : null;
  const fmtY = (v: number) => (yDuration ? fmtDuration(v) : v >= 1000 ? `${Math.round(v / 100) / 10}k` : nf(v));
  const tipLeft = hover !== null ? (x(hover) / W) * 100 : 0;
  const flip = tipLeft > 62;

  return (
    <div className="an2-trend" style={{ ["--an2-h" as string]: `${H}px` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${name} over time`}
        className="an2-trend-svg"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - L) / (W - L - R)) * (n - 1));
          setHover(n ? Math.max(0, Math.min(n - 1, i)) : null);
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`ar${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--an2-red)" stopOpacity="0.30" />
            <stop offset="1" stopColor="var(--an2-red)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="an2-gridline" />
            <text x={L - 9} y={y(t) + 4} textAnchor="end" className="an2-axis">{fmtY(t)}</text>
          </g>
        ))}
        {series.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="an2-axis">
              {bucket === "hour" ? p.label : shortLabel(p.label)}
            </text>
          ) : null,
        )}
        {prevCurve ? <path d={prevCurve} className="an2-line-prev" /> : null}
        {area ? <path d={area} fill={`url(#ar${gid})`} /> : null}
        {curve ? <path d={curve} className="an2-line-main" /> : null}
        {hover !== null && !hp?.future ? (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} className="an2-cross" />
            {pp ? <circle cx={x(hover)} cy={y(pp.value)} r="4" className="an2-dot-prev" /> : null}
            <circle cx={x(hover)} cy={y(hp ? hp.value : 0)} r="5.5" className="an2-dot-main" />
          </>
        ) : null}
      </svg>
      {hp && hover !== null ? (
        <div className={`an2-tip${flip ? " is-flip" : ""}`} style={{ left: `${tipLeft}%` }} role="status">
          <span className="an2-tip-title">{longLabel(hp.label, bucket)}</span>
          {hp.future ? (
            <span className="an2-tip-muted">Not yet</span>
          ) : (
            <>
              <span className="an2-tip-row"><i className="an2-sw is-red" />{unit}<strong>{format(hp.value)}</strong></span>
              {pp ? <span className="an2-tip-row"><i className="an2-sw is-prev" />Previous period<strong>{format(pp.value)}</strong></span> : null}
              {hp.extra?.map((e) => (
                <span key={e.name} className="an2-tip-row is-sub">{e.name}<strong>{e.text}</strong></span>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ───────────── Heatmap ───────────── */
export function Heatmap({ grid }: { grid: number[][] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const full = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const max = Math.max(1, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ d: number; h: number; x: number; y: number } | null>(null);
  const h12 = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "pm" : "am"}`;
  return (
    <div className="an2-heat" ref={wrap} onPointerLeave={() => setTip(null)}>
      <div className="an2-heat-grid" role="img" aria-label="Page views by weekday and hour">
        <div className="an2-heat-row">
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="an2-heat-h">{h % 3 === 0 ? h12(h) : ""}</span>
          ))}
        </div>
        {grid.map((row, d) => (
          <div key={days[d]} className="an2-heat-row">
            <span className="an2-heat-d">{days[d]}</span>
            {row.map((n, h) => (
              <span
                key={h}
                className={`an2-heat-c${tip && tip.d === d && tip.h === h ? " is-on" : ""}`}
                style={{ ["--lv" as string]: n === 0 ? 0 : 0.16 + 0.84 * Math.sqrt(n / max) } as CSSProperties}
                onPointerEnter={(e) => {
                  const box = wrap.current?.getBoundingClientRect();
                  const r = e.currentTarget.getBoundingClientRect();
                  if (box) setTip({ d, h, x: r.left - box.left + r.width / 2, y: r.top - box.top });
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="an2-heat-legend"><span>Quiet</span><i /><span>Busy</span></div>
      {tip ? (
        <div className="an2-tip is-pin" style={{ left: tip.x, top: tip.y }}>
          <span className="an2-tip-title">{full[tip.d]}, {h12(tip.h)}–{h12((tip.h + 1) % 24)}</span>
          <span className="an2-tip-row">Page views<strong>{nf(grid[tip.d][tip.h])}</strong></span>
          <span className="an2-tip-row is-sub">Share of all views<strong>{total ? Math.round((grid[tip.d][tip.h] / total) * 1000) / 10 : 0}%</strong></span>
        </div>
      ) : null}
    </div>
  );
}

/* ───────────── Horizontal bars ───────────── */
export type BarRow = { key: string; label: string; flag?: string; sub?: string; value: number; display: string; note?: string; tone?: "accent" | "steel" | "good" | "warn" };

export function HBars({ rows, max, rank }: { rows: BarRow[]; max?: number; rank?: boolean }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className={`an2-hbars${rank ? " has-rank" : ""}`}>
      {rows.map((r, i) => (
        <li key={r.key} title={r.sub ? `${r.label} — ${r.sub}` : r.label}>
          {rank ? <span className="an2-rank">{i + 1}</span> : null}
          <div className="an2-hbar-main">
            <div className="an2-hbar-top">
              <span className="an2-hbar-label">{r.flag ? <span className="an2-flag" aria-hidden="true">{r.flag}</span> : null}{r.label}</span>
              <span className="an2-hbar-val">
                <strong>{r.display}</strong>
                {r.note ? <em>{r.note}</em> : null}
              </span>
            </div>
            <div className="an2-hbar-track">
              <div className={`an2-hbar-fill is-${r.tone || "accent"}`} style={{ width: `${Math.max(1.5, (r.value / top) * 100)}%`, animationDelay: `${Math.min(i, 12) * 35}ms` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ───────────── Histogram (distributions) ───────────── */
export function Histogram({ buckets, unit, tone = "accent", highlight }: { buckets: Bucket[]; unit: string; tone?: "accent" | "steel"; highlight?: number }) {
  const max = Math.max(1, ...buckets.map((b) => b.value));
  const [hot, setHot] = useState<number | null>(null);
  return (
    <div className="an2-hist" role="img" aria-label={`Distribution of ${unit}`}>
      <div className="an2-hist-cols">
        {buckets.map((b, i) => (
          <div
            key={b.label}
            className={`an2-hist-col${hot === i ? " is-on" : ""}`}
            onPointerEnter={() => setHot(i)}
            onPointerLeave={() => setHot(null)}
            tabIndex={0}
            onFocus={() => setHot(i)}
            onBlur={() => setHot(null)}
          >
            <span className="an2-hist-pct">{b.share}%</span>
            <div className="an2-hist-bar-wrap">
              <div
                className={`an2-hist-bar is-${tone}${highlight === i ? " is-key" : ""}`}
                style={{ height: `${Math.max(b.value ? 3 : 0, (b.value / max) * 100)}%`, animationDelay: `${i * 45}ms` }}
              />
            </div>
            <span className="an2-hist-label">{b.label}</span>
            {hot === i ? (
              <span className="an2-tip is-hist" role="status">
                <span className="an2-tip-title">{b.label}</span>
                <span className="an2-tip-row">{unit}<strong>{nf(b.value)}</strong></span>
                <span className="an2-tip-row is-sub">Share<strong>{b.share}%</strong></span>
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Stacked share bar (new vs returning) ───────────── */
export function StackedBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((a, b) => a + b.value, 0);
  return (
    <div className="an2-stack">
      <div className="an2-stack-bar" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
        {parts.map((p) =>
          p.value > 0 ? (
            <div key={p.label} style={{ width: `${(p.value / Math.max(1, total)) * 100}%`, background: p.color }} title={`${p.label}: ${nf(p.value)} (${Math.round((p.value / total) * 100)}%)`}>
              <span>{Math.round((p.value / total) * 100)}%</span>
            </div>
          ) : null,
        )}
        {total === 0 ? <div className="is-empty" /> : null}
      </div>
      <ul className="an2-stack-legend">
        {parts.map((p) => (
          <li key={p.label}>
            <i style={{ background: p.color }} />
            {p.label}
            <strong>{nf(p.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────── Realtime: page views per minute ───────────── */
export function MinuteBars({ minutes }: { minutes: number[] }) {
  const max = Math.max(1, ...minutes);
  return (
    <div className="an2-minutes" role="img" aria-label="Page views per minute, last 30 minutes">
      <div className="an2-minutes-bars">
        {minutes.map((m, i) => (
          <i key={i} title={`${30 - i - 1} min ago: ${m} view${m === 1 ? "" : "s"}`} style={{ height: `${Math.max(m ? 8 : 3, (m / max) * 100)}%` }} className={m ? "has" : ""} />
        ))}
      </div>
      <div className="an2-minutes-axis"><span>30 min ago</span><span>now</span></div>
    </div>
  );
}

/* ───────────── Actions over time (stacked columns) ───────────── */
export const ACTION_COLORS: Record<string, string> = {
  download: "var(--an2-red)",
  qr: "var(--an2-ink-2)",
  whatsapp: "var(--an2-good)",
  phone: "var(--an2-s3)",
  email: "var(--an2-s4)",
  outbound: "var(--an2-s5)",
  form: "var(--an2-s6)",
};

export function ActionsChart({ points, bucket }: { points: ActionPoint[]; bucket: "hour" | "day" | "week" }) {
  const [hover, setHover] = useState<number | null>(null);
  const types = Object.keys(EVENT_LABELS);
  const W = 860;
  const H = 220;
  const L = 36;
  const R = 8;
  const T = 12;
  const B = 28;
  const n = points.length;
  const top = niceMax(Math.max(...points.map((p) => p.total), 0));
  const slot = (W - L - R) / Math.max(1, n);
  const bw = Math.max(2, Math.min(34, slot * 0.66));
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const labelEvery = Math.max(1, Math.ceil(n / (bucket === "hour" ? 8 : 9)));
  const hp = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? ((L + slot * (hover + 0.5)) / W) * 100 : 0;
  return (
    <div className="an2-trend" style={{ ["--an2-h" as string]: `${H}px` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="an2-trend-svg" role="img" aria-label="Actions over time" onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * W;
        const i = Math.floor((px - L) / slot);
        setHover(i >= 0 && i < n ? i : null);
      }} onPointerLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={L} x2={W - R} y1={y(f * top)} y2={y(f * top)} className="an2-gridline" />
            <text x={L - 8} y={y(f * top) + 4} textAnchor="end" className="an2-axis">{nf(f * top)}</text>
          </g>
        ))}
        {points.map((p, i) => {
          let acc = 0;
          const cx = L + slot * (i + 0.5);
          return (
            <g key={i} opacity={hover === null || hover === i ? 1 : 0.55}>
              {types.map((t) => {
                const v = p.counts[t] || 0;
                if (!v) return null;
                const y1 = y(acc + v);
                const y0 = y(acc);
                acc += v;
                return <rect key={t} x={cx - bw / 2} y={y1} width={bw} height={Math.max(1, y0 - y1 - 0.6)} fill={ACTION_COLORS[t]} rx={1.5} />;
              })}
              {i % labelEvery === 0 ? <text x={cx} y={H - 9} textAnchor="middle" className="an2-axis">{bucket === "hour" ? p.label : shortLabel(p.label)}</text> : null}
            </g>
          );
        })}
      </svg>
      {hp && hover !== null ? (
        <div className={`an2-tip${tipLeft > 62 ? " is-flip" : ""}`} style={{ left: `${tipLeft}%` }} role="status">
          <span className="an2-tip-title">{longLabel(hp.label, bucket)}</span>
          {hp.total === 0 ? <span className="an2-tip-muted">No actions</span> : types.filter((t) => hp.counts[t]).map((t) => (
            <span key={t} className="an2-tip-row"><i className="an2-sw" style={{ background: ACTION_COLORS[t] }} />{EVENT_LABELS[t]}<strong>{hp.counts[t]}</strong></span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
