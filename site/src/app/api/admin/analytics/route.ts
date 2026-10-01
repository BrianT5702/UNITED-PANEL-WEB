import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { buildDashboard, buildLive } from "@/lib/analytics-stats";
import { resetAnalytics } from "@/lib/analytics-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const q = new URL(request.url).searchParams;
  try {
    if (q.get("live") === "1") {
      return NextResponse.json({ live: await buildLive() }, { headers: NO_STORE });
    }
    const data = await buildDashboard({
      range: q.get("range"),
      from: q.get("from"),
      to: q.get("to"),
      compare: q.get("compare") !== "0",
    });
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load analytics." },
      { status: 500, headers: NO_STORE },
    );
  }
}

/** Reset: delete ALL analytics rows. Needs { "confirm": "RESET" } in the body. */
export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "RESET") {
    return NextResponse.json({ error: "Confirmation missing." }, { status: 400, headers: NO_STORE });
  }
  const removed = await resetAnalytics();
  return NextResponse.json({ ok: true, removed }, { headers: NO_STORE });
}
