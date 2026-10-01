import { fmtDuration, formatYmd, type DashboardData } from "@/lib/analytics-types";

function csvCell(v: unknown) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Excel-friendly CSV of everything on the dashboard (numbers match the screen). */
export function buildCsv(d: DashboardData): string {
  const tz = d.tzOffsetMin;
  const rows: (string | number)[][] = [];
  const add = (...r: (string | number)[]) => rows.push(r);
  const sec = (title: string, head: string[], body: (string | number)[][]) => {
    add("");
    add(title);
    add(...head);
    body.forEach((r) => add(...r));
  };
  add("United Panel-System — website analytics");
  add("From", formatYmd(d.range.from, tz), "To", formatYmd(d.range.to - 1, tz), `Times in UTC${tz >= 0 ? "+" : "-"}${Math.abs(tz) / 60}`);
  if (d.sampleSessions > 0) add("NOTE: this report contains SAMPLE data");
  const k = d.kpis;
  const p = d.prev;
  sec("Summary", ["Measure", "Value", "Previous period"], [
    ["Visitors", k.visitors, p?.visitors ?? ""],
    ["Visits (sessions)", k.sessions, p?.sessions ?? ""],
    ["Page views", k.pageviews, p?.pageviews ?? ""],
    ["Average time on site / visit (seconds)", Math.round(k.avgTimeSec), p ? Math.round(p.avgTimeSec) : ""],
    ["Median visit duration (seconds)", Math.round(k.medianSessionSec), p ? Math.round(p.medianSessionSec) : ""],
    ["Average time per visitor (seconds)", Math.round(k.avgTimePerVisitorSec), p ? Math.round(p.avgTimePerVisitorSec) : ""],
    ["Average time per page (seconds)", Math.round(k.avgTimePerPageSec), p ? Math.round(p.avgTimePerPageSec) : ""],
    ["Pages per visit", k.pagesPerSession, p?.pagesPerSession ?? ""],
    ["Bounce rate %", k.bounceRate, p?.bounceRate ?? ""],
    ["Engaged visit rate %", k.engagedRate, p?.engagedRate ?? ""],
    ["New visitors", k.newVisitors, p?.newVisitors ?? ""],
    ["Returning visitors", k.returningVisitors, p?.returningVisitors ?? ""],
    ["Average scroll depth %", k.avgScrollPct, p?.avgScrollPct ?? ""],
    ["Actions (downloads, QR, clicks, forms)", k.actions, p?.actions ?? ""],
  ]);
  sec("Trend", ["Period", "Visitors", "Visits", "Page views", "Avg time per visit (s)", "Engaged %", "Actions"], d.trend.filter((t) => !t.future).map((t) => [t.label, t.visitors, t.sessions, t.pageviews, t.avgTimeSec, t.engagedRate, t.actions]));
  sec("Pages", ["Page", "Address", "Views", "Unique visitors", "Avg time on page (s)", "Avg scroll %", "Bounce rate %", "Views under 10s %"],
    d.topPages.map((x) => [x.label, x.path, x.views, x.visitors, x.avgTimeSec, x.avgScrollPct, x.bounceRate, x.quickRate]));
  sec("Visit length", ["Length", "Visits", "Share %"], d.sessionDuration.map((b) => [b.label, b.value, b.share]));
  sec("Scroll depth", ["Depth", "Page views", "Share %"], d.scrollDepth.map((b) => [b.label, b.value, b.share]));
  const cr = (title: string, rs: DashboardData["countries"]) => sec(title, ["Name", "Visits", "Visitors", "Share %", "Avg time (s)", "Bounce %"], rs.map((r) => [r.label, r.sessions, r.visitors, r.share, r.avgTimeSec, r.bounceRate]));
  cr("Countries", d.countries);
  // Country > state > area / city, one line per place (blank cells = the level above)
  const loc: (string | number)[][] = [];
  for (const c of d.locations) {
    loc.push([c.label, "", "", "", c.sessions, c.visitors, c.share, c.avgTimeSec]);
    for (const r of c.regions) {
      loc.push([c.label, r.label, "", "", r.sessions, r.visitors, r.share, r.avgTimeSec]);
      for (const a of r.areas) {
        loc.push([c.label, r.label, a.label, a.cluster ? "Metro area (approximate)" : a.label === "City not known" ? "" : "City (approximate)", a.sessions, a.visitors, a.share, a.avgTimeSec]);
        if (a.cluster) for (const x of a.cities) loc.push([c.label, r.label, a.label, `City inside the area: ${x.label}`, x.sessions, x.visitors, x.share, x.avgTimeSec]);
      }
    }
    for (const n of c.networks) {
      loc.push([c.label, n.label, "", "Counted in the country total only", n.sessions, n.visitors, n.share, n.avgTimeSec]);
      for (const x of n.carriers) loc.push([c.label, n.label, x.label, "Carrier / network", x.sessions, x.visitors, x.share, x.avgTimeSec]);
    }
  }
  sec(
    "Countries, states and areas (State is the reliable level. Area and city are approximate: nearby cities are grouped into a metro area. Mobile-carrier and VPN visits are counted in the country total only, because their state and city are unreliable. A blank cell means that row is the total for the level above.)",
    ["Country", "State / region", "Metro area / city", "Note", "Visits", "Visitors", "Share %", "Avg time (s)"],
    loc,
  );
  sec("Catalogues, downloads and QR scans", ["Document", "Type", "Opens", "QR scans", "Downloads", "Visitors"], d.downloads.map((r) => [r.label, r.kind, r.opens, r.qrScans, r.downloads, r.visitors]));
  sec("Actions", ["Type", "This period", "Previous period"], d.eventTotals.map((e) => [e.label, e.count, e.prev ?? ""]));
  sec("Clicks (outbound, WhatsApp, phone, email, forms)", ["Type", "Target", "Clicks", "Visitors"], d.clicks.map((c) => [c.typeLabel, c.target, c.clicks, c.visitors]));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  sec("Busy times (page views by weekday and hour)", ["Day", ...Array.from({ length: 24 }, (_, h) => `${h}:00`)], d.heatmap.map((r, i) => [days[i], ...r]));
  add("");
  add("Durations", `average visit ${fmtDuration(k.avgTimeSec)}`, `median ${fmtDuration(k.medianSessionSec)}`);
  return "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
