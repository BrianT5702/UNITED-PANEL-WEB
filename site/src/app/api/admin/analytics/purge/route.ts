import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { ANALYTICS_RETENTION_MONTHS, purgeOldAnalytics } from "@/lib/analytics-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Delete analytics older than the retention period (13 months). Safe to run any time. */
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const removed = await purgeOldAnalytics(ANALYTICS_RETENTION_MONTHS);
  return NextResponse.json({ ok: true, months: ANALYTICS_RETENTION_MONTHS, removed }, { headers: { "Cache-Control": "no-store" } });
}
