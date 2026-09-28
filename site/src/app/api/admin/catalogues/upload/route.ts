import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isAuthenticated } from "@/lib/auth";
import { getUploadsDir } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp", "gif"]);
const ALLOWED_MIME_PREFIXES = ["application/pdf", "image/"];

function isAllowed(file: File, ext: string) {
  if (!ALLOWED_EXT.has(ext)) return false;
  const mime = (file.type || "").toLowerCase();
  if (!mime) return ext === "pdf";
  return ALLOWED_MIME_PREFIXES.some((p) => mime === p || mime.startsWith(p));
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 25MB" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase() || "pdf";
  if (!isAllowed(file, ext)) {
    return NextResponse.json(
      { error: "Only PDF (or image) files are allowed for catalogues." },
      { status: 400 },
    );
  }

  const safeExt = ALLOWED_EXT.has(ext) ? ext : "pdf";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${safeExt}`;
  const uploadsDir = path.join(getUploadsDir(), "catalogues");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  const mimeType =
    file.type ||
    (safeExt === "pdf" ? "application/pdf" : `image/${safeExt === "jpg" ? "jpeg" : safeExt}`);

  return NextResponse.json({
    url: `/uploads/catalogues/${filename}`,
    fileName: file.name,
    mimeType,
    size: file.size,
  });
}
