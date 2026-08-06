import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { saveSection } from "@/lib/content";
import { HOME_SECTION_KEYS, type HomeContent, type HomeSectionKey } from "@/lib/types";

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const content = body?.content as HomeContent | undefined;
  if (!content) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  for (const key of HOME_SECTION_KEYS) {
    if (content[key] !== undefined) {
      await saveSection(key as HomeSectionKey, content[key]);
    }
  }

  return NextResponse.json({ ok: true });
}
