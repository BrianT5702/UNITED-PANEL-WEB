import path from "path";
import * as nodeFs from "fs";
import * as nodeModule from "module";
import * as nodeUrl from "url";
import { pathToFileURL } from "url";

/**
 * Server-side (Node) first-page renderer for catalogue PDFs.
 * Uses the pdf.js legacy build + @napi-rs/canvas (prebuilt binaries, no native
 * compile — works on Windows). Only load this from `runtime = "nodejs"` routes.
 */

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type CanvasLib = {
  createCanvas: (w: number, h: number) => {
    width: number;
    height: number;
    getContext: (type: "2d") => unknown;
    encode: (format: "jpeg", quality?: number) => Promise<Buffer>;
  };
};

function projectRequire() {
  return nodeModule.createRequire(path.join(process.cwd(), "package.json"));
}

/**
 * pdf.js 4.10 loads its Node helpers (and @napi-rs/canvas) through
 * process.getBuiltinModule, which only exists from Node 20.16 / 22.3.
 * Polyfill it for older Node 20 (e.g. 20.14) before pdf.js is imported.
 * Uses statically imported built-ins: inside Next's webpack bundle a
 * createRequire() call made here would be rewritten and not work.
 * (pdf.js itself is external, so its own createRequire stays real Node.)
 */
function ensureGetBuiltinModule() {
  const proc = process as unknown as { getBuiltinModule?: (id: string) => unknown };
  if (typeof proc.getBuiltinModule === "function") return;
  const builtins: Record<string, unknown> = { fs: nodeFs, module: nodeModule, url: nodeUrl, path };
  proc.getBuiltinModule = (id: string) => builtins[id.startsWith("node:") ? id.slice(5) : id];
}

let libPromise: Promise<{ pdfjs: PdfJs; canvas: CanvasLib; pkgDir: string }> | null = null;

/**
 * pdf.js and @napi-rs/canvas are loaded straight from node_modules at call time
 * (native import()/require that webpack leaves alone). That keeps them out of
 * the Next bundles and guarantees the polyfill above runs before pdf.js
 * evaluates — bundled/external imports can be evaluated early at server start.
 */
function loadLib() {
  if (!libPromise) {
    libPromise = (async () => {
      ensureGetBuiltinModule();
      const req = projectRequire();
      let pkgDir: string;
      try {
        pkgDir = path.dirname(req.resolve("pdfjs-dist/package.json"));
      } catch {
        pkgDir = path.join(process.cwd(), "node_modules", "pdfjs-dist");
      }
      const fileHref = (rel: string) => pathToFileURL(path.join(pkgDir, rel)).href;
      const pdfjs = (await import(
        /* webpackIgnore: true */ fileHref("legacy/build/pdf.mjs")
      )) as PdfJs;
      // Run pdf.js's worker code in-process (no worker thread needed on the server)
      const g = globalThis as { pdfjsWorker?: unknown };
      if (!g.pdfjsWorker) {
        g.pdfjsWorker = await import(/* webpackIgnore: true */ fileHref("legacy/build/pdf.worker.mjs"));
      }
      const canvas = req("@napi-rs/canvas") as CanvasLib;
      return { pdfjs, canvas, pkgDir };
    })();
    libPromise.catch(() => {
      libPromise = null;
    });
  }
  return libPromise;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Render page 1 of a PDF (bytes) to a JPEG about `width` px wide */
export async function renderPdfFirstPageJpegServer(
  data: Uint8Array,
  { width = 600, quality = 0.82 }: { width?: number; quality?: number } = {},
): Promise<Buffer> {
  const { pdfjs, canvas, pkgDir } = await loadLib();
  const task = pdfjs.getDocument({
    data,
    standardFontDataUrl: path.join(pkgDir, "standard_fonts") + path.sep,
    cMapUrl: path.join(pkgDir, "cmaps") + path.sep,
    cMapPacked: true,
    isEvalSupported: false,
    verbosity: 0,
  });
  const run = async () => {
    const doc = await task.promise;
    try {
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / base.width });
      const c = canvas.createCanvas(Math.round(viewport.width), Math.round(viewport.height));
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      return await c.encode("jpeg", Math.round(quality * 100));
    } finally {
      await doc.destroy();
    }
  };
  try {
    return await withTimeout(run(), 90_000, "PDF preview");
  } catch (err) {
    void task.destroy().catch(() => {});
    throw err;
  }
}
