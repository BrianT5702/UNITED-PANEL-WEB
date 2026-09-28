import path from "path";
import { readFile } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves pdf.js's browser worker from node_modules with a JavaScript MIME type.
 * Module workers refuse files served as anything but JavaScript, and serving it
 * ourselves avoids depending on how dev/prod webpack emits `new URL(…)` assets.
 */
let cached: Buffer | null = null;

export async function GET() {
  try {
    if (!cached) {
      cached = await readFile(
        path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
      );
    }
    return new Response(new Uint8Array(cached), {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        // URL carries ?v=<pdf.js version>, so long caching is safe
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("pdf.js worker not found", { status: 404 });
  }
}
