import { isIP } from "node:net";
import { z } from "zod";
import { prisma } from "./db";
import {
  classifySource,
  countryFromHeaders,
  hostFromUrl,
  parseUserAgent,
} from "./analytics-ua";
import { isPrivateAddress, lookupLocation } from "./geoip";

/** Retention: anything older than this is deleted by the purge. */
export const ANALYTICS_RETENTION_MONTHS = 13;

export const EVENT_TYPES = ["download", "qr", "outbound", "whatsapp", "phone", "email", "form"] as const;
export type AnalyticsEventType = (typeof EVENT_TYPES)[number];

const id = z.string().regex(/^[a-z0-9]{8,40}$/i);
const pathStr = z.string().min(1).max(200);
const short = (n: number) => z.string().max(n).optional();

const pvSchema = z.object({
  t: z.literal("pv"),
  sid: id,
  vid: id,
  pid: id,
  path: pathStr,
  ref: short(300),
  nv: z.boolean().optional(), // brand-new visitor id in this browser
  ns: z.boolean().optional(), // brand-new session
  w: z.number().int().min(0).max(20000).optional(),
  h: z.number().int().min(0).max(20000).optional(),
  tp: z.number().int().min(0).max(50).optional(), // touch points (tells iPadOS from a Mac)
  lang: short(20),
  us: short(100), // utm_source
  um: short(100), // utm_medium
  uc: short(100), // utm_campaign
});

const ppSchema = z.object({
  t: z.literal("pp"),
  sid: id,
  pid: id,
  ms: z.number().int().min(0).max(24 * 3600 * 1000),
  sp: z.number().int().min(0).max(100),
});

const evSchema = z.object({
  t: z.literal("ev"),
  sid: id,
  vid: id,
  type: z.enum(EVENT_TYPES),
  path: pathStr,
  target: short(300),
  label: short(80),
});

export const collectSchema = z.discriminatedUnion("t", [pvSchema, ppSchema, evSchema]);
export type CollectPayload = z.infer<typeof collectSchema>;

const MAX_BODY_BYTES = 2000;
export function bodyTooLarge(text: string) {
  return text.length > MAX_BODY_BYTES;
}

