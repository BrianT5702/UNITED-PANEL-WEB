"use client";

import { useMemo, useState, type ReactNode } from "react";
import { fmtDuration, type PageRow } from "@/lib/analytics-types";
import { Icon, type IconName } from "./icons";
import { Sparkline, nf } from "./charts";

/* ───────────── deltas ───────────── */
export type Delta = { text: string; dir: "up" | "down" | "flat"; good: boolean | null } | null;

export function delta(cur: number, prev: number | undefined | null, lowerIsBetter = false): Delta {
  if (prev === undefined || prev === null) return null;
  if (prev === 0 && cur === 0) return { text: "0%", dir: "flat", good: null };
  if (prev === 0) return { text: "new", dir: "up", good: !lowerIsBetter };
  const p = ((cur - prev) / prev) * 100;
  if (Math.abs(p) < 0.5) return { text: "0%", dir: "flat", good: null };
  const dir = p > 0 ? "up" : "down";
  return {
    text: `${Math.abs(p) >= 100 ? Math.round(Math.abs(p)) : Math.abs(p).toFixed(1)}%`,
    dir,
    good: lowerIsBetter ? dir === "down" : dir === "up",
  };
}

export function DeltaPill({ d, label }: { d: Delta; label?: string }) {
  if (!d) return <span className="an2-delta is-none" title="Comparison is switched off">–</span>;
  return (
    <span
      className={`an2-delta is-${d.dir}${d.good === true ? " is-good" : d.good === false ? " is-bad" : ""}`}
      title={label ?? "Compared with the previous period"}
    >
      <span aria-hidden="true">{d.dir === "up" ? "▲" : d.dir === "down" ? "▼" : "▬"}</span> {d.text}
    </span>
  );
}

/* ───────────── "?" help bubble (plain-language explanation) ───────────── */
export function HelpTip({ text, align = "left" }: { text: string; align?: "left" | "right" }) {
  return (
    <span className={`an2-help${align === "right" ? " is-right" : ""}`} tabIndex={0} role="note" aria-label={text} data-tip={text}>
      ?
    </span>
  );
}

/* ───────────── KPI card ───────────── */
export function KpiCard({
  icon,
  label,
  value,
  sub,
  d,
  help,
  spark,
  sparkFuture,
  sparkTone,
  invertTone,
}: {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
  d: Delta;
  help: string;
  spark?: number[];
  sparkFuture?: boolean[];
  sparkTone?: "accent" | "good" | "bad" | "steel";
  invertTone?: boolean;
}) {
  void invertTone;
  return (
    <div className="an2-kpi">
      <div className="an2-kpi-head">
        <span className="an2-kpi-ic"><Icon name={icon} size={16} /></span>
        <span className="an2-kpi-label">{label}</span>
        <HelpTip text={help} align="right" />
      </div>
      <strong className="an2-kpi-value">{value}</strong>
      <div className="an2-kpi-foot">
        <DeltaPill d={d} />
        {sub ? <span className="an2-kpi-sub">{sub}</span> : <span className="an2-kpi-sub">vs previous</span>}
      </div>
      {spark ? <div className="an2-kpi-spark"><Sparkline values={spark} future={sparkFuture} tone={sparkTone ?? "accent"} /></div> : null}
    </div>
  );
}

