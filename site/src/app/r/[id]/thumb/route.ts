import { getCatalogueItem } from "@/lib/catalogues";
import {
  ensureCatalogueThumb,
  isPdfItem,
  readCatalogueThumb,
  thumbResponse,
} from "@/lib/catalogue-thumbs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Public first-page preview — published items only, so hidden items never leak.
 * If the preview doesn't exist yet it is rendered once on the server, saved, and served.
 */
export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const item = await getCatalogueItem(id);
  if (!item || !item.published) return new Response("Not found", { status: 404 });

  let jpeg = await readCatalogueThumb(item.id);
  if (!jpeg && isPdfItem(item)) {
    await ensureCatalogueThumb(item);
    jpeg = await readCatalogueThumb(item.id);
  }
  if (!jpeg) {
    // Short cache so a later successful render shows up
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  // Long caching only for versioned URLs (?v=…); bare URLs may change after a regenerate
  const versioned = new URL(request.url).searchParams.has("v");
  return thumbResponse(jpeg, versioned ? undefined : "public, max-age=300");
}
