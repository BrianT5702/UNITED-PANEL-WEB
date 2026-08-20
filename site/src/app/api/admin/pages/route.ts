import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createEmptySitePage,
  ensureSeeded,
  findSitePage,
  getAllSitePages,
  savePageDocument,
} from "@/lib/content";
import type { PageDocument } from "@/lib/page-document";
import type { PageGroup } from "@/lib/pages";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSeeded();
  const pages = await getAllSitePages();
  return NextResponse.json({ pages });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const label = String(body?.label || "").trim();
  const groupRaw = String(body?.group || "Other");
  const group: Exclude<PageGroup, "Home"> =
    groupRaw === "About" || groupRaw === "Products" ? groupRaw : "Other";

  await ensureSeeded();
  const result = await createEmptySitePage({ label, group });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, page: result.page, pages: await getAllSitePages() });
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pageId = body?.pageId as string | undefined;
  const document = body?.document as PageDocument | undefined;

  if (!pageId || !document || !Array.isArray(document.sections)) {
    return NextResponse.json({ error: "Missing pageId or document" }, { status: 400 });
  }

  const page = await findSitePage(pageId);
  if (!page) {
    return NextResponse.json({ error: "Unknown page" }, { status: 400 });
  }

  await savePageDocument(pageId, document);
  return NextResponse.json({ ok: true });
}