/* ───────────── Cards / headings ───────────── */
export function Section({ id, icon, title, blurb, children }: { id: string; icon: IconName; title: string; blurb?: string; children: ReactNode }) {
  return (
    <section id={id} className="an2-section" aria-labelledby={`${id}-h`}>
      <header className="an2-section-head">
        <span className="an2-section-ic"><Icon name={icon} size={18} /></span>
        <div>
          <h2 id={`${id}-h`}>{title}</h2>
          {blurb ? <p>{blurb}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Card({
  title,
  hint,
  help,
  actions,
  children,
  className,
  icon,
}: {
  title: string;
  hint?: string;
  help?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: IconName;
}) {
  return (
    <article className={`an2-card${className ? ` ${className}` : ""}`}>
      <header className="an2-card-head">
        <div className="an2-card-title">
          {icon ? <Icon name={icon} size={16} /> : null}
          <div>
            <h3>{title}{help ? <HelpTip text={help} /> : null}</h3>
            {hint ? <p>{hint}</p> : null}
          </div>
        </div>
        {actions ? <div className="an2-card-actions">{actions}</div> : null}
      </header>
      {children}
    </article>
  );
}

export function EmptyLine({ children }: { children?: ReactNode }) {
  return (
    <div className="an2-empty-line">
      <Icon name="chart" size={22} />
      <span>{children || "Nothing to show for this period yet."}</span>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div className="an2-seg-sm" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? "is-active" : ""} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ───────────── Simple tables ───────────── */
export function MiniTable({ head, rows, empty }: { head: { label: string; num?: boolean; title?: string }[]; rows: ReactNode[][]; empty?: string }) {
  if (!rows.length) return <EmptyLine>{empty}</EmptyLine>;
  return (
    <div className="an2-table-wrap">
      <table className="an2-table">
        <thead>
          <tr>{head.map((h) => <th key={h.label} className={h.num ? "is-num" : undefined} title={h.title}>{h.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className={head[j]?.num ? "is-num" : undefined}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ShareCell({ n }: { n: number }) {
  return (
    <span className="an2-share">
      <i style={{ width: `${Math.min(100, n)}%` }} />
      <b>{n}%</b>
    </span>
  );
}

export function PageCell({ label, path }: { label: string; path: string }) {
  return (
    <span className="an2-page-cell">
      <strong>{label}</strong>
      {label !== path ? <small>{path}</small> : null}
    </span>
  );
}

/* ───────────── Top pages: sortable + searchable + inline bars ───────────── */
type SortKey = "label" | "views" | "visitors" | "avgTimeSec" | "avgScrollPct" | "bounceRate";

function BarCell({ value, max, text, tone = "accent" }: { value: number; max: number; text: string; tone?: "accent" | "steel" | "warn" }) {
  return (
    <span className="an2-barcell">
      <i className={`is-${tone}`} style={{ width: `${max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0}%` }} />
      <b>{text}</b>
    </span>
  );
}

export function PagesTable({ rows, totalViews, pageCount }: { rows: PageRow[]; totalViews: number; pageCount: number }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "views", dir: "desc" });
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? rows.filter((r) => r.label.toLowerCase().includes(needle) || r.path.toLowerCase().includes(needle)) : rows;
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === "label") return a.label.localeCompare(b.label) * mul;
      const av = a[sort.key] as number;
      const bv = b[sort.key] as number;
      return (av - bv) * mul || b.views - a.views;
    });
  }, [rows, q, sort]);

  const shown = all || q ? filtered : filtered.slice(0, 10);
  const maxViews = Math.max(1, ...rows.map((r) => r.views));
  const maxTime = Math.max(1, ...rows.map((r) => r.avgTimeSec));
  const maxVisitors = Math.max(1, ...rows.map((r) => r.visitors));

  const th = (key: SortKey, label: string, title: string, num = true) => {
    const active = sort.key === key;
    return (
      <th className={num ? "is-num" : undefined} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} title={title}>
        <button type="button" className={`an2-sort${active ? " is-active" : ""}`} onClick={() => setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: key === "label" ? "asc" : "desc" }))}>
          {label}
          <Icon name={active ? (sort.dir === "asc" ? "sortUp" : "sortDown") : "sort"} size={13} />
        </button>
      </th>
    );
  };

  return (
    <div>
      <div className="an2-table-tools">
        <label className="an2-search">
          <Icon name="search" size={15} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages…" aria-label="Search pages" />
        </label>
        <span className="an2-table-count">{q ? `${filtered.length} of ${rows.length} pages` : `${nf(pageCount)} page${pageCount === 1 ? "" : "s"} viewed`}</span>
      </div>
      {rows.length === 0 ? (
        <EmptyLine>No page views in this period.</EmptyLine>
      ) : (
        <div className="an2-table-wrap">
          <table className="an2-table is-pages">
            <thead>
              <tr>
                {th("label", "Page", "Sort by page name", false)}
                {th("views", "Views", "Times the page was opened")}
                {th("visitors", "Visitors", "Unique visitors")}
                {th("avgTimeSec", "Avg. time", "Average active time on the page")}
                {th("avgScrollPct", "Scroll", "How far down the page people read on average")}
                {th("bounceRate", "Bounce", "Visits that started on this page and were not engaged")}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.path}>
                  <td><PageCell label={r.label} path={r.path} /></td>
                  <td className="is-num"><BarCell value={r.views} max={maxViews} text={nf(r.views)} /></td>
                  <td className="is-num"><BarCell value={r.visitors} max={maxVisitors} text={nf(r.visitors)} tone="steel" /></td>
                  <td className="is-num"><BarCell value={r.avgTimeSec} max={maxTime} text={r.avgTimeSec ? fmtDuration(r.avgTimeSec) : "–"} /></td>
                  <td className="is-num"><BarCell value={r.avgScrollPct} max={100} text={r.avgScrollPct ? `${r.avgScrollPct}%` : "–"} tone="steel" /></td>
                  <td className="is-num">{r.entries ? <span className={`an2-chip${r.bounceRate >= 50 ? " is-warn" : r.bounceRate <= 15 ? " is-good" : ""}`}>{r.bounceRate}%</span> : "–"}</td>
                </tr>
              ))}
              {shown.length === 0 ? (
                <tr><td colSpan={6}><EmptyLine>No pages match “{q}”.</EmptyLine></td></tr>
              ) : null}
            </tbody>
            {!q ? (
              <tfoot>
                <tr>
                  <td>All pages</td>
                  <td className="is-num">{nf(totalViews)}</td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      )}
      {!q && filtered.length > 10 ? (
        <button type="button" className="an2-more" onClick={() => setAll((v) => !v)}>
          {all ? "Show fewer pages" : `Show all ${filtered.length} pages`}
          <Icon name="chevronDown" size={14} style={{ transform: all ? "rotate(180deg)" : undefined }} />
        </button>
      ) : null}
    </div>
  );
}

/* ───────────── Loading skeleton ───────────── */
export function DashboardSkeleton() {
  return (
    <div className="an2-skel" aria-busy="true" aria-label="Loading analytics">
      <div className="an2-skel-card is-tall" />
      <div className="an2-skel-grid">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="an2-skel-card" />)}
      </div>
      <div className="an2-skel-row">
        <div className="an2-skel-card is-chart" />
        <div className="an2-skel-card is-chart" />
      </div>
    </div>
  );
}
