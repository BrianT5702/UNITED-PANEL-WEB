import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isAuthenticated } from "@/lib/auth";
import { getCatalogueItem, updateCatalogueItem } from "@/lib/catalogues";
import { getUploadsDir } from "@/lib/uploads";
import { cataloguePermanentUrl } from "@/lib/site-origin";
import { deleteCatalogueThumb, ensureCatalogueThumb, isPdfItem } from "@/lib/catalogue-thumbs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp", "gif"]);

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await getCatalogueItem(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 25MB" }, { status: 400 });
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase() || "pdf";
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { error: "Only PDF (or image) files are allowed." },
      { status: 400 },
    );
  }

  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const uploadsDir = path.join(getUploadsDir(), "catalogues");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));

  const mimeType =
    file.type ||
    (ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`);

  // Same id — permanent /r/[id] and printed QR stay valid
  const item = await updateCatalogueItem(id, {
    fileUrl: `/uploads/catalogues/${filename}`,
    fileName: file.name,
    mimeType,
  });
  // Old first-page preview no longer matches the file: drop it, then render the
  // new one on the server in the background (lazy routes also create it on demand)
  await deleteCatalogueThumb(id);
  if (isPdfItem(item)) void ensureCatalogueThumb(item, { force: true });

  return NextResponse.json({
    item: {
      ...item,
      permanentUrl: cataloguePermanentUrl(item.id, request),
      permanentPath: `/r/${item.id}`,
    },
  });
}
