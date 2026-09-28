import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCatalogueItem } from "@/lib/catalogues";
import {
  THUMB_MAX_BYTES,
  catalogueThumbUrl,
  deleteCatalogueThumb,
  ensureCatalogueThumb,
  isPdfItem,
  looksLikeJpeg,
  readCatalogueThumb,
  saveCatalogueThumb,
  thumbResponse,
} from "@/lib/catalogue-thumbs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Admin-only: view a preview (works for hidden items too). Created on first request if missing. */
export async function GET(request: Request, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let jpeg = await readCatalogueThumb(id);
  if (!jpeg) {
    const item = await getCatalogueItem(id);
    if (item && isPdfItem(item)) {
      await ensureCatalogueThumb(item);
      jpeg = await readCatalogueThumb(id);
    }
  }
  if (!jpeg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const versioned = new URL(request.url).searchParams.has("v");
  return thumbResponse(jpeg, versioned ? "private, max-age=31536000, immutable" : "private, no-cache");
}

/**
 * Admin-only: (re)create the preview on the server.
 * ?force=1 re-renders even if one exists ("Regenerate preview").
 */
export async function PUT(request: Request, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const item = await getCatalogueItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isPdfItem(item)) {
    return NextResponse.json({ error: "Previews are only made for PDF files." }, { status: 400 });
  }
  const force = new URL(request.url).searchParams.get("force") === "1";
  const result = await ensureCatalogueThumb(item, { force });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ thumbUrl: await catalogueThumbUrl(item.id, "admin") });
}

/** Admin-only: save a first-page JPEG rendered in the admin's browser (fallback path) */
export async function POST(request: Request, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const item = await getCatalogueItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }
  if (file.size === 0 || file.size > THUMB_MAX_BYTES) {
    return NextResponse.json({ error: "Thumbnail is too large" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (!looksLikeJpeg(buf)) {
    return NextResponse.json({ error: "Thumbnail must be a JPEG image" }, { status: 400 });
  }

  await saveCatalogueThumb(item.id, buf);
  return NextResponse.json({ thumbUrl: await catalogueThumbUrl(item.id, "admin") });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await deleteCatalogueThumb(id);
  return NextResponse.json({ ok: true });
}
