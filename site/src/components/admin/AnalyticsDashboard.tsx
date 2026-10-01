"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import {
  EVENT_LABELS,
  RANGE_LABELS,
  countryFlag,
  fmtDuration,
  formatYmd,
  type DashboardData,
  type LiveInfo,
  type RangeKey,
} from "@/lib/analytics-types";
import { Icon, type IconName } from "./analytics/icons";
import {
  ACTION_COLORS,
  ActionsChart,
  HBars,
  Heatmap,
  Histogram,
  MinuteBars,
  StackedBar,
  TrendChart,
  longLabel,
  nf,
  type BarRow,
  type SeriesPoint,
} from "./analytics/charts";
import {
  Card,
  DashboardSkeleton,
  DeltaPill,
  EmptyLine,
  KpiCard,
  MiniTable,
  PagesTable,
  Section,
  Segmented,
  delta,
} from "./analytics/parts";
import { buildCsv } from "./analytics/csv";
import { LocationTree } from "./analytics/locations";

const RANGES: RangeKey[] = ["today", "7d", "30d", "90d", "custom"];
const RANGE_SHORT: Record<RangeKey, string> = { today: "Today", "7d": "7 days", "30d": "30 days", "90d": "90 days", custom: "Custom" };

const SECTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "pages", label: "Pages", icon: "file" },
  { id: "engagement", label: "Engagement", icon: "timer" },
  { id: "countries", label: "Countries", icon: "globe" },
  { id: "actions", label: "Actions", icon: "bolt" },
];

type Metric = "visitors" | "pageviews" | "sessions";
const METRIC_LABEL: Record<Metric, string> = { visitors: "Visitors", pageviews: "Page views", sessions: "Visits" };

const HIGHLIGHT_ICON: Record<string, IconName> = { stay: "clock", views: "eye", country: "globe", busy: "calendar", engaged: "target", download: "download", newret: "repeat", pps: "layers", scroll: "scroll" };
const ACTION_ICON: Record<string, IconName> = { download: "download", qr: "qr", whatsapp: "chat", phone: "phone", email: "mail", outbound: "external", form: "file" };

