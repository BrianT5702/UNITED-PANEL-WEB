import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCatalogueItem } from "@/lib/catalogues";
import { cataloguePermanentUrl } from "@/lib/site-origin";
import { qrPngBuffer } from "@/lib/qr";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const item = await getCatalogueItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = cataloguePermanentUrl(item.id, request);
  const png = await qrPngBuffer(url, 512);
  const safeName = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "catalogue";

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${safeName}-qr.png"`,
      "Cache-Control": "no-store",
    },
  });
}
