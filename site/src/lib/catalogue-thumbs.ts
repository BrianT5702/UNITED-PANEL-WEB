import path from "path";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "fs/promises";
import { getUploadsDir } from "./uploads";

/**
 * First-page thumbnails for catalogue PDFs, saved at a fixed path per item:
 *   public/uploads/catalogues/thumbs/<id>.jpg
 * No database field — the file's existence is the source of truth.
 *
 * Created on the SERVER (pdf.js + @napi-rs/canvas) when a file is uploaded or
 * replaced, and lazily the first time a thumbnail URL is requested. The admin
 * page can also render one in the browser and upload it as a fallback.
 *
 * Served through routes (not the static /uploads path) so new files work in
 * `next start` too, and hidden items' previews stay admin-only:
 *   public:  /r/<id>/thumb                      (published items only)
 *   admin:   /api/admin/catalogues/<id>/thumb
 */

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
export const THUMB_MAX_BYTES = 3 * 1024 * 1024;
const PDF_MAX_BYTES = 200 * 1024 * 1024;
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

function thumbsDir() {
  return path.join(getUploadsDir(), "catalogues", "thumbs");
}

function thumbFile(id: string): string | null {
  if (!SAFE_ID.test(id)) return null;
  return path.join(thumbsDir(), `${id}.jpg`);
}

export function isPdfItem(item: { mimeType: string; fileUrl: string; fileName?: string }): boolean {
  const lower = (s: string) => s.toLowerCase().split(/[?#]/)[0];
  return (
    item.mimeType.toLowerCase().includes("pdf") ||
    lower(item.fileUrl).endsWith(".pdf") ||
    (item.fileName ? lower(item.fileName).endsWith(".pdf") : false)
  );
}

/** Absolute path of a file stored under /uploads, or null (external / unsafe URL) */
export function resolveUploadPath(fileUrl: string): string | null {
  if (!fileUrl.startsWith("/uploads/")) return null;
  const root = path.resolve(getUploadsDir());
  let rel: string;
  try {
    rel = decodeURIComponent(fileUrl.slice("/uploads/".length).split(/[?#]/)[0]);
  } catch {
    return null;
  }
  const abs = path.resolve(root, rel);
  return abs.startsWith(root + path.sep) ? abs : null;
}

/**
 * URL of the thumbnail (cache-busted by file mtime), or null if none exists yet.
 * "public" is for the website (published items); "admin" for the admin page.
 */
export async function catalogueThumbUrl(
  id: string,
  scope: "public" | "admin" = "public",
): Promise<string | null> {
  const file = thumbFile(id);
  if (!file) return null;
  try {
    const s = await stat(file);
    if (!s.isFile() || s.size === 0) return null;
    const base = scope === "admin" ? `/api/admin/catalogues/${id}/thumb` : `/r/${id}/thumb`;
    return `${base}?v=${Math.round(s.mtimeMs)}`;
  } catch {
    return null;
  }
}

/** JPEG bytes of the thumbnail, or null */
export async function readCatalogueThumb(id: string): Promise<Buffer | null> {
  const file = thumbFile(id);
  if (!file) return null;
  try {
    const buf = await readFile(file);
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

/** Response for a thumbnail image (the ?v= cache-buster makes long caching safe) */
export function thumbResponse(jpeg: Buffer, cache = "public, max-age=31536000, immutable"): Response {
  return new Response(new Uint8Array(jpeg), {
    status: 200,
    headers: { "Content-Type": "image/jpeg", "Cache-Control": cache },
  });
}

/** JPEG files start with FF D8 FF */
export function looksLikeJpeg(buf: Buffer): boolean {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

/** Write atomically (temp file + rename) so readers never see a half-written JPEG */
export async function saveCatalogueThumb(id: string, jpeg: Buffer): Promise<void> {
  const file = thumbFile(id);
  if (!file) throw new Error("Invalid id");
  await mkdir(thumbsDir(), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, jpeg);
  try {
    await rename(tmp, file);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }
}

export async function deleteCatalogueThumb(id: string): Promise<void> {
  const file = thumbFile(id);
  if (!file) return;
  jobState().failures.delete(id);
  try {
    await unlink(file);
  } catch {
    /* already gone */
  }
}

// —— Server-side generation (de-duplicated across requests and route bundles) ——

type JobState = {
  running: Map<string, Promise<ThumbResult>>;
  failures: Map<string, { at: number; error: string }>;
};

export type ThumbResult = { ok: true } | { ok: false; error: string };

function jobState(): JobState {
  const g = globalThis as { __catalogueThumbJobs?: JobState };
  if (!g.__catalogueThumbJobs) {
    g.__catalogueThumbJobs = { running: new Map(), failures: new Map() };
  }
  return g.__catalogueThumbJobs;
}

/**
 * Make sure a PDF item has a thumbnail, rendering it on the server if needed.
 * Concurrent callers share one render. Failures are remembered for a few
 * minutes (unless `force`) so a broken PDF isn't re-rendered on every request.
 */
export async function ensureCatalogueThumb(
  item: { id: string; fileUrl: string; mimeType: string; fileName?: string },
  { force = false }: { force?: boolean } = {},
): Promise<ThumbResult> {
  if (!thumbFile(item.id)) return { ok: false, error: "Invalid id" };
  if (!isPdfItem(item)) return { ok: false, error: "Not a PDF" };
  const state = jobState();

  const running = state.running.get(item.id);
  if (running) {
    if (!force) return running;
    // A forced re-render (e.g. file replaced) must not reuse an older render
    await running;
    return ensureCatalogueThumb(item, { force });
  }

  if (!force) {
    if (await readCatalogueThumb(item.id)) return { ok: true };
    const failed = state.failures.get(item.id);
    if (failed && Date.now() - failed.at < FAILURE_COOLDOWN_MS) {
      return { ok: false, error: failed.error };
    }
  }

  // Re-check after the awaits above so simultaneous requests share one render
  const started = state.running.get(item.id);
  if (started) return force ? ensureCatalogueThumb(item, { force }) : started;

  const job = (async (): Promise<ThumbResult> => {
    try {
      const src = resolveUploadPath(item.fileUrl);
      if (!src) throw new Error("File is not stored on this site");
      const s = await stat(src);
      if (s.size > PDF_MAX_BYTES) throw new Error("PDF is too large to preview");
      const data = new Uint8Array(await readFile(src));
      // Loaded on demand so pages that never need a preview don't pay for pdf.js
      const { renderPdfFirstPageJpegServer } = await import("./pdf-thumb-server");
      const jpeg = await renderPdfFirstPageJpegServer(data, { width: 600, quality: 0.82 });
      await saveCatalogueThumb(item.id, jpeg);
      state.failures.delete(item.id);
      return { ok: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      state.failures.set(item.id, { at: Date.now(), error });
      console.warn(`[catalogue thumbs] could not render preview for ${item.id}: ${error}`);
      return { ok: false, error };
    } finally {
      state.running.delete(item.id);
    }
  })();
  state.running.set(item.id, job);
  return job;
}
