/** Shared (server + browser) analytics types and date-range helpers. No database code here. */

export type RangeKey = "today" | "7d" | "30d" | "90d" | "custom";

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom",
};

const DAY = 86_400_000;

export type ResolvedRange = {
  key: RangeKey;
  from: number; // inclusive, ms
  to: number; // exclusive, ms (end of the last day)
  effectiveTo: number; // min(to, now): "so far"
  prevFrom: number;
  prevTo: number;
  bucket: "hour" | "day" | "week";
  days: number;
};

/** Start (ms) of the local day that contains `ms`, for a fixed offset in minutes east of UTC. */
export function startOfLocalDay(ms: number, offsetMin: number): number {
  const shifted = ms + offsetMin * 60_000;
  return Math.floor(shifted / DAY) * DAY - offsetMin * 60_000;
}

export function parseYmd(s: string | null | undefined, offsetMin: number): number | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  if (Number.isNaN(t)) return null;
  return t - offsetMin * 60_000;
}

export function formatYmd(ms: number, offsetMin: number): string {
  const d = new Date(ms + offsetMin * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

export function resolveRange(
  input: { range?: string | null; from?: string | null; to?: string | null },
  now: number,
  offsetMin: number,
): ResolvedRange {
  const todayStart = startOfLocalDay(now, offsetMin);
  let key: RangeKey = (["today", "7d", "30d", "90d", "custom"] as const).includes(input.range as RangeKey)
    ? (input.range as RangeKey)
    : "7d";
  let from = todayStart;
  let to = todayStart + DAY;

  if (key === "7d") from = todayStart - 6 * DAY;
  else if (key === "30d") from = todayStart - 29 * DAY;
  else if (key === "90d") from = todayStart - 89 * DAY;
  else if (key === "custom") {
    const f = parseYmd(input.from, offsetMin);
    const t = parseYmd(input.to, offsetMin);
    if (f === null || t === null) {
      key = "7d";
      from = todayStart - 6 * DAY;
    } else {
      from = Math.min(f, t);
      to = Math.max(f, t) + DAY;
      // never longer than ~2 years (keeps queries light)
      if (to - from > 731 * DAY) from = to - 731 * DAY;
    }
  }

  const span = to - from;
  const effectiveTo = Math.min(to, now + 1);
  const effSpan = Math.max(0, effectiveTo - from);
  const prevFrom = from - span;
  const prevTo = prevFrom + effSpan;
  const days = Math.max(1, Math.round(span / DAY));
  return { key, from, to, effectiveTo, prevFrom, prevTo, bucket: days <= 2 ? "hour" : days > 120 ? "week" : "day", days };
}

export type Kpis = {
  visitors: number;
  sessions: number;
  pageviews: number;
  /** Average active time per visit (session), seconds */
  avgTimeSec: number;
  /** Total active time divided by visitors (all of a person's visits), seconds */
  avgTimePerVisitorSec: number;
  medianSessionSec: number;
  /** Average active time per page view that was timed, seconds */
  avgTimePerPageSec: number;
  pagesPerSession: number;
  bounceRate: number; // 0–100: visits that were NOT engaged
  engagedRate: number; // 0–100: 10s+ active, or 2+ pages, or took an action
  newVisitors: number;
  returningVisitors: number;
  avgScrollPct: number;
  actions: number; // downloads, QR scans, clicks, form sends
  actionRate: number; // % of visits with at least one action
};

/** One bucket (hour or day) of the trend. Used for charts and KPI sparklines. */
export type TrendPoint = {
  t: number;
  label: string;
  future: boolean; // bucket has not happened yet
  visitors: number;
  sessions: number;
  pageviews: number;
  avgTimeSec: number;
  pagesPerSession: number;
  bounceRate: number;
  engagedRate: number;
  newVisitors: number;
  actions: number;
};

export type ActionPoint = { t: number; label: string; future: boolean; counts: Record<string, number>; total: number };

export type PageRow = {
  path: string;
  label: string;
  views: number;
  visitors: number;
  timedViews: number;
  avgTimeSec: number;
  avgScrollPct: number;
  /** visits that started on this page */
  entries: number;
  bounceRate: number;
  /** % of views that lasted under 10 seconds */
  quickRate: number;
};

export type CountRow = {
  label: string;
  code?: string;
  sessions: number;
  visitors: number;
  share: number;
  avgTimeSec: number;
  bounceRate: number;
};
/** One place (country, state/region or city) in the Countries tree. */
export type PlaceStat = {
  label: string;
  sessions: number;
  visitors: number;
  share: number; // % of all visits in the period
  avgTimeSec: number;
};
export type CityNode = PlaceStat;
export type RegionNode = PlaceStat & { cities: CityNode[] };
export type CountryNode = PlaceStat & { code: string; regions: RegionNode[] };

export type DownloadRow = {
  id: string | null;
  label: string;
  kind: string;
  opens: number;
  qrScans: number;
  downloads: number;
  visitors: number;
};
export type ClickRow = { type: string; typeLabel: string; target: string; clicks: number; visitors: number };

export type Bucket = { label: string; value: number; share: number };

export type Highlight = { key: string; title: string; value: string; sub: string };

export type LiveInfo = {
  visitors: number;
  pages: { path: string; label: string; visitors: number }[];
  countries: { label: string; code: string; visitors: number }[];
  /** Page views per minute for the last 30 minutes (oldest first) */
  minutes: number[];
};

/** Flag emoji for a 2-letter country code. "Local" (private network) and "Unknown" get neutral symbols. */
export function countryFlag(code: string | undefined): string {
  if (code === "Local") return "\u{1F3E0}";
  if (!code || !/^[A-Z]{2}$/.test(code)) return "\u{1F310}";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Which kinds of actions this website can actually produce (so empty ones are hidden). */
export type ActionKind = { type: string; label: string };

export type EventTotal = { type: string; label: string; count: number; prev: number | null };

export type DashboardData = {
  generatedAt: number;
  tzOffsetMin: number;
  range: ResolvedRange;
  hasData: boolean;
  totalRowsEver: number;
  firstSeenAt: number | null;
  sampleSessions: number;
  headline: string;
  insights: string[];
  highlights: Highlight[];
  kpis: Kpis;
  prev: Kpis | null;
  trend: TrendPoint[];
  prevTrend: TrendPoint[] | null;
  actionTrend: ActionPoint[];
  heatmap: number[][]; // [weekday Mon=0..Sun=6][hour 0..23] pageviews
  topPages: PageRow[];
  pageCount: number; // how many different pages were viewed (topPages may be capped)
  countries: CountRow[];
  /** Country > state/region > city tree (visits, visitors, average visit time at each level) */
  locations: CountryNode[];
  sessionDuration: Bucket[];
  scrollDepth: Bucket[];
  newReturning: {
    newVisitors: number;
    returningVisitors: number;
    newAvgTimeSec: number;
    returningAvgTimeSec: number;
    newPagesPerSession: number;
    returningPagesPerSession: number;
  };
  downloads: DownloadRow[];
  clicks: ClickRow[];
  eventTotals: EventTotal[];
  /** Action kinds that exist on the website (links present in content) or have ever been recorded */
  availableActions: string[];
  /** Kinds that were left out because the site has no such links and nothing was ever recorded */
  hiddenActions: ActionKind[];
  /** Status of the offline country lookup */
  geo: { available: boolean; city: boolean; month: string | null };
  live: LiveInfo;
};

export const EVENT_LABELS: Record<string, string> = {
  download: "File download",
  qr: "QR code scan",
  outbound: "Outbound link",
  whatsapp: "WhatsApp click",
  phone: "Phone click",
  email: "Email click",
  form: "Form submit",
};

export function fmtDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "0s";
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${String(r).padStart(2, "0")}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, "0")}m`;
}