/** Page paths only: no query strings, no admin/api paths, tidy trailing slash. */
export function normalizeTrackedPath(raw: string): string | null {
  let p = raw.split("#")[0].split("?")[0].trim();
  if (!p.startsWith("/") || p.startsWith("//")) return null;
  if (/[\u0000-\u001f<>"'\\]/.test(p)) return null;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  const lower = p.toLowerCase();
  if (/^\/(admin|api|_next|uploads|pdfjs)(\/|$)/.test(lower)) return null;
  return p.slice(0, 200);
}

/** Clean a free-text field: trim, drop control characters, cap length. */
function clean(v: string | undefined | null, max: number): string | null {
  if (!v) return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
  return s || null;
}

/** For outbound links keep only host + path (no query string or fragments). */
export function cleanTarget(type: AnalyticsEventType, raw: string | undefined): string | null {
  const v = clean(raw, 300);
  if (!v) return null;
  if (type === "outbound") {
    try {
      const u = new URL(v);
      return `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`.slice(0, 200);
    } catch {
      return null;
    }
  }
  if (type === "download") return v.split("?")[0].split("#")[0].slice(0, 250);
  if (type === "whatsapp") return v.replace(/[^\d+a-z./:-]/gi, "").slice(0, 120);
  if (type === "phone") return v.replace(/^tel:/i, "").replace(/[^\d+\s()-]/g, "").slice(0, 40);
  if (type === "email") return v.replace(/^mailto:/i, "").split("?")[0].slice(0, 120);
  return v.slice(0, 120);
}

// ── tiny in-memory rate limiter (nothing is stored; keys are hashed and rotate daily) ──
type Bucket = { n: number; reset: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

export function rateLimited(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  if (now - lastSweep > 120_000) {
    lastSweep = now;
    for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
    if (buckets.size > 20_000) buckets.clear();
  }
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  b.n += 1;
  return b.n > limit;
}

/**
 * Where a new visit comes from: country, state/region and city. A host/CDN country header wins for the country;
 * the offline lookup of the visitor's address (used only for that moment, never stored or logged) adds state and city.
 * Private/loopback addresses become "Local". Only these three text values are ever stored.
 */
type Where = { country: string; region: string | null; city: string | null };
function resolveLocation(header: (name: string) => string | null, host: string): Where {
  const fromHeader = countryFromHeaders(header);
  let found: ReturnType<typeof lookupLocation> = null;
  try {
    found = lookupLocation(header);
  } catch {
    /* never let a lookup problem break tracking */
  }
  if (found && "local" in found) return { country: fromHeader !== "Unknown" ? fromHeader : "Local", region: null, city: null };
  if (found) {
    // a CDN header for a different country than the lookup: trust the header, drop state/city
    if (fromHeader !== "Unknown" && fromHeader !== found.country) return { country: fromHeader, region: null, city: null };
    return { country: found.country, region: cleanPlace(found.region), city: cleanPlace(found.city) };
  }
  if (fromHeader !== "Unknown") return { country: fromHeader, region: null, city: null };
  // opened through localhost / a LAN address with no forwarded address at all: that is a local visit
  const bare = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  if (bare === "localhost" || bare.endsWith(".local") || (isIP(bare) !== 0 && isPrivateAddress(bare))) {
    return { country: "Local", region: null, city: null };
  }
  return { country: "Unknown", region: null, city: null };
}
function cleanPlace(v: string | null): string | null {
  const s = (v || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
  return s || null;
}

// ── persistence ──
type Ctx = {
  userAgent: string;
  host: string;
  header: (name: string) => string | null;
};

export async function recordPayload(p: CollectPayload, ctx: Ctx): Promise<void> {
  if (p.t === "pv") return recordPageview(p, ctx);
  if (p.t === "pp") return recordPing(p);
  return recordEvent(p);
}

async function recordPageview(p: z.infer<typeof pvSchema>, ctx: Ctx) {
  const path = normalizeTrackedPath(p.path);
  if (!path) return;
  const now = new Date();

  const existing = await prisma.analyticsSession.findUnique({
    where: { id: p.sid },
    select: { id: true, visitorId: true },
  });
  if (existing && existing.visitorId !== p.vid) return; // someone reusing another visitor's session id

  if (!existing) {
    const ua = parseUserAgent(ctx.userAgent, { touchPoints: p.tp });
    const src = classifySource({
      referrer: p.ref,
      selfHost: ctx.host,
      utmSource: p.us,
      utmMedium: p.um,
    });
    await prisma.analyticsSession
      .create({
        data: {
          id: p.sid,
          visitorId: p.vid,
          startedAt: now,
          lastSeenAt: now,
          ...resolveLocation(ctx.header, ctx.host),
          device: ua.device,
          browser: ua.browser,
          os: ua.os,
          language: clean(p.lang, 20),
          screenW: p.w || null,
          screenH: p.h || null,
          source: src.source,
          sourceName: clean(src.sourceName, 120),
          refHost: clean(src.refHost, 120),
          utmSource: clean(p.us, 100),
          utmMedium: clean(p.um, 100),
          utmCampaign: clean(p.uc, 100),
          entryPath: path,
          exitPath: path,
          pageviews: 0,
          isNewVisitor: p.nv === true,
        },
      })
      .catch(() => undefined); // two tabs can race to create the same session
    void maybePurge();
  }

  const created = await prisma.analyticsPageview
    .create({
      data: { id: p.pid, sessionId: p.sid, visitorId: p.vid, path, createdAt: now },
    })
    .then(() => true)
    .catch(() => false); // same page id sent twice → ignore
  if (!created) return;

  await prisma.analyticsSession.updateMany({
    where: { id: p.sid },
    data: { lastSeenAt: now, exitPath: path, pageviews: { increment: 1 } },
  });
}

async function recordPing(p: z.infer<typeof ppSchema>) {
  // Keep the biggest values we have seen (a late, smaller beacon must never shrink them).
  await prisma.$executeRaw`UPDATE "AnalyticsPageview" SET "activeMs" = MAX("activeMs", ${p.ms}), "scrollPct" = MAX("scrollPct", ${p.sp}) WHERE "id" = ${p.pid} AND "sessionId" = ${p.sid}`;
  await prisma.analyticsSession.updateMany({
    where: { id: p.sid },
    data: { lastSeenAt: new Date() },
  });
}

async function recordEvent(p: z.infer<typeof evSchema>) {
  const path = normalizeTrackedPath(p.path);
  if (!path) return;
  const session = await prisma.analyticsSession.findUnique({
    where: { id: p.sid },
    select: { visitorId: true },
  });
  if (!session || session.visitorId !== p.vid) return;
  await prisma.analyticsEvent.create({
    data: {
      sessionId: p.sid,
      visitorId: p.vid,
      type: p.type,
      path,
      target: cleanTarget(p.type, p.target),
      label: clean(p.label, 80),
    },
  });
  await prisma.analyticsSession.updateMany({
    where: { id: p.sid },
    data: { lastSeenAt: new Date() },
  });
}

// ── retention ──
export async function purgeOldAnalytics(months = ANALYTICS_RETENTION_MONTHS) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - Math.max(1, Math.floor(months)));
  const events = await prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  const views = await prisma.analyticsPageview.deleteMany({ where: { createdAt: { lt: cutoff } } });
  const sessions = await prisma.analyticsSession.deleteMany({ where: { lastSeenAt: { lt: cutoff } } });
  return { cutoff: cutoff.toISOString(), sessions: sessions.count, pageviews: views.count, events: events.count };
}

let lastAutoPurge = 0;
/** Cheap safety net: at most once a day per server process, in the background. */
export async function maybePurge() {
  const now = Date.now();
  if (now - lastAutoPurge < 24 * 3600 * 1000) return;
  lastAutoPurge = now;
  try {
    await purgeOldAnalytics();
  } catch {
    /* never block tracking */
  }
}

export async function resetAnalytics() {
  const events = await prisma.analyticsEvent.deleteMany({});
  const views = await prisma.analyticsPageview.deleteMany({});
  const sessions = await prisma.analyticsSession.deleteMany({});
  return { sessions: sessions.count, pageviews: views.count, events: events.count };
}

export { hostFromUrl };
