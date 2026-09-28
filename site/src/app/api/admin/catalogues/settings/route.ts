import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCataloguesPagePublic, setCataloguesPagePublic } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Page-level setting: is the public /catalogues page (and its menu item) visible? */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ pagePublic: await getCataloguesPagePublic() });
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (typeof body.pagePublic !== "boolean") {
    return NextResponse.json({ error: "pagePublic must be true or false" }, { status: 400 });
  }
  try {
    return NextResponse.json({ pagePublic: await setCataloguesPagePublic(body.pagePublic) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save the setting." },
      { status: 500 },
    );
  }
}
