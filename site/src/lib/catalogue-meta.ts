import path from "path";
import { stat } from "fs/promises";
import { getUploadsDir } from "./uploads";

/** File size for files stored under /uploads (null if unknown / external) */
export async function uploadedFileSize(fileUrl: string): Promise<number | null> {
  if (!fileUrl.startsWith("/uploads/")) return null;
  try {
    const root = getUploadsDir();
    const rel = decodeURIComponent(fileUrl.slice("/uploads/".length).split(/[?#]/)[0]);
    const abs = path.resolve(root, rel);
    if (!abs.startsWith(root + path.sep)) return null;
    const s = await stat(abs);
    return s.isFile() ? s.size : null;
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number | null): string | null {
  if (bytes == null) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileTypeLabel(mimeType: string, fileName: string): string {
  if (mimeType.includes("pdf")) return "PDF";
  const ext = fileName.split(".").pop()?.toUpperCase();
  if (ext && ext.length <= 4) return ext === "JPEG" ? "JPG" : ext;
  return mimeType.startsWith("image/") ? "Image" : "File";
}

/** "28 Sep 2026" in Malaysia time */
export function formatUpdatedDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  });
}
