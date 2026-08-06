import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { savePirContent } from "@/lib/content";
import type { PirContent } from "@/lib/pir";

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const content = body?.content as PirContent | undefined;
  if (!content) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }
  await savePirContent(content);
  return NextResponse.json({ ok: true });
}
