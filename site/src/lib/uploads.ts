import path from "path";
import { existsSync } from "fs";

/** Absolute folder for admin image uploads (must match what Next serves as /uploads) */
export function getUploadsDir(): string {
  if (process.env.UPLOADS_DIR) {
    return path.resolve(process.env.UPLOADS_DIR);
  }

  const candidates = [
    path.join(process.cwd(), "public", "uploads"),
    path.join(process.cwd(), "site", "public", "uploads"),
  ];

  for (const dir of candidates) {
    const publicDir = path.dirname(dir);
    const siteRoot = path.dirname(publicDir);
    if (existsSync(path.join(siteRoot, "package.json")) && existsSync(publicDir)) {
      return dir;
    }
  }

  // Default: create under cwd/public/uploads (next start serves this when cwd = site)
  return path.join(process.cwd(), "public", "uploads");
}
