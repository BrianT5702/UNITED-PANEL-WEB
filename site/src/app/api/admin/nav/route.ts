import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { ensureSeeded, getSiteNav, saveSiteNav } from "@/lib/content";
import { normalizeNavItems } from "@/lib/nav";
import type { NavItem } from "@/lib/types";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSeeded();
  const items = await getSiteNav();
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const items = body?.items as NavItem[] | undefined;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Missing items array" }, { status: 400 });
  }

  const saved = await saveSiteNav(normalizeNavItems(items));
  return NextResponse.json({ ok: true, items: saved });
}
