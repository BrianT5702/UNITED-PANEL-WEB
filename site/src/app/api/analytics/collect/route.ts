import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { isAuthenticated } from "@/lib/auth";
import { isBotUserAgent } from "@/lib/analytics-ua";
import { getRespectDnt } from "@/lib/analytics-settings";
import { bodyTooLarge, collectSchema, rateLimited, recordPayload } from "@/lib/analytics-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const ADMIN_COOKIE = "ur_admin_session";

/** Tells the tracker to stop for this page load (admins, bots, and Do-Not-Track only if the admin switched that on). */
function ignored() {
  return NextResponse.json({ ok: true, track: false }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const h = request.headers;

  // Same-site only: the tracker runs on our own pages.
  const origin = h.get("origin");
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim().toLowerCase();
  if (origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).host.toLowerCase();
    } catch {
      /* ignore */
    }
    if (!originHost || originHost !== host) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE });
    }
  }

  // Do Not Track / Global Privacy Control are only honoured when the admin switched that on (default: off, count everyone).
  if ((h.get("dnt") === "1" || h.get("sec-gpc") === "1") && (await getRespectDnt())) return ignored();
  // Obvious bots: accept quietly, store nothing.
  const userAgent = h.get("user-agent") || "";
  if (isBotUserAgent(userAgent)) return ignored();

  // Rate limit by a hash of the address that is only kept in memory (never stored, rotates daily).
  const addr = (h.get("x-forwarded-for") || h.get("x-real-ip") || "local").split(",")[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  const key = createHash("sha256").update(`${day}|${addr}|${userAgent}`).digest("hex").slice(0, 24);
  if (rateLimited(`ip:${key}`, 240)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: NO_STORE });
  }

  const text = await request.text().catch(() => "");
  if (!text || bodyTooLarge(text)) {
    return NextResponse.json({ error: "Bad payload" }, { status: 413, headers: NO_STORE });
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400, headers: NO_STORE });
  }
  const parsed = collectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400, headers: NO_STORE });
  }
  const payload = parsed.data;
  if (rateLimited(`sid:${payload.sid}`, 90)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: NO_STORE });
  }

  // Signed-in admins are never counted (the cookie is sent automatically with same-site requests).
  if (request.headers.get("cookie")?.includes(ADMIN_COOKIE) && (await isAuthenticated())) {
    return ignored();
  }

  // Optional: skip localhost while developing (ANALYTICS_EXCLUDE_LOCAL=1).
  if (process.env.ANALYTICS_EXCLUDE_LOCAL === "1" && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) {
    return ignored();
  }

  try {
    await recordPayload(payload, {
      userAgent,
      host,
      header: (name) => h.get(name),
    });
  } catch {
    // Tracking must never break anything: swallow database hiccups.
  }
  return NextResponse.json({ ok: true, track: true }, { headers: NO_STORE });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: NO_STORE });
}
