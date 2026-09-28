import { NextResponse } from "next/server";
import { getCatalogueItem } from "@/lib/catalogues";
import { cataloguePermanentUrl } from "@/lib/site-origin";
import { qrPngBuffer } from "@/lib/qr";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Public QR code (PNG) for a published catalogue / brochure.
 * - /r/<id>/qr             → inline image (used in the Share dialog)
 * - /r/<id>/qr?download=1  → forces a file download
 * Hidden (unpublished) or unknown items return 404 so nothing leaks.
 */
export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const item = await getCatalogueItem(id);
  if (!item || !item.published) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";
  const requested = Number(searchParams.get("size"));
  const size = Number.isFinite(requested) && requested >= 128 ? Math.min(requested, 1024) : 512;

  const png = await qrPngBuffer(cataloguePermanentUrl(item.id, request), size);
  const safeName =
    item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "catalogue";

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}-qr.png"`,
      "Cache-Control": "no-store",
    },
  });
}
