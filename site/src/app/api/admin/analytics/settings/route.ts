import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getRespectDnt, setRespectDnt } from "@/lib/analytics-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/** Tracking settings (admin only). respectDnt: skip visitors who send Do Not Track / Global Privacy Control. Default false. */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  return NextResponse.json({ respectDnt: await getRespectDnt() }, { headers: NO_STORE });
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const body = await request.json().catch(() => ({}));
  if (typeof body.respectDnt !== "boolean") {
    return NextResponse.json({ error: "respectDnt must be true or false" }, { status: 400, headers: NO_STORE });
  }
  try {
    return NextResponse.json({ respectDnt: await setRespectDnt(body.respectDnt) }, { headers: NO_STORE });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save the setting." },
      { status: 500, headers: NO_STORE },
    );
  }
}
