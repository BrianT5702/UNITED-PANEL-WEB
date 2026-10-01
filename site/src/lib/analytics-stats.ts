import { prisma } from "./db";
import { SITE_PAGES } from "./pages";
import { getAllSitePages } from "./content";
import { getSiteLinkKinds } from "./analytics-site-links";
import { geoStatus } from "./geoip";
import { areaOfCity } from "./metro-areas";
import {
  EVENT_LABELS,
  fmtDuration,
  formatYmd,
  resolveRange,
  type ActionPoint,
  type Bucket,
  type ClickRow,
  type CountRow,
  type AreaNode,
  type CountryNode,
  type NetworkNode,
  type PlaceStat,
  type DashboardData,
  type DownloadRow,
  type Highlight,
  type Kpis,
  type LiveInfo,
  type PageRow,
  type ResolvedRange,
  type TrendPoint,
} from "./analytics-types";

const DAY = 86_400_000;
/** A visit is "engaged" when it has 10 s+ of active time, or 2+ pages, or an action. Everything else is a bounce. */
const ENGAGED_SECONDS = 10;
const LIVE_WINDOW_MS = 5 * 60_000;
const ROW_CAP = 400_000;
const PAGE_ROWS_CAP = 300;

export function analyticsTzOffsetMin(): number {
  const n = Number(process.env.ANALYTICS_TZ_OFFSET_MIN);
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : 480; // default: Malaysia (UTC+8)
}

type SessionRow = {
  id: string;
  visitorId: string;
  startedAt: Date;
  lastSeenAt: Date;
  country: string;
  region: string | null;
  city: string | null;
  network: string | null;
  entryPath: string;
  pageviews: number;
  isNewVisitor: boolean;
};
type ViewRow = { sessionId: string; visitorId: string; path: string; createdAt: Date; activeMs: number; scrollPct: number };
type EventRow = { sessionId: string; type: string; path: string; target: string | null; label: string | null; visitorId: string; createdAt: Date };

