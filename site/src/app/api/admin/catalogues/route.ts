import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createCatalogueItem,
  listCatalogueItems,
  normalizeKind,
} from "@/lib/catalogues";
import { cataloguePermanentUrl } from "@/lib/site-origin";
import { qrDataUrl } from "@/lib/qr";
import { catalogueThumbUrl, ensureCatalogueThumb, isPdfItem } from "@/lib/catalogue-thumbs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await listCatalogueItems();
  const withLinks = await Promise.all(
    items.map(async (item) => {
      const permanentUrl = cataloguePermanentUrl(item.id, request);
      let qrPreview: string | null = null;
      try {
        qrPreview = await qrDataUrl(permanentUrl, 180);
      } catch {
        qrPreview = null;
      }
      return {
        ...item,
        permanentUrl,
        permanentPath: `/r/${item.id}`,
        qrPreview,
        isPdf: isPdfItem(item),
        thumbUrl: await catalogueThumbUrl(item.id, "admin"),
      };
    }),
  );
  return NextResponse.json({ items: withLinks });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const fileUrl = String(body.fileUrl || "").trim();
  const fileName = String(body.fileName || "").trim();
  const mimeType = String(body.mimeType || "application/pdf").trim();
  if (!title) {
    return NextResponse.json({ error: "Please enter a title." }, { status: 400 });
  }
  if (!fileUrl || !fileName) {
    return NextResponse.json({ error: "Please upload a file first." }, { status: 400 });
  }
  try {
    const item = await createCatalogueItem({
      title,
      kind: normalizeKind(body.kind),
      description: body.description != null ? String(body.description) : null,
      fileUrl,
      fileName,
      mimeType,
      published: body.published !== false,
    });
    const permanentUrl = cataloguePermanentUrl(item.id, request);
    // Create the first-page preview on the server in the background
    if (isPdfItem(item)) void ensureCatalogueThumb(item);
    return NextResponse.json({
      item: {
        ...item,
        permanentUrl,
        permanentPath: `/r/${item.id}`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create item." },
      { status: 400 },
    );
  }
}
