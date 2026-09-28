import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  deleteCatalogueItem,
  getCatalogueItem,
  updateCatalogueItem,
} from "@/lib/catalogues";
import { cataloguePermanentUrl } from "@/lib/site-origin";
import { deleteCatalogueThumb } from "@/lib/catalogue-thumbs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const item = await getCatalogueItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    item: {
      ...item,
      permanentUrl: cataloguePermanentUrl(item.id, request),
      permanentPath: `/r/${item.id}`,
    },
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await getCatalogueItem(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  try {
    const item = await updateCatalogueItem(id, {
      title: body.title,
      kind: body.kind,
      description: body.description,
      published: body.published,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      mimeType: body.mimeType,
    });
    return NextResponse.json({
      item: {
        ...item,
        permanentUrl: cataloguePermanentUrl(item.id, request),
        permanentPath: `/r/${item.id}`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await getCatalogueItem(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteCatalogueItem(id);
  await deleteCatalogueThumb(id);
  return NextResponse.json({ ok: true });
}