const sessionSelect = {
  id: true,
  visitorId: true,
  startedAt: true,
  lastSeenAt: true,
  country: true,
  region: true,
  city: true,
  network: true,
  entryPath: true,
  pageviews: true,
  isNewVisitor: true,
} as const;
const viewSelect = { sessionId: true, visitorId: true, path: true, createdAt: true, activeMs: true, scrollPct: true } as const;
const eventSelect = { sessionId: true, type: true, path: true, target: true, label: true, visitorId: true, createdAt: true } as const;

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
const avg = (sum: number, n: number) => (n > 0 ? sum / n : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

function median(values: number[]): number {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Everything we need to judge a set of visits, computed once and shared by cards, charts and tables. */
class Facts {
  timeMs = new Map<string, number>();
  actionSessions = new Set<string>();
  constructor(
    public sessions: SessionRow[],
    public views: ViewRow[],
    public events: EventRow[],
  ) {
    for (const v of views) this.timeMs.set(v.sessionId, (this.timeMs.get(v.sessionId) || 0) + v.activeMs);
    for (const e of events) this.actionSessions.add(e.sessionId);
  }
  sessionSec(s: SessionRow) {
    return (this.timeMs.get(s.id) || 0) / 1000;
  }
  engaged(s: SessionRow) {
    return this.sessionSec(s) >= ENGAGED_SECONDS || s.pageviews >= 2 || this.actionSessions.has(s.id);
  }
  bounced(s: SessionRow) {
    return !this.engaged(s);
  }
}

function computeKpis(f: Facts): Kpis {
  const { sessions, views, events } = f;
  const visitors = new Set<string>();
  const newV = new Set<string>();
  let totalTime = 0;
  let bounces = 0;
  let engaged = 0;
  let pvSum = 0;
  let withAction = 0;
  const durations: number[] = [];
  for (const s of sessions) {
    visitors.add(s.visitorId);
    if (s.isNewVisitor) newV.add(s.visitorId);
    const sec = f.sessionSec(s);
    totalTime += sec;
    durations.push(sec);
    pvSum += s.pageviews;
    if (f.engaged(s)) engaged += 1;
    else bounces += 1;
    if (f.actionSessions.has(s.id)) withAction += 1;
  }
  let scrollSum = 0;
  let scrollN = 0;
  let pageTime = 0;
  let pageTimeN = 0;
  for (const v of views) {
    if (v.activeMs > 0 || v.scrollPct > 0) {
      scrollSum += v.scrollPct;
      scrollN += 1;
    }
    if (v.activeMs > 0) {
      pageTime += v.activeMs;
      pageTimeN += 1;
    }
  }
  return {
    visitors: visitors.size,
    sessions: sessions.length,
    pageviews: views.length,
    avgTimeSec: avg(totalTime, sessions.length),
    avgTimePerVisitorSec: avg(totalTime, visitors.size),
    medianSessionSec: median(durations),
    avgTimePerPageSec: avg(pageTime, pageTimeN) / 1000,
    pagesPerSession: Math.round(avg(pvSum, sessions.length) * 100) / 100,
    bounceRate: pct(bounces, sessions.length),
    engagedRate: pct(engaged, sessions.length),
    newVisitors: newV.size,
    returningVisitors: Math.max(0, visitors.size - newV.size),
    avgScrollPct: Math.round(avg(scrollSum, scrollN)),
    actions: events.length,
    actionRate: pct(withAction, sessions.length),
  };
}

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string) {
  if (code === "Local") return "Local / private network";
  if (!/^[A-Z]{2}$/.test(code)) return code === "Unknown" ? "Unknown location" : code;
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
}
/**
 * Country > state/region > metro area or city, with visits, visitors and average visit time at each level.
 * The state is the reliable level. Cities are secondary: nearby cities are grouped into a metro area ("Greater Johor
 * Bahru") and the specific cities sit underneath it as approximate. Visits from a mobile carrier or a VPN / data
 * centre (session.network) count in the country total, but NOT in any state or city, because the lookup only shows
 * where the carrier's or data centre's hub is. They get their own row under the country instead.
 */
function buildLocationTree(f: Facts): CountryNode[] {
  type Acc = { n: number; v: Set<string>; time: number };
  const mk = (): Acc => ({ n: 0, v: new Set<string>(), time: 0 });
  const add = (a: Acc, s: SessionRow) => {
    a.n += 1;
    a.v.add(s.visitorId);
    a.time += f.sessionSec(s);
  };
  const stat = (label: string, a: Acc): PlaceStat => ({
    label,
    sessions: a.n,
    visitors: a.v.size,
    share: pct(a.n, f.sessions.length),
    avgTimeSec: Math.round(avg(a.time, a.n)),
  });
  type AreaAcc = Acc & { cluster: boolean; cities: Map<string, Acc> };
  type RegAcc = Acc & { areas: Map<string, AreaAcc> };
  type NetAcc = Acc & { carriers: Map<string, Acc> };
  type CtyAcc = Acc & { regions: Map<string, RegAcc>; nets: Map<"mobile" | "hosting", NetAcc> };
  const countries = new Map<string, CtyAcc>();
  for (const s of f.sessions) {
    const code = s.country || "Unknown";
    let c = countries.get(code);
    if (!c) countries.set(code, (c = { ...mk(), regions: new Map(), nets: new Map() }));
    add(c, s);
    if (s.network) {
      const kind = s.network === "hosting" ? "hosting" : "mobile";
      let nk = c.nets.get(kind);
      if (!nk) c.nets.set(kind, (nk = { ...mk(), carriers: new Map() }));
      add(nk, s);
      const brand = kind === "mobile" ? s.network.replace(/^mobile:?/, "") : "";
      let cr = nk.carriers.get(brand);
      if (!cr) nk.carriers.set(brand, (cr = mk()));
      add(cr, s);
      continue;
    }
    const rk = s.region || "";
    let r = c.regions.get(rk);
    if (!r) c.regions.set(rk, (r = { ...mk(), areas: new Map() }));
    add(r, s);
    const city = s.city || "";
    const area = areaOfCity(s.region, city);
    const ak = area || city;
    let ar = r.areas.get(ak);
    if (!ar) r.areas.set(ak, (ar = { ...mk(), cluster: !!area, cities: new Map() }));
    add(ar, s);
    if (area) {
      let ci = ar.cities.get(city);
      if (!ci) ar.cities.set(city, (ci = mk()));
      add(ci, s);
    }
  }
  const byVisits = <T extends { n: number }>(a: [string, T], b: [string, T]) => b[1].n - a[1].n;
  // "not known" entries always go last in their list
  const sortKnownFirst = <T extends { n: number }>(m: Map<string, T>) =>
    [...m.entries()].sort((a, b) => (a[0] === "" ? 1 : 0) - (b[0] === "" ? 1 : 0) || byVisits(a, b));
  return [...countries.entries()]
    .sort(byVisits)
    .slice(0, 60)
    .map(([code, c]) => ({
      ...stat(countryName(code), c),
      code,
      regions: sortKnownFirst(c.regions)
        .slice(0, 40)
        .map(([rk, r]) => ({
          ...stat(rk || "State not known", r),
          areas: sortKnownFirst(r.areas)
            .slice(0, 40)
            .map(([ak, ar]): AreaNode => ({
              ...stat(ak || "City not known", ar),
              cluster: ar.cluster,
              cities: [...ar.cities.entries()].sort(byVisits).slice(0, 40).map(([ck, ci]) => stat(ck, ci)),
            })),
        })),
      networks: [...c.nets.entries()]
        .sort(byVisits)
        .map(([kind, nk]): NetworkNode => ({
          ...stat(kind === "mobile" ? "Mobile network (location unreliable)" : "VPN or data centre (location unreliable)", nk),
          kind,
          carriers: [...nk.carriers.entries()]
            .sort((a, b) => (a[0] === "" ? 1 : 0) - (b[0] === "" ? 1 : 0) || byVisits(a, b))
            .slice(0, 20)
            .map(([brand, cr]) => stat(brand || (kind === "mobile" ? "Other carrier" : "Hosting network"), cr)),
        })),
    }));
}

/** Top states / regions across countries, from reliable visits only (not mobile carriers or VPNs). */
function buildTopStates(f: Facts): (PlaceStat & { country: string; code: string })[] {
  type Acc = { n: number; v: Set<string>; time: number; code: string; region: string };
  const map = new Map<string, Acc>();
  for (const s of f.sessions) {
    if (s.network || !s.region) continue;
    const k = `${s.country}|${s.region}`;
    const e = map.get(k) || { n: 0, v: new Set<string>(), time: 0, code: s.country, region: s.region };
    e.n += 1;
    e.v.add(s.visitorId);
    e.time += f.sessionSec(s);
    map.set(k, e);
  }
  return [...map.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 12)
    .map((e) => ({
      label: e.region,
      country: countryName(e.code),
      code: e.code,
      sessions: e.n,
      visitors: e.v.size,
      share: pct(e.n, f.sessions.length),
      avgTimeSec: Math.round(avg(e.time, e.n)),
    }));
}

function groupCounts(
  f: Facts,
  keyOf: (s: SessionRow) => string,
  labelOf: (k: string) => string = (k) => k,
  limit = 12,
): CountRow[] {
  const map = new Map<string, { n: number; v: Set<string>; time: number; bounce: number }>();
  for (const s of f.sessions) {
    const k = keyOf(s);
    const e = map.get(k) || { n: 0, v: new Set<string>(), time: 0, bounce: 0 };
    e.n += 1;
    e.v.add(s.visitorId);
    e.time += f.sessionSec(s);
    if (f.bounced(s)) e.bounce += 1;
    map.set(k, e);
  }
  return [...map.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, limit)
    .map(([k, e]) => ({
      label: labelOf(k),
      code: k,
      sessions: e.n,
      visitors: e.v.size,
      share: pct(e.n, f.sessions.length),
      avgTimeSec: Math.round(avg(e.time, e.n)),
      bounceRate: pct(e.bounce, e.n),
    }));
}

function hourLabel(h: number) {
  const hh = ((h % 24) + 24) % 24;
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12} ${ap}`;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function distribution(values: number[], edges: { label: string; max: number }[]): Bucket[] {
  const counts = edges.map(() => 0);
  for (const v of values) {
    const i = edges.findIndex((e) => v < e.max);
    counts[i === -1 ? edges.length - 1 : i] += 1;
  }
  const total = values.length;
  return edges.map((e, i) => ({ label: e.label, value: counts[i], share: pct(counts[i], total) }));
}

export async function buildDashboard(
  query: { range?: string | null; from?: string | null; to?: string | null; compare?: boolean },
  now = Date.now(),
): Promise<DashboardData> {
  const tz = analyticsTzOffsetMin();
  const range: ResolvedRange = resolveRange(query, now, tz);
  const compare = query.compare !== false;

  const step = range.bucket === "hour" ? 3_600_000 : range.bucket === "week" ? 7 * DAY : DAY;
  const bucketStart = (ms: number) => {
    if (range.bucket === "hour") return Math.floor((ms + tz * 60_000) / 3_600_000) * 3_600_000 - tz * 60_000;
    const dayStart = Math.floor((ms + tz * 60_000) / DAY) * DAY;
    if (range.bucket === "day") return dayStart - tz * 60_000;
    const dow = (new Date(dayStart).getUTCDay() + 6) % 7;
    return dayStart - dow * DAY - tz * 60_000;
  };
  const base = bucketStart(range.from);
  const count = Math.max(1, Math.ceil((range.to - base) / step));
  const prevBase = base - count * step;
  const prevQueryFrom = Math.min(range.prevFrom, prevBase);

  const rangeWhere = (field: string) => ({ [field]: { gte: new Date(range.from), lt: new Date(range.to) } });
  const prevWhere = (field: string) => ({ [field]: { gte: new Date(prevQueryFrom), lt: new Date(base) } });
  const none = <T,>() => Promise.resolve([] as T[]);

  const [sessions, views, events, prevSessionsAll, prevViewsAll, prevEventsAll, totalRows, firstRow, sampleSessions, pagesList, catalogues, live, linkKinds, everTypes] =
    await Promise.all([
      prisma.analyticsSession.findMany({ where: rangeWhere("startedAt"), select: sessionSelect, take: ROW_CAP }),
      prisma.analyticsPageview.findMany({ where: rangeWhere("createdAt"), select: viewSelect, take: ROW_CAP }),
      prisma.analyticsEvent.findMany({ where: rangeWhere("createdAt"), select: eventSelect, take: ROW_CAP }),
      compare ? prisma.analyticsSession.findMany({ where: prevWhere("startedAt"), select: sessionSelect, take: ROW_CAP }) : none<SessionRow>(),
      compare ? prisma.analyticsPageview.findMany({ where: prevWhere("createdAt"), select: viewSelect, take: ROW_CAP }) : none<ViewRow>(),
      compare ? prisma.analyticsEvent.findMany({ where: prevWhere("createdAt"), select: eventSelect, take: ROW_CAP }) : none<EventRow>(),
      prisma.analyticsSession.count(),
      prisma.analyticsSession.findFirst({ orderBy: { startedAt: "asc" }, select: { startedAt: true } }),
      prisma.analyticsSession.count({ where: { id: { startsWith: "sample_" } } }),
      getAllSitePages().catch(() => SITE_PAGES),
      prisma.catalogueItem.findMany({ select: { id: true, title: true, kind: true, fileUrl: true } }),
      buildLive(now),
      getSiteLinkKinds(),
      prisma.analyticsEvent.groupBy({ by: ["type"], _count: { _all: true } }),
    ]);

  // ---- readable page names ----
  const pageLabels = new Map<string, string>();
  for (const p of pagesList) pageLabels.set(p.path === "/" ? "/" : p.path.replace(/\/+$/, ""), p.label);
  pageLabels.set("/catalogues", "Catalogues");
  const catById = new Map(catalogues.map((c) => [c.id, c]));
  const catByFile = new Map(catalogues.map((c) => [c.fileUrl, c]));
  const labelFor = (path: string): string => {
    const known = pageLabels.get(path);
    if (known) return known;
    const m = /^\/r\/([^/]+)$/.exec(path);
    if (m) {
      const c = catById.get(m[1]);
      return c ? `${c.title} (QR / viewer)` : "Catalogue viewer (removed item)";
    }
    return path;
  };

  const f = new Facts(sessions, views, events);
  const kpis = computeKpis(f);

  // previous period for the card deltas = same elapsed time as "so far" in the current one
  const prev: Kpis | null = compare
    ? computeKpis(
        new Facts(
          prevSessionsAll.filter((s) => s.startedAt.getTime() >= range.prevFrom && s.startedAt.getTime() < range.prevTo),
          prevViewsAll.filter((v) => v.createdAt.getTime() >= range.prevFrom && v.createdAt.getTime() < range.prevTo),
          prevEventsAll.filter((e) => e.createdAt.getTime() >= range.prevFrom && e.createdAt.getTime() < range.prevTo),
        ),
      )
    : null;

  // ---- trends (current + previous period overlay, aligned bucket by bucket) ----
  const makeTrend = (from: number, ss: SessionRow[], vs: ViewRow[], es: EventRow[], facts: Facts): TrendPoint[] => {
    const idx = (ms: number) => Math.floor((ms - from) / step);
    const sBy: SessionRow[][] = Array.from({ length: count }, () => []);
    const pvBy = Array(count).fill(0) as number[];
    const evBy = Array(count).fill(0) as number[];
    for (const s of ss) {
      const i = idx(s.startedAt.getTime());
      if (i >= 0 && i < count) sBy[i].push(s);
    }
    for (const v of vs) {
      const i = idx(v.createdAt.getTime());
      if (i >= 0 && i < count) pvBy[i] += 1;
    }
    for (const e of es) {
      const i = idx(e.createdAt.getTime());
      if (i >= 0 && i < count) evBy[i] += 1;
    }
    return sBy.map((list, i) => {
      const t = from + i * step;
      const vis = new Set<string>();
      const nv = new Set<string>();
      let time = 0;
      let pv = 0;
      let eng = 0;
      for (const s of list) {
        vis.add(s.visitorId);
        if (s.isNewVisitor) nv.add(s.visitorId);
        time += facts.sessionSec(s);
        pv += s.pageviews;
        if (facts.engaged(s)) eng += 1;
      }
      return {
        t,
        label: range.bucket === "hour" ? hourLabel(new Date(t + tz * 60_000).getUTCHours()) : formatYmd(t, tz),
        future: t > now,
        visitors: vis.size,
        sessions: list.length,
        pageviews: pvBy[i],
        avgTimeSec: Math.round(avg(time, list.length)),
        pagesPerSession: Math.round(avg(pv, list.length) * 100) / 100,
        bounceRate: pct(list.length - eng, list.length),
        engagedRate: pct(eng, list.length),
        newVisitors: nv.size,
        actions: evBy[i],
      };
    });
  };
  const trend = makeTrend(base, sessions, views, events, f);
  const prevTrend = compare ? makeTrend(prevBase, prevSessionsAll, prevViewsAll, prevEventsAll, new Facts(prevSessionsAll, prevViewsAll, prevEventsAll)) : null;

  const actionTrend: ActionPoint[] = (() => {
    const out: ActionPoint[] = Array.from({ length: count }, (_, i) => {
      const t = base + i * step;
      return {
        t,
        label: range.bucket === "hour" ? hourLabel(new Date(t + tz * 60_000).getUTCHours()) : formatYmd(t, tz),
        future: t > now,
        counts: {},
        total: 0,
      };
    });
    for (const e of events) {
      const i = Math.floor((e.createdAt.getTime() - base) / step);
      if (i >= 0 && i < count) {
        out[i].counts[e.type] = (out[i].counts[e.type] || 0) + 1;
        out[i].total += 1;
      }
    }
    return out;
  })();

  // ---- heatmap (weekday × hour, local time) ----
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const v of views) {
    const d = new Date(v.createdAt.getTime() + tz * 60_000);
    heatmap[(d.getUTCDay() + 6) % 7][d.getUTCHours()] += 1;
  }

  // ---- pages ----
  type PageAgg = {
    views: number;
    v: Set<string>;
    timeSum: number;
    timeN: number;
    quick: number;
    scrollSum: number;
    scrollN: number;
    entries: number;
    entryBounces: number;
  };
  const pages = new Map<string, PageAgg>();
  const agg = (p: string) => {
    let e = pages.get(p);
    if (!e) {
      e = { views: 0, v: new Set(), timeSum: 0, timeN: 0, quick: 0, scrollSum: 0, scrollN: 0, entries: 0, entryBounces: 0 };
      pages.set(p, e);
    }
    return e;
  };
  for (const v of views) {
    const e = agg(v.path);
    e.views += 1;
    e.v.add(v.visitorId);
    if (v.activeMs > 0) {
      e.timeSum += v.activeMs;
      e.timeN += 1;
      if (v.activeMs < ENGAGED_SECONDS * 1000) e.quick += 1;
    }
    if (v.activeMs > 0 || v.scrollPct > 0) {
      e.scrollSum += v.scrollPct;
      e.scrollN += 1;
    }
  }
  for (const s of sessions) {
    const en = agg(s.entryPath);
    en.entries += 1;
    if (f.bounced(s)) en.entryBounces += 1;
  }
  const pageRowsAll: PageRow[] = [...pages.entries()].map(([path, e]) => ({
    path,
    label: labelFor(path),
    views: e.views,
    visitors: e.v.size,
    timedViews: e.timeN,
    avgTimeSec: Math.round(avg(e.timeSum, e.timeN) / 1000),
    avgScrollPct: Math.round(avg(e.scrollSum, e.scrollN)),
    entries: e.entries,
    bounceRate: pct(e.entryBounces, e.entries),
    quickRate: pct(e.quick, e.timeN),
  }));
  const viewedPages = pageRowsAll.filter((p) => p.views > 0).sort((a, b) => b.views - a.views);
  const topPages = viewedPages.slice(0, PAGE_ROWS_CAP);
  // ---- audience (countries only) ----
  const countries = groupCounts(f, (s) => s.country || "Unknown", countryName, 15);
  const locations = buildLocationTree(f);
  const topStates = buildTopStates(f);
  const networkTotals = {
    mobile: sessions.filter((x) => x.network && x.network !== "hosting").length,
    hosting: sessions.filter((x) => x.network === "hosting").length,
    known: sessions.filter((x) => x.country !== "Local" && x.country !== "Unknown").length,
  };

  // ---- engagement distributions ----
  const sessionDuration = distribution(
    sessions.map((s) => f.sessionSec(s)),
    [
      { label: "< 10s", max: 10 },
      { label: "10–30s", max: 30 },
      { label: "30–60s", max: 60 },
      { label: "1–3 min", max: 180 },
      { label: "3–10 min", max: 600 },
      { label: "10 min +", max: Infinity },
    ],
  );
  const scrollDepth = distribution(
    views.filter((v) => v.activeMs > 0 || v.scrollPct > 0).map((v) => v.scrollPct),
    [
      { label: "0–24%", max: 25 },
      { label: "25–49%", max: 50 },
      { label: "50–74%", max: 75 },
      { label: "75–99%", max: 100 },
      { label: "100%", max: Infinity },
    ],
  );
  const mean = (arr: number[]) => avg(arr.reduce((a, b) => a + b, 0), arr.length);
  const newS = sessions.filter((s) => s.isNewVisitor);
  const retS = sessions.filter((s) => !s.isNewVisitor);
  const newReturning = {
    newVisitors: kpis.newVisitors,
    returningVisitors: kpis.returningVisitors,
    newAvgTimeSec: Math.round(mean(newS.map((s) => f.sessionSec(s)))),
    returningAvgTimeSec: Math.round(mean(retS.map((s) => f.sessionSec(s)))),
    newPagesPerSession: round1(mean(newS.map((s) => s.pageviews))),
    returningPagesPerSession: round1(mean(retS.map((s) => s.pageviews))),
  };

  // ---- downloads, QR, clicks ----
  const dl = new Map<string, DownloadRow & { v: Set<string> }>();
  const dlRow = (key: string, init: () => DownloadRow) => {
    let e = dl.get(key);
    if (!e) {
      e = { ...init(), v: new Set() };
      dl.set(key, e);
    }
    return e;
  };
  for (const v of views) {
    const m = /^\/r\/([^/]+)$/.exec(v.path);
    if (!m) continue;
    const c = catById.get(m[1]);
    const e = dlRow(`cat:${m[1]}`, () => ({
      id: m[1],
      label: c ? c.title : "Removed catalogue item",
      kind: c ? c.kind : "",
      opens: 0,
      qrScans: 0,
      downloads: 0,
      visitors: 0,
    }));
    e.opens += 1;
    e.v.add(v.visitorId);
  }
  const clickMap = new Map<string, { type: string; target: string; n: number; v: Set<string> }>();
  const typeTotals = new Map<string, number>();
  for (const ev of events) {
    typeTotals.set(ev.type, (typeTotals.get(ev.type) || 0) + 1);
    if (ev.type === "qr" && ev.label) {
      const c = catById.get(ev.label);
      const e = dlRow(`cat:${ev.label}`, () => ({
        id: ev.label,
        label: c ? c.title : "Removed catalogue item",
        kind: c ? c.kind : "",
        opens: 0,
        qrScans: 0,
        downloads: 0,
        visitors: 0,
      }));
      e.qrScans += 1;
      e.v.add(ev.visitorId);
    } else if (ev.type === "download" && ev.target) {
      const c = catByFile.get(ev.target);
      const key = c ? `cat:${c.id}` : `file:${ev.target}`;
      const e = dlRow(key, () => ({
        id: c ? c.id : null,
        label: c ? c.title : safeDecode(ev.target!.split("/").pop() || ev.target!),
        kind: c ? c.kind : "file",
        opens: 0,
        qrScans: 0,
        downloads: 0,
        visitors: 0,
      }));
      e.downloads += 1;
      e.v.add(ev.visitorId);
    } else if (ev.type !== "download" && ev.type !== "qr") {
      const target = ev.target || (ev.type === "form" ? `Form on ${labelFor(ev.path)}` : "(unknown)");
      const k = `${ev.type}|${target}`;
      const e = clickMap.get(k) || { type: ev.type, target, n: 0, v: new Set<string>() };
      e.n += 1;
      e.v.add(ev.visitorId);
      clickMap.set(k, e);
    }
  }
  const downloads: DownloadRow[] = [...dl.values()]
    .map(({ v, ...row }) => ({ ...row, visitors: v.size }))
    .sort((a, b) => b.downloads + b.qrScans + b.opens - (a.downloads + a.qrScans + a.opens))
    .slice(0, 25);
  const clicks: ClickRow[] = [...clickMap.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 25)
    .map((e) => ({ type: e.type, typeLabel: EVENT_LABELS[e.type] || e.type, target: e.target, clicks: e.n, visitors: e.v.size }));
  const prevTypeTotals = new Map<string, number>();
  if (compare) {
    for (const e of prevEventsAll) {
      const t = e.createdAt.getTime();
      if (t >= range.prevFrom && t < range.prevTo) prevTypeTotals.set(e.type, (prevTypeTotals.get(e.type) || 0) + 1);
    }
  }
  // only offer action kinds the website really has: links found in the content, or anything ever recorded
  const everRecorded = new Set(everTypes.map((t) => t.type));
  const siteHas: Record<string, boolean> = {
    download: true, // catalogues and brochures always exist
    qr: true,
    outbound: linkKinds.outbound,
    whatsapp: linkKinds.whatsapp,
    phone: linkKinds.tel,
    email: linkKinds.mailto,
    form: linkKinds.form,
  };
  const availableActions = Object.keys(EVENT_LABELS).filter((t) => siteHas[t] || everRecorded.has(t));
  const hiddenActions = Object.keys(EVENT_LABELS)
    .filter((t) => !availableActions.includes(t))
    .map((t) => ({ type: t, label: EVENT_LABELS[t] }));
  const eventTotals = Object.keys(EVENT_LABELS).filter((t) => availableActions.includes(t)).map((type) => ({
    type,
    label: EVENT_LABELS[type],
    count: typeTotals.get(type) || 0,
    prev: compare ? prevTypeTotals.get(type) || 0 : null,
  }));

  // ---- plain-language insights + visual highlights ----
  const insights: string[] = [];
  const highlights: Highlight[] = [];
  let headline = "";
  if (views.length > 0) {
    const minViews = Math.min(3, Math.max(1, viewedPages[0]?.views ?? 1));
    const timed = pageRowsAll.filter((p) => p.avgTimeSec > 0 && p.timedViews >= minViews);
    const longest = [...timed].sort((a, b) => b.avgTimeSec - a.avgTimeSec)[0];
    const mostViewed = viewedPages[0];
    const hourTotals = Array(24).fill(0) as number[];
    const dayTotals = Array(7).fill(0) as number[];
    heatmap.forEach((row, d) => row.forEach((n, h) => ((hourTotals[h] += n), (dayTotals[d] += n))));
    const bestHour = hourTotals.indexOf(Math.max(...hourTotals));
    const bestDay = dayTotals.indexOf(Math.max(...dayTotals));

    if (longest) {
      headline = `Visitors spend the most time on “${longest.label}” (about ${fmtDuration(longest.avgTimeSec)} per visit).`;
      insights.push(headline);
      highlights.push({ key: "stay", title: "Longest stay", value: longest.label, sub: `${fmtDuration(longest.avgTimeSec)} per view` });
    }
    if (mostViewed) {
      const s = `The most visited page is “${mostViewed.label}” with ${mostViewed.views.toLocaleString("en")} view${mostViewed.views === 1 ? "" : "s"}.`;
      insights.push(s);
      if (!headline) headline = s;
      highlights.push({ key: "views", title: "Most viewed", value: mostViewed.label, sub: `${mostViewed.views.toLocaleString("en")} views` });
    }
    if (hourTotals[bestHour] > 0) {
      insights.push(`The busiest time is ${hourLabel(bestHour)}–${hourLabel(bestHour + 1)}, and ${WEEKDAYS[bestDay]} is the busiest day.`);
      highlights.push({ key: "busy", title: "Busiest time", value: `${WEEKDAYS[bestDay]}, ${hourLabel(bestHour)}`, sub: `${hourTotals[bestHour].toLocaleString("en")} views in that hour` });
    }
    insights.push(
      `Visitors stay ${fmtDuration(kpis.avgTimeSec)} on average (median ${fmtDuration(kpis.medianSessionSec)}), and ${kpis.engagedRate}% of visits are engaged.`,
    );
    highlights.push({ key: "engaged", title: "Engaged visits", value: `${kpis.engagedRate}%`, sub: `${fmtDuration(kpis.avgTimeSec)} average stay` });
    const knownCountries = countries.filter((c) => c.code !== "Unknown" && c.code !== "Local");
    if (knownCountries[0]) {
      insights.push(`Top country: ${knownCountries[0].label} (${knownCountries[0].share}% of visits).`);
      highlights.push({ key: "country", title: "Top country", value: knownCountries[0].label, sub: `${knownCountries[0].share}% of visits` });
    }
    const topDownload = downloads.find((d) => d.downloads > 0);
    if (topDownload) {
      insights.push(`Most downloaded: “${topDownload.label}” (${topDownload.downloads}×).`);
      highlights.push({ key: "download", title: "Top download", value: topDownload.label, sub: `${topDownload.downloads} downloads` });
    }
    // keep the tile grid full (6 tiles) even when there is no download or no country data yet
    const fillers: Highlight[] = [
      { key: "newret", title: "New visitors", value: `${kpis.visitors ? Math.round((kpis.newVisitors / kpis.visitors) * 100) : 0}%`, sub: `${kpis.newVisitors.toLocaleString("en")} first-time visitors` },
      { key: "pps", title: "Pages per visit", value: kpis.pagesPerSession.toFixed(1), sub: `${fmtDuration(kpis.avgTimePerPageSec)} per page` },
      { key: "scroll", title: "Average scroll", value: `${kpis.avgScrollPct}%`, sub: "of the page is read" },
    ];
    for (const fl of fillers) if (highlights.length < 6) highlights.push(fl);
  }

  return {
    generatedAt: now,
    tzOffsetMin: tz,
    range,
    hasData: views.length > 0 || sessions.length > 0,
    totalRowsEver: totalRows,
    firstSeenAt: firstRow ? firstRow.startedAt.getTime() : null,
    sampleSessions,
    headline,
    insights,
    highlights,
    kpis,
    prev,
    trend,
    prevTrend,
    actionTrend,
    heatmap,
    topPages,
    pageCount: viewedPages.length,
    countries,
    locations,
    topStates,
    networkTotals,
    sessionDuration,
    scrollDepth,
    newReturning,
    downloads,
    clicks,
    eventTotals,
    availableActions,
    hiddenActions,
    geo: geoStatus(),
    live,
  };
}

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Light query used by the dashboard every 30 seconds for "visitors right now". */
export async function buildLive(now = Date.now()): Promise<LiveInfo> {
  const [rows, recentViews, pagesList, catalogues] = await Promise.all([
    prisma.analyticsSession.findMany({
      where: { lastSeenAt: { gte: new Date(now - LIVE_WINDOW_MS) } },
      select: { visitorId: true, exitPath: true, country: true },
      take: 500,
    }),
    prisma.analyticsPageview.findMany({
      where: { createdAt: { gte: new Date(now - 30 * 60_000) } },
      select: { createdAt: true },
      take: 20_000,
    }),
    getAllSitePages().catch(() => SITE_PAGES),
    prisma.catalogueItem.findMany({ select: { id: true, title: true } }),
  ]);
  const names = new Map(pagesList.map((p) => [p.path === "/" ? "/" : p.path.replace(/\/+$/, ""), p.label]));
  const cat = new Map(catalogues.map((c) => [c.id, c.title]));
  const label = (path: string) => {
    const m = /^\/r\/([^/]+)$/.exec(path);
    if (m) return cat.get(m[1]) ? `${cat.get(m[1])} (QR / viewer)` : "Catalogue viewer";
    return names.get(path) || path;
  };
  const all = new Set(rows.map((r) => r.visitorId));
  const group = (keyOf: (r: (typeof rows)[number]) => string) => {
    const map = new Map<string, Set<string>>();
    for (const r of rows) {
      const k = keyOf(r);
      const set = map.get(k) || new Set<string>();
      set.add(r.visitorId);
      map.set(k, set);
    }
    return [...map.entries()].map(([k, set]) => ({ k, n: set.size })).sort((a, b) => b.n - a.n);
  };
  const minutes = Array(30).fill(0) as number[];
  for (const v of recentViews) {
    const i = 29 - Math.floor((now - v.createdAt.getTime()) / 60_000);
    if (i >= 0 && i < 30) minutes[i] += 1;
  }
  return {
    visitors: all.size,
    pages: group((r) => r.exitPath).slice(0, 6).map((g) => ({ path: g.k, label: label(g.k), visitors: g.n })),
    countries: group((r) => r.country || "Unknown")
      .slice(0, 4)
      .map((g) => ({ label: regionLabel(g.k), code: g.k, visitors: g.n })),
    minutes,
  };
}

function regionLabel(code: string) {
  return countryName(code);
}
