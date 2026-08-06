import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSection, saveSection } from "@/lib/content";
import { HOME_SECTION_KEYS, type HomeSectionKey } from "@/lib/types";

function isHomeKey(key: string): key is HomeSectionKey {
  return (HOME_SECTION_KEYS as readonly string[]).includes(key);
}

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !isHomeKey(key)) {
    return NextResponse.json({ error: "Invalid section key" }, { status: 400 });
  }
  const data = await getSection(key);
  return NextResponse.json({ key, data });
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const key = body?.key;
  if (!key || !isHomeKey(key) || body?.data === undefined) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await saveSection(key, body.data);
  return NextResponse.json({ ok: true });
}
