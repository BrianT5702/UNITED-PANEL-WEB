import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { checkEnquiry, saveEnquiry } from "@/lib/enquiries";
import { rateLimited } from "@/lib/analytics-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BODY_CHARS = 12_000;

/** Public enquiry form: saved in the database (Admin → Enquiries). Nothing is emailed. */
export async function POST(request: Request) {
  const h = request.headers;

  // Same-site only
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

  const text = await request.text().catch(() => "");
  if (!text || text.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "Your message is too long." }, { status: 413, headers: NO_STORE });
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400, headers: NO_STORE });
  }

  // Rate limit by a hash of the address, kept only in memory
  const addr = (h.get("x-forwarded-for") || h.get("x-real-ip") || "local").split(",")[0].trim();
  const key = createHash("sha256").update(`${addr}|${h.get("user-agent") || ""}`).digest("hex").slice(0, 24);
  if (rateLimited(`enq:${key}`, 5, 10 * 60_000) || rateLimited("enq:all", 120, 60 * 60_000)) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again in a few minutes." },
      { status: 429, headers: NO_STORE },
    );
  }

  // Hidden field only bots fill in: pretend it worked, store nothing
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }

  const check = checkEnquiry(body);
  if (!check.ok) {
    return NextResponse.json({ error: check.error, field: check.field }, { status: 400, headers: NO_STORE });
  }
  try {
    await saveEnquiry(check.value);
  } catch (err) {
    console.error("[contact] could not save enquiry", err);
    return NextResponse.json(
      { error: "Sorry, we could not send your message. Please email or call us instead." },
      { status: 500, headers: NO_STORE },
    );
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