export function AnalyticsDashboard() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [compare, setCompare] = useState(true);
  const [metric, setMetric] = useState<Metric>("visitors");
  const [data, setData] = useState<DashboardData | null>(null);
  const [live, setLive] = useState<LiveInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState("");
  const [busy, setBusy] = useState(false);
  const [respectDnt, setRespectDnt] = useState<boolean | null>(null);
  const [dntBusy, setDntBusy] = useState(false);
  const [active, setActive] = useState("overview");
  const reqId = useRef(0);
  const [now, setNow] = useState<Date | null>(null);
  const dayAtLoad = useRef("");

  const load = useCallback(
    async (opts: { silent?: boolean; r?: RangeKey; f?: string; t?: string } = {}) => {
      const r = opts.r ?? range;
      const f = opts.f ?? from;
      const t = opts.t ?? to;
      const id = ++reqId.current;
      if (!opts.silent) setLoading(true);
      try {
        const qs = new URLSearchParams({ range: r, compare: compare ? "1" : "0" });
        if (r === "custom") {
          qs.set("from", f);
          qs.set("to", t);
        }
        const res = await fetch(`/api/admin/analytics?${qs}`, { cache: "no-store" });
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const j = (await res.json()) as DashboardData & { error?: string };
        if (!res.ok) throw new Error(j.error || "Could not load analytics.");
        if (id !== reqId.current) return;
        setData(j);
        dayAtLoad.current = new Date().toDateString();
        setLive(j.live);
        setError("");
        if (r === "custom" && (!f || !t)) {
          setFrom(formatYmd(j.range.from, j.tzOffsetMin));
          setTo(formatYmd(j.range.to - 1, j.tzOffsetMin));
        }
      } catch (e) {
        if (id === reqId.current) setError(e instanceof Error ? e.message : "Could not load analytics.");
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [range, from, to, compare],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, compare]);

  // a real, ticking clock (the admin's own device time, so it can never be stale or cached)
  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // live visitors every 30 s; the whole report quietly every 2 min (only while the tab is visible)
  useEffect(() => {
    const tickLive = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/admin/analytics?live=1", { cache: "no-store" });
        if (res.ok) setLive(((await res.json()) as { live: LiveInfo }).live);
      } catch {
        /* keep last value */
      }
    };
    const a = window.setInterval(tickLive, 30_000);
    const b = window.setInterval(() => {
      if (document.visibilityState === "visible") void load({ silent: true });
    }, 120_000);
    return () => {
      window.clearInterval(a);
      window.clearInterval(b);
    };
  }, [load]);

  // highlight the section being read
  useEffect(() => {
    if (!data?.hasData) return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-130px 0px -62% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [data?.hasData]);

  // when the day changes while the page stays open, reload so "Today" and the ranges move on by themselves
  useEffect(() => {
    if (!now || !dayAtLoad.current) return;
    if (now.toDateString() !== dayAtLoad.current && !loading) void load({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now?.getDate()]);

  const tz = data?.tzOffsetMin ?? 480;
  const tzLabel = `UTC${tz >= 0 ? "+" : "−"}${Math.abs(tz) / 60}`;

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  const exportCsv = () => {
    if (!data) return;
    const blob = new Blob([buildCsv(data)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `united-panel-analytics-${formatYmd(data.range.from, tz)}_to_${formatYmd(data.range.to - 1, tz)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/analytics/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { respectDnt?: boolean } | null) => {
        if (alive && j && typeof j.respectDnt === "boolean") setRespectDnt(j.respectDnt);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  async function toggleDnt() {
    if (respectDnt === null || dntBusy) return;
    const next = !respectDnt;
    setDntBusy(true);
    try {
      const res = await fetch("/api/admin/analytics/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respectDnt: next }),
      });
      const j = (await res.json().catch(() => ({}))) as { respectDnt?: boolean; error?: string };
      if (!res.ok || typeof j.respectDnt !== "boolean") throw new Error(j.error || "Could not save the setting.");
      setRespectDnt(j.respectDnt);
      setNote(j.respectDnt ? "Visitors who send “Do Not Track” or “Global Privacy Control” are now skipped." : "Every visitor is now counted, including those who send “Do Not Track”.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not save the setting.");
    } finally {
      setDntBusy(false);
    }
  }

  async function doReset() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/analytics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESET" }),
      });
      if (!res.ok) throw new Error("Reset failed.");
      setResetOpen(false);
      setResetText("");
      setNote("All analytics data was deleted. New visits will be counted from now on.");
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doPurge() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/analytics/purge", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Clean-up failed.");
      const n = j.removed.sessions + j.removed.pageviews + j.removed.events;
      setNote(n ? `Removed ${nf(j.removed.sessions)} old visits (older than ${j.months} months).` : `Nothing to remove: no data is older than ${j.months} months.`);
      await load({ silent: true });
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Clean-up failed.");
    } finally {
      setBusy(false);
    }
  }

  const clock = useMemo(() => {
    if (!now) return null;
    const off = -now.getTimezoneOffset();
    const sign = off >= 0 ? "+" : "−";
    const hh = Math.floor(Math.abs(off) / 60);
    const mm = Math.abs(off) % 60;
    const label = `UTC${sign}${hh}${mm ? `:${String(mm).padStart(2, "0")}` : ""}`;
    const date = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      .format(now)
      .replace(/^(\w{3})\s/, "$1, ");
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(now);
    return { text: `${date} · ${time} · ${label}`, off };
  }, [now]);

  const rangeText = useMemo(() => {
    if (!data) return "";
    const a = formatYmd(data.range.from, tz);
    const b = formatYmd(data.range.to - 1, tz);
    return a === b ? longLabel(a, "day") : `${longLabel(a, "day")} – ${longLabel(b, "day")}`;
  }, [data, tz]);

  const show = data && data.hasData;
  const showEmpty = data && !data.hasData;
  const updated = data ? new Date(data.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className={`ve-root ve-root-site an2-root${loading && data ? " is-loading" : ""}`}>
      <div className="ve-edit-bar">
        <div className="ve-edit-bar-left">
          <span className="ve-edit-pill">Admin</span>
          <strong className="ve-edit-bar-title">Analytics</strong>
          <Link className="ve-tool-btn ve-bar-link" href="/admin/edit">← Back to site editor</Link>
          <Link className="ve-tool-btn ve-bar-link an-hide-sm" href="/admin/catalogues">Catalogues</Link>
          <a className="ve-tool-btn ve-bar-link an-hide-sm" href="/" target="_blank" rel="noreferrer">View live site ↗</a>
        </div>
        <div className="ve-toolbar-actions">
          <ThemeToggle />
          <LogoutButton className="ve-bar-btn" />
        </div>
      </div>

      {/* ───── sticky toolbar ───── */}
      <div className="an2-toolbar">
        <div className="an2-toolbar-in">
          <div className="an2-toolbar-row">
            <div className="an2-brand">
              <span className="an2-brand-ic"><Icon name="activity" size={18} /></span>
              <div>
                <h1>Website analytics</h1>
                <p className="an2-clock" aria-label="Current date and time">
                  <time suppressHydrationWarning>{clock ? clock.text : "…"}</time>
                </p>
                <p className="an2-range" title={clock && clock.off !== tz ? `Report days follow ${tzLabel} (set by ANALYTICS_TZ_OFFSET_MIN)` : undefined}>
                  {rangeText ? <>Showing {rangeText}{clock && clock.off !== tz ? ` · report days in ${tzLabel}` : ""}</> : "Loading…"}
                </p>
              </div>
            </div>
            <div className="an2-controls">
              <div className="an2-seg" role="group" aria-label="Date range">
                {RANGES.map((r) => (
                  <button key={r} type="button" className={range === r ? "is-active" : ""} aria-pressed={range === r} title={RANGE_LABELS[r]} onClick={() => setRange(r)}>
                    {r === "custom" ? <Icon name="calendar" size={14} /> : null}
                    <span className="an2-seg-long">{RANGE_LABELS[r]}</span>
                    <span className="an2-seg-short">{RANGE_SHORT[r]}</span>
                  </button>
                ))}
              </div>
              <button type="button" role="switch" aria-checked={compare} className={`an2-switch${compare ? " is-on" : ""}`} onClick={() => setCompare((v) => !v)} title="Compare with the previous period">
                <i aria-hidden="true" />
                <span>Compare</span>
              </button>
              <span className="an2-live-pill" title="Visitors active on the website in the last 5 minutes" aria-live="polite">
                <i className="an2-pulse" aria-hidden="true" />
                <strong>{live ? live.visitors : "–"}</strong>
                <span>online</span>
              </span>
              <button type="button" className="an2-icon-btn" onClick={() => void load()} disabled={loading} title={data ? `Refresh (updated ${updated})` : "Refresh"} aria-label="Refresh">
                <Icon name="refresh" size={17} className={loading ? "is-spin" : ""} />
              </button>
              <button type="button" className="an2-btn is-primary" onClick={exportCsv} disabled={!show} title="Download everything on this page as a spreadsheet (CSV)">
                <Icon name="export" size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
          {range === "custom" ? (
            <form
              className="an2-custom"
              onSubmit={(e) => {
                e.preventDefault();
                void load();
              }}
            >
              <label>From <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} required /></label>
              <label>To <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} required /></label>
              <button type="submit" className="an2-btn is-primary">Apply</button>
            </form>
          ) : null}
          {show ? (
            <nav className="an2-nav" aria-label="Dashboard sections">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" className={active === s.id ? "is-active" : ""} aria-current={active === s.id ? "true" : undefined} onClick={() => goTo(s.id)}>
                  <Icon name={s.icon} size={15} />
                  {s.label}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="an2-progress" aria-hidden="true"><i /></div>
      </div>

      <main className="an2-page">
        {error ? <p className="an2-alert is-error" role="alert"><Icon name="info" size={16} />{error}</p> : null}
        {note ? <p className="an2-alert" role="status"><Icon name="check" size={16} />{note}<button type="button" onClick={() => setNote("")} aria-label="Dismiss">×</button></p> : null}
        {data && data.sampleSessions > 0 ? (
          <p className="an2-alert is-sample" role="note">
            <Icon name="info" size={16} />
            <span><strong>SAMPLE DATA.</strong> The numbers below are generated demo data for screenshots, not real visitors.</span>
          </p>
        ) : null}

        {!data && !error ? <DashboardSkeleton /> : null}

        {showEmpty ? <EmptyState onRetry={() => void load()} loading={loading} /> : null}

        {show && data ? <Report data={data} live={live} metric={metric} setMetric={setMetric} compare={compare} goTo={goTo} /> : null}

        {data ? (
          <section className="an2-settings" aria-labelledby="an-track-settings">
            <div className="an2-settings-main">
              <h2 id="an-track-settings"><Icon name="shield" size={17} /> Tracking settings</h2>
              <p><strong>Respect visitors&apos; Do Not Track / Global Privacy Control</strong></p>
              <p className="an2-settings-text">
                Some browsers send a “please do not track me” signal. <strong>Off (default):</strong> every visitor is counted anyway. <strong>On:</strong> visitors who send that signal are skipped and do not appear in any number here. Either way, no cookies are used and no IP address is saved.
              </p>
              <p className="an2-settings-state">
                Right now: {respectDnt === null ? "loading…" : respectDnt ? "ON, visitors who send the signal are not counted." : "OFF, everyone is counted."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={respectDnt === true}
              aria-label="Respect visitors' Do Not Track / Global Privacy Control"
              className={`an2-switch${respectDnt ? " is-on" : ""}`}
              onClick={() => void toggleDnt()}
              disabled={respectDnt === null || dntBusy}
            >
              <i />
              {dntBusy ? "Saving…" : respectDnt ? "On" : "Off"}
            </button>
          </section>
        ) : null}

        {data ? (
          <section className="an2-foot">
            <div className="an2-foot-main">
              <h2><Icon name="shield" size={17} /> Data and privacy</h2>
              <ul>
                <li>Tracking is <strong>on</strong> for public pages. It uses no cookies and <strong>stores no IP addresses</strong>, only a random anonymous id kept in the visitor&apos;s browser.</li>
                <li>You, other signed-in editors and bots are never counted.{respectDnt === true ? " Visitors whose browser sends “Do Not Track” or “Global Privacy Control” are also not counted (you can change this in “Tracking settings” above)." : respectDnt === false ? " Visitors are counted even if their browser sends “Do Not Track” or “Global Privacy Control” (you can change this in “Tracking settings” above)." : ""}</li>
                <li>Place is looked up from the visitor&apos;s network address <strong>at the moment of the visit, using files on this server</strong>{data.geo.month ? ` (IP Geolocation by DB-IP, ${data.geo.month})` : ""}. The address is used only for that lookup and is never saved or logged; only the <strong>country, state and city names</strong> are kept, plus a short note when the visit came from a <strong>mobile carrier</strong> (such as “mobile:Maxis”) or a VPN / data centre. This is approximate: the <strong>state</strong> is the dependable level, and a <strong>city is only a rough area</strong>, because the lookup shows where the internet provider&apos;s network is. <strong>On mobile data it usually shows the carrier&apos;s hub</strong>, often in another state, so mobile visits are counted in the country total only and no state or city is kept for them. Visits from your own computer or a private network show as “Local / private network”.</li>
                <li>Data older than 13 months is removed automatically. {data.totalRowsEver ? `${nf(data.totalRowsEver)} visits are stored in total${data.firstSeenAt ? `, the oldest from ${formatYmd(data.firstSeenAt, tz)}` : ""}.` : ""}</li>
              </ul>
            </div>
            <div className="an2-foot-actions">
              <button type="button" className="an2-btn" onClick={doPurge} disabled={busy}><Icon name="trash" size={15} />Delete data older than 13 months</button>
              <button type="button" className="an2-btn is-danger" onClick={() => setResetOpen(true)} disabled={busy}><Icon name="trash" size={15} />Reset analytics data…</button>
            </div>
          </section>
        ) : null}
      </main>

      {resetOpen ? (
        <div className="an2-modal-back" role="presentation" onClick={() => !busy && setResetOpen(false)}>
          <div className="an2-modal" role="dialog" aria-modal="true" aria-labelledby="an-reset-title" onClick={(e) => e.stopPropagation()}>
            <span className="an2-modal-ic"><Icon name="trash" size={22} /></span>
            <h2 id="an-reset-title">Reset all analytics data?</h2>
            <p>This permanently deletes <strong>every</strong> recorded visit, page view and click. It cannot be undone. Your website content is not affected.</p>
            <label>
              Type <code>RESET</code> to confirm
              <input type="text" value={resetText} onChange={(e) => setResetText(e.target.value)} autoFocus autoComplete="off" />
            </label>
            <div className="an2-modal-actions">
              <button type="button" className="an2-btn" onClick={() => setResetOpen(false)} disabled={busy}>Cancel</button>
              <button type="button" className="an2-btn is-danger-solid" onClick={doReset} disabled={busy || resetText.trim().toUpperCase() !== "RESET"}>
                {busy ? "Deleting…" : "Delete everything"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────── empty state ───────────────────────── */
function EmptyState({ onRetry, loading }: { onRetry: () => void; loading: boolean }) {
  return (
    <section className="an2-empty">
      <svg className="an2-empty-art" viewBox="0 0 220 120" aria-hidden="true">
        <rect x="8" y="10" width="204" height="100" rx="12" className="an2-empty-frame" />
        <path d="M24 86 L58 62 L88 72 L124 40 L156 54 L196 28" className="an2-empty-line" />
        <circle cx="196" cy="28" r="5" className="an2-empty-dot" />
        <g className="an2-empty-bars">
          <rect x="30" y="92" width="10" height="8" rx="2" /><rect x="52" y="88" width="10" height="12" rx="2" /><rect x="74" y="94" width="10" height="6" rx="2" />
        </g>
      </svg>
      <h2>No data yet — tracking is active</h2>
      <p>The website is already counting visits. Open any public page in a normal browser window (not while signed in as an editor) and your first numbers will appear here within a minute.</p>
      <ul>
        <li><Icon name="check" size={15} /> Pages, time spent, scroll depth, country, state and city (approximate, from a lookup that never saves the IP address; mobile-data visits are counted by country only) and downloads are collected automatically.</li>
        <li><Icon name="check" size={15} /> No cookies and no IP addresses are stored. Only the country, state and city names are kept, never the address itself.</li>
        <li><Icon name="check" size={15} /> You, other signed-in editors and search-engine bots are never counted.</li>
      </ul>
      <button type="button" className="an2-btn is-primary" onClick={onRetry} disabled={loading}><Icon name="refresh" size={15} />Check again</button>
    </section>
  );
}

/* ───────────────────────── the report ───────────────────────── */
function Report({
  data,
  live,
  metric,
  setMetric,
  compare,
  goTo,
}: {
  data: DashboardData;
  live: LiveInfo | null;
  metric: Metric;
  setMetric: (m: Metric) => void;
  compare: boolean;
  goTo: (id: string) => void;
}) {
  const k = data.kpis;
  const p = data.prev;
  const tr = data.trend;
  const fut = tr.map((t) => t.future);
  const bucket = data.range.bucket;
  void goTo;

  const series = (get: (t: (typeof tr)[number]) => number, extra?: (t: (typeof tr)[number]) => { name: string; text: string }[]): SeriesPoint[] =>
    tr.map((t) => ({ label: t.label, value: get(t), future: t.future, extra: extra?.(t) }));
  const prevSeries = (get: (t: (typeof tr)[number]) => number): SeriesPoint[] | null =>
    compare && data.prevTrend ? data.prevTrend.map((t) => ({ label: t.label, value: get(t) })) : null;

  const trendSeries = series(
    (t) => t[metric],
    (t) => (["visitors", "pageviews", "sessions"] as Metric[]).filter((m) => m !== metric).map((m) => ({ name: METRIC_LABEL[m], text: nf(t[m]) })),
  );

  const totalViews = k.pageviews;
  const topRows: BarRow[] = data.topPages.slice(0, 8).map((r) => ({
    key: r.path,
    label: r.label,
    sub: r.path,
    value: r.views,
    display: nf(r.views),
    note: `${totalViews ? Math.round((r.views / totalViews) * 100) : 0}%`,
  }));

  const timedEnough = data.topPages.filter((r) => r.avgTimeSec > 0 && r.timedViews >= 3);
  const timedPool = timedEnough.length >= 3 ? timedEnough : data.topPages.filter((r) => r.avgTimeSec > 0);
  const stayRows: BarRow[] = [...timedPool]
    .sort((a, b) => b.avgTimeSec - a.avgTimeSec)
    .slice(0, 8)
    .map((r) => ({ key: r.path, label: r.label, sub: r.path, value: r.avgTimeSec, display: fmtDuration(r.avgTimeSec), note: `${nf(r.views)} views`, tone: "accent" }));
  const quickRows: BarRow[] = [...(timedEnough.length >= 3 ? timedEnough : timedPool)]
    .filter((r) => r.quickRate > 0)
    .sort((a, b) => b.quickRate - a.quickRate || a.avgTimeSec - b.avgTimeSec)
    .slice(0, 6)
    .map((r) => ({ key: r.path, label: r.label, sub: r.path, value: r.quickRate, display: `${r.quickRate}%`, note: `avg ${fmtDuration(r.avgTimeSec)}`, tone: "warn" }));

  const countryBars: BarRow[] = data.countries.slice(0, 10).map((r) => ({ key: r.label, label: r.label, flag: countryFlag(r.code), value: r.sessions, display: nf(r.sessions), note: `${r.share}%`, tone: "steel" }));

  const dominantDuration = data.sessionDuration.reduce((best, b, i, a) => (b.value > a[best].value ? i : best), 0);
  const nr = data.newReturning;
  const actionWords = data.eventTotals.map((e) => e.label.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " and $1");
  const otherKinds = data.eventTotals.filter((e) => e.type !== "download" && e.type !== "qr");
  const anyLocal = data.countries.find((c) => c.code === "Local");
  const onlyUnreal = data.countries.every((c) => c.code === "Unknown" || c.code === "Local");
  const engagedN = Math.round((k.sessions * k.engagedRate) / 100);
  const bouncedN = Math.max(0, k.sessions - engagedN);

  return (
    <>
      {/* ═════════ OVERVIEW ═════════ */}
      <Section id="overview" icon="home" title="Overview" blurb="The most important numbers, at a glance.">
        <div className="an2-insight">
          <div className="an2-insight-main">
            <span className="an2-insight-tag"><Icon name="bulb" size={14} /> What stands out</span>
            <p className="an2-insight-head">{data.headline || "Not enough time-on-page data yet. Insights appear as visitors browse."}</p>
            <ul className="an2-insight-list">
              {data.insights.filter((s) => s !== data.headline).slice(0, 5).map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <div className="an2-tiles">
            {data.highlights.slice(0, 6).map((h) => (
              <div key={h.key} className="an2-tile">
                <span className="an2-tile-ic"><Icon name={HIGHLIGHT_ICON[h.key] || "trend"} size={16} /></span>
                <span className="an2-tile-title">{h.title}</span>
                <strong title={h.value}>{h.value}</strong>
                <small>{h.sub}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="an2-kpis">
          <KpiCard icon="users" label="Visitors" value={nf(k.visitors)} d={delta(k.visitors, p?.visitors)} help="Different people (browsers) who visited" spark={tr.map((t) => t.visitors)} sparkFuture={fut} />
          <KpiCard icon="cursor" label="Visits" value={nf(k.sessions)} d={delta(k.sessions, p?.sessions)} help="A visit ends after 30 minutes of inactivity" spark={tr.map((t) => t.sessions)} sparkFuture={fut} />
          <KpiCard icon="eye" label="Page views" value={nf(k.pageviews)} d={delta(k.pageviews, p?.pageviews)} help="Every page opened" spark={tr.map((t) => t.pageviews)} sparkFuture={fut} />
          <KpiCard icon="clock" label="Avg. visit duration" value={fmtDuration(k.avgTimeSec)} d={delta(k.avgTimeSec, p?.avgTimeSec)} help="Active reading time per visit (idle tabs are not counted)" spark={tr.map((t) => t.avgTimeSec)} sparkFuture={fut} sparkTone="steel" />
          <KpiCard icon="layers" label="Pages per visit" value={k.pagesPerSession.toFixed(1)} d={delta(k.pagesPerSession, p?.pagesPerSession)} help="How many pages a visitor opens on average" spark={tr.map((t) => t.pagesPerSession)} sparkFuture={fut} sparkTone="steel" />
          <KpiCard icon="bounce" label="Bounce rate" value={`${k.bounceRate}%`} d={delta(k.bounceRate, p?.bounceRate, true)} help="Visits with one page, under 10 seconds and no action. Lower is better." spark={tr.map((t) => t.bounceRate)} sparkFuture={fut} sparkTone="bad" />
          <KpiCard icon="target" label="Engaged visits" value={`${k.engagedRate}%`} d={delta(k.engagedRate, p?.engagedRate)} help="Visits with 10+ seconds, 2+ pages or an action" spark={tr.map((t) => t.engagedRate)} sparkFuture={fut} sparkTone="good" />
          <KpiCard icon="bolt" label="Actions" value={nf(k.actions)} sub={`${k.actionRate}% of visits`} d={delta(k.actions, p?.actions)} help={`Things visitors did besides reading: ${actionWords}.`} spark={tr.map((t) => t.actions)} sparkFuture={fut} />
        </div>

        <div className="an2-grid is-trend">
          <Card
            title="Traffic over time"
            hint={`${bucket === "hour" ? "By hour" : bucket === "week" ? "By week" : "By day"}${compare ? " · dashed line = previous period" : ""}`}
            icon="trend"
            help="How many people visited on each day (or hour). Hover the chart to see exact numbers. The dashed line is the period just before, so you can see if traffic is growing."
            actions={<Segmented label="Metric" value={metric} onChange={setMetric} options={(["visitors", "pageviews", "sessions"] as Metric[]).map((m) => ({ value: m, label: METRIC_LABEL[m] }))} />}
          >
            <TrendChart series={trendSeries} prev={prevSeries((t) => t[metric])} unit={METRIC_LABEL[metric]} bucket={bucket} name={METRIC_LABEL[metric]} />
          </Card>
          <RealtimeCard live={live} />
        </div>

        <div className="an2-grid">
          <Card title="Busiest times" hint="Page views by weekday and hour" help="Darker squares mean more page views at that day and hour. Use it to pick the best time to publish news or run campaigns." icon="calendar" className="an2-span-2">
            <Heatmap grid={data.heatmap} />
          </Card>
          <Card title="New vs returning" hint="Visitors in this period" help="New visitors came for the first time. Returning visitors have been here before, a sign that people remember and come back." icon="repeat">
            <StackedBar parts={[
              { label: "New visitors", value: nr.newVisitors, color: "var(--an2-red)" },
              { label: "Returning visitors", value: nr.returningVisitors, color: "var(--an2-ink-2)" },
            ]} />
            <div className="an2-split">
              <div><small>New · avg. visit</small><strong>{fmtDuration(nr.newAvgTimeSec)}</strong><em>{nr.newPagesPerSession.toFixed(1)} pages</em></div>
              <div><small>Returning · avg. visit</small><strong>{fmtDuration(nr.returningAvgTimeSec)}</strong><em>{nr.returningPagesPerSession.toFixed(1)} pages</em></div>
            </div>
          </Card>
        </div>

        <div className="an2-grid">
          <Card title="Most viewed pages" hint="Share of all page views" help="The pages opened most often, and the share of all page views each one received." icon="eye" className="an2-span-2">
            {topRows.length ? <HBars rows={topRows} rank /> : <EmptyLine />}
          </Card>
          <Card title="Top countries" hint="Share of visits · approximate" help="Where visits come from, based on the visitor's network location. It is approximate: a visitor on a VPN can appear in a different country. Mobile data is usually placed in the right country." icon="globe">
            {onlyUnreal ? <EmptyLine>{anyLocal ? "These visits came from this computer or a private network, so there is no country yet. Real countries appear once the site is live online." : "No country could be worked out for these visits yet."}</EmptyLine> : countryBars.length ? <HBars rows={countryBars.slice(0, 6)} rank /> : <EmptyLine />}
          </Card>
        </div>
      </Section>

      {/* ═════════ PAGES ═════════ */}
      <Section id="pages" icon="file" title="Pages" blurb="Which pages visitors read, how long they stay and where they leave.">
        <Card title="All pages" hint="Click a column title to sort · bars compare pages with each other" help="Every page that was opened. Views = times opened, Visitors = different people, Avg. time = how long it stayed open and in view, Scroll = how far down people read, Bounce = visits that started here and left quickly." icon="file">
          <PagesTable rows={data.topPages} totalViews={totalViews} pageCount={data.pageCount} />
        </Card>
      </Section>

      {/* ═════════ ENGAGEMENT ═════════ */}
      <Section id="engagement" icon="timer" title="Engagement & time on site" blurb="How long visitors really stay, and whether they read or leave.">
        <div className="an2-kpis is-engage">
          <KpiCard icon="clock" label="Avg. time on site" value={fmtDuration(k.avgTimePerVisitorSec)} sub="per visitor" d={delta(k.avgTimePerVisitorSec, p?.avgTimePerVisitorSec)} help="Total active time divided by the number of visitors" />
          <KpiCard icon="timer" label="Avg. visit duration" value={fmtDuration(k.avgTimeSec)} sub="per visit" d={delta(k.avgTimeSec, p?.avgTimeSec)} help="Average length of one visit" spark={tr.map((t) => t.avgTimeSec)} sparkFuture={fut} sparkTone="steel" />
          <KpiCard icon="activity" label="Median visit" value={fmtDuration(k.medianSessionSec)} sub="typical visit" d={delta(k.medianSessionSec, p?.medianSessionSec)} help="Half of all visits are shorter than this, half are longer" />
          <KpiCard icon="file" label="Time per page" value={fmtDuration(k.avgTimePerPageSec)} sub="avg. per view" d={delta(k.avgTimePerPageSec, p?.avgTimePerPageSec)} help="Average active time on each page view" />
          <KpiCard icon="layers" label="Pages per visit" value={k.pagesPerSession.toFixed(1)} d={delta(k.pagesPerSession, p?.pagesPerSession)} help="How many pages a visitor opens on average" spark={tr.map((t) => t.pagesPerSession)} sparkFuture={fut} sparkTone="steel" />
          <KpiCard icon="bounce" label="Bounce rate" value={`${k.bounceRate}%`} d={delta(k.bounceRate, p?.bounceRate, true)} help="Visits with one page, under 10 seconds and no action. Lower is better." spark={tr.map((t) => t.bounceRate)} sparkFuture={fut} sparkTone="bad" />
          <KpiCard icon="target" label="Engaged visits" value={`${k.engagedRate}%`} d={delta(k.engagedRate, p?.engagedRate)} help="Visits with 10+ seconds, 2+ pages or an action" spark={tr.map((t) => t.engagedRate)} sparkFuture={fut} sparkTone="good" />
          <KpiCard icon="scroll" label="Scroll depth" value={`${k.avgScrollPct}%`} sub="avg. read" d={delta(k.avgScrollPct, p?.avgScrollPct)} help="How far down the page people get on average" />
        </div>

        <div className="an2-grid">
          <Card title="Average visit duration over time" hint="Active time per visit" help="How long a typical visit lasted on each day. Only time with the page open and in use counts, so a forgotten browser tab does not inflate it." icon="clock" className="an2-span-2">
            <TrendChart
              series={series((t) => t.avgTimeSec, (t) => [{ name: "Visits", text: nf(t.sessions) }, { name: "Engaged", text: `${t.engagedRate}%` }])}
              prev={prevSeries((t) => t.avgTimeSec)}
              format={(v) => fmtDuration(v)}
              unit="Avg. visit"
              yDuration
              bucket={bucket}
              height={250}
              name="Average visit duration"
            />
          </Card>
          <Card title="How long visits last" hint={`Most visits: ${data.sessionDuration[dominantDuration]?.label ?? "–"}`} help="Visits grouped by how long they lasted. Many short bars on the left mean people leave quickly; tall bars on the right mean they stay and read." icon="timer">
            <Histogram buckets={data.sessionDuration} unit="Visits" highlight={dominantDuration} />
          </Card>
        </div>

        <div className="an2-grid is-2">
          <Card title="Pages where visitors stay longest" hint="Average active time per view" help="Pages that keep people reading the longest. These are your most interesting pages." icon="clock">
            {stayRows.length ? <HBars rows={stayRows} rank /> : <EmptyLine>Time is measured while a page is open. It appears after a few visits.</EmptyLine>}
          </Card>
          <Card title="Pages people leave quickly" hint="Share of views that lasted under 10 seconds" help="Pages where many visitors spent less than 10 seconds. They may be hard to find, slow, or not what people expected." icon="exit">
            {quickRows.length ? <HBars rows={quickRows} max={100} rank /> : <EmptyLine>No page has a noticeable share of quick exits. Good news.</EmptyLine>}
          </Card>
        </div>

        <div className="an2-grid is-2">
          <Card title="How far visitors scroll" hint="How far down the page visitors got before leaving" help="0–24% means people barely scrolled; 100% means they reached the bottom of the page. More bars on the right means people read the whole page." icon="scroll">
            <Histogram buckets={data.scrollDepth} unit="Page views" tone="steel" />
          </Card>
          <Card title="Visit quality" hint="Engaged visits have 10+ seconds, 2+ pages or an action" help="An engaged visit is one where the person stayed at least 10 seconds, opened 2 or more pages, or did something (download, click). The rest are bounces." icon="target">
            <StackedBar parts={[
              { label: "Engaged visits", value: engagedN, color: "var(--an2-good)" },
              { label: "Bounced visits", value: bouncedN, color: "var(--an2-ink-2)" },
            ]} />
            <div className="an2-split">
              <div><small>Median visit</small><strong>{fmtDuration(k.medianSessionSec)}</strong><em>half of visits are shorter</em></div>
              <div><small>Avg. scroll depth</small><strong>{k.avgScrollPct}%</strong><em>of the page is read</em></div>
            </div>
          </Card>
        </div>
      </Section>

      {/* ═════════ COUNTRIES ═════════ */}
      <Section id="countries" icon="globe" title="Countries" blurb="Where your visitors are: country first, then state, then the nearby city or area, and how long each place stays.">
        <div className="an2-grid">
          <Card
            title="Where visitors are"
            hint="Country, then state, then area · click a row to open it"
            help="Click a country to see its states, a state to see its cities or areas, and an area such as Greater Johor Bahru to see the towns grouped in it. The state is the dependable level. Cities are approximate because a network address cannot tell nearby towns apart. Visits on mobile data are counted in the country total only (their own row), because the location then shows the carrier's hub, not the visitor. Visits are how many times people came; visitors are different people; avg. visit is how long they stayed."
            icon="globe"
            className="an2-span-2"
          >
            <p className="an2-note is-quiet">
              The <strong>state</strong> is the level to trust. <strong>Cities are approximate</strong>: they come from the visitor&apos;s network location, so nearby towns are grouped into an area (for example Greater Johor Bahru) and the specific towns are shown underneath. On <strong>mobile data</strong> the location is usually the carrier&apos;s hub, often in another state, so those visits are counted in the country only and shown in their own “Mobile network (location unreliable)” row.
            </p>
            {data.networkTotals.mobile + data.networkTotals.hosting > 0 ? (
              <p className="an2-note">
                <strong>{nf(data.networkTotals.mobile)}</strong> visit{data.networkTotals.mobile === 1 ? "" : "s"} came from a mobile network
                {data.networkTotals.hosting > 0 ? <> and <strong>{nf(data.networkTotals.hosting)}</strong> from a VPN or data centre</> : null}
                {data.networkTotals.known > 0 ? ` (${Math.round(((data.networkTotals.mobile + data.networkTotals.hosting) / data.networkTotals.known) * 100)}% of visits with a known country)` : ""}. They are in the country totals but not in any state or city.
              </p>
            ) : null}
            {anyLocal ? (
              <p className="an2-note">
                <strong>{nf(anyLocal.sessions)}</strong> visit{anyLocal.sessions === 1 ? "" : "s"} came from this computer or a private network (shown as “Local / private network”). That is normal while you are testing on localhost. Real places appear once the website is live online.
              </p>
            ) : null}
            {!data.geo.available ? <p className="an2-note">The location file is missing on this computer (run <code>npm run geoip:update</code>), so new visits will show “Unknown location” unless the web host sends a country.</p> : !data.geo.city ? <p className="an2-note">Only the country file is installed, so states and cities cannot be worked out. Run <code>npm run geoip:update</code> to add them.</p> : !data.geo.asn ? <p className="an2-note">The mobile-network file is missing, so mobile-data visits cannot be told apart and their state and city may be wrong. Run <code>npm run geoip:update</code> to add it.</p> : null}
            {data.locations.length ? <LocationTree rows={data.locations} /> : <EmptyLine />}
          </Card>
          <div className="an2-loc-side">
            <Card title="Top states" hint="Share of visits · state is the reliable level" help="The states or regions that send the most visits. Visits on mobile data or a VPN are left out here (their state is unreliable) but they are still counted in the country totals." icon="globe">
              {data.topStates.length ? (
                <HBars
                  rows={data.topStates.slice(0, 8).map((r) => ({ key: `${r.code}|${r.label}`, label: r.label, flag: countryFlag(r.code), sub: r.country, value: r.sessions, display: nf(r.sessions), note: `${r.share}%`, tone: "accent" as const }))}
                  rank
                />
              ) : (
                <EmptyLine>No state could be worked out yet. States appear for real visitors once the site is live online.</EmptyLine>
              )}
            </Card>
            <Card title="Top countries" hint="Share of visits · approximate" help="The countries that send the most visits, based on the visitor's network location. It is approximate: a visitor on a VPN can appear in a different country." icon="chart">
              {countryBars.length ? <HBars rows={countryBars.slice(0, 8)} rank /> : <EmptyLine />}
            </Card>
          </div>
        </div>
      </Section>

      {/* ═════════ ACTIONS ═════════ */}
      <Section id="actions" icon="bolt" title="Actions" blurb={`What visitors do: ${actionWords}.`}>
        <div className="an2-actions">
          {data.eventTotals.map((e) => (
            <div key={e.type} className="an2-action">
              <span className="an2-action-ic" style={{ color: ACTION_COLORS[e.type] }}><Icon name={ACTION_ICON[e.type] || "bolt"} size={18} /></span>
              <div>
                <small>{EVENT_LABELS[e.type]}</small>
                <strong>{nf(e.count)}</strong>
              </div>
              <DeltaPill d={delta(e.count, e.prev)} />
            </div>
          ))}
        </div>
        {data.hiddenActions.length ? (
          <p className="an2-note is-quiet">
            <strong>Not shown:</strong> {data.hiddenActions.map((h) => h.label.toLowerCase()).join(", ")}. The website has no such links right now (the email address and phone numbers on the Contact page are plain text, not clickable links), so there is nothing to count. They appear here automatically once a link is added.
          </p>
        ) : null}
        <div className="an2-grid">
          <Card title="Actions over time" hint="All actions, stacked by type" help="Every counted action per day, coloured by kind. A rising line means more visitors are doing something useful on the site." icon="bolt" className="an2-span-2">
            <ActionsChart points={data.actionTrend} bucket={bucket} />
            <ul className="an2-chips">
              {data.eventTotals.filter((e) => e.count > 0).map((e) => (
                <li key={e.type}><i style={{ background: ACTION_COLORS[e.type] }} />{e.label}</li>
              ))}
            </ul>
          </Card>
          <Card title="Action rate" hint="Visits with at least one action" help="The share of visits where the person did at least one counted action (for example downloaded a catalogue)." icon="target">
            <div className="an2-bigstat">
              <strong>{k.actionRate}%</strong>
              <span>of visits did something: {nf(k.actions)} actions in {nf(k.sessions)} visits</span>
              <DeltaPill d={delta(k.actionRate, p?.actionRate)} />
            </div>
          </Card>
        </div>
        <Card title="Catalogues, downloads and QR scans" hint="Names come from the Catalogues manager" help="Opens = the catalogue page was viewed. QR scans = someone scanned the printed QR code. Downloads = the file was saved." icon="download">
          <MiniTable
            empty="No catalogue opens, downloads or QR scans in this period."
            head={[
              { label: "Document" },
              { label: "Type" },
              { label: "Opens", num: true, title: "Times the catalogue page was opened" },
              { label: "QR scans", num: true, title: "Opened by scanning the printed QR code from outside the website" },
              { label: "Downloads", num: true },
              { label: "Visitors", num: true },
            ]}
            rows={data.downloads.map((r) => [
              r.id ? <Link key="n" href={`/r/${r.id}`} target="_blank" className="an2-link">{r.label}</Link> : r.label,
              r.kind ? r.kind.charAt(0).toUpperCase() + r.kind.slice(1) : "–",
              nf(r.opens),
              nf(r.qrScans),
              nf(r.downloads),
              nf(r.visitors),
            ])}
          />
        </Card>
        {otherKinds.length ? (
          <Card title={otherKinds.length === 1 ? `${otherKinds[0].label}s` : "Outbound and contact clicks"} hint={`Counted: ${otherKinds.map((e) => e.label.toLowerCase()).join(", ")}`} help="Which links visitors clicked to leave your site or contact you, and how often." icon="external">
            <MiniTable
              empty="No clicks of this kind in this period."
              head={[{ label: "Type" }, { label: "Where to" }, { label: "Clicks", num: true }, { label: "Visitors", num: true }]}
              rows={data.clicks.map((r) => [<span key="t" className="an2-src"><Icon name={ACTION_ICON[r.type] || "bolt"} size={15} />{r.typeLabel}</span>, <span key="w" className="an2-wrap">{r.target}</span>, nf(r.clicks), nf(r.visitors)])}
            />
          </Card>
        ) : null}
      </Section>
    </>
  );
}

/* ───────────────────────── realtime ───────────────────────── */
function RealtimeCard({ live }: { live: LiveInfo | null }) {
  const maxP = Math.max(1, ...(live?.pages.map((p) => p.visitors) ?? [1]));
  return (
    <Card title="Realtime" hint="Last 5 minutes · updates every 30 s" help="People who have the website open right now (active in the last 5 minutes), and the pages they are looking at." icon="activity" className="an2-realtime">
      <div className="an2-rt-top">
        <span className="an2-rt-num"><i className="an2-pulse" aria-hidden="true" />{live ? live.visitors : "–"}</span>
        <span className="an2-rt-label">{live?.visitors === 1 ? "visitor online now" : "visitors online now"}</span>
      </div>
      {live ? <MinuteBars minutes={live.minutes} /> : null}
      <h4 className="an2-rt-h">Pages being viewed now</h4>
      {live && live.pages.length ? (
        <ul className="an2-rt-list">
          {live.pages.map((pg) => (
            <li key={pg.path} title={pg.path}>
              <span>{pg.label}</span>
              <i style={{ width: `${(pg.visitors / maxP) * 100}%` }} />
              <strong>{pg.visitors}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="an2-rt-none">Nobody is on the website right now.</p>
      )}
      {live && live.countries.length ? (
        <div className="an2-rt-meta">
          {live.countries.filter((c) => c.code !== "Unknown").map((c) => <span key={c.code}><span className="an2-flag" aria-hidden="true">{countryFlag(c.code)}</span>{c.label} {c.visitors}</span>)}
        </div>
      ) : null}
    </Card>
  );
}
