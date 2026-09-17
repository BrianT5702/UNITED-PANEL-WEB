import { promises as fs } from "fs";
import path from "path";
import { prisma } from "./db";

export const CMS_SNAPSHOT_VERSION = 1 as const;

/** Written on localhost Save; committed + pulled so the server can import on deploy */
export const CMS_SNAPSHOT_PATH = path.join(process.cwd(), "content", "cms-snapshot.json");

export type CmsSnapshotSection = {
  page: string;
  key: string;
  /** Parsed JSON object (or raw string if unparsable) */
  data: unknown;
};

export type CmsSnapshot = {
  version: typeof CMS_SNAPSHOT_VERSION;
  exportedAt: string;
  sections: CmsSnapshotSection[];
};

let importing = false;
let exportQueue: Promise<void> = Promise.resolve();

function parseDataField(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function serializeDataField(data: unknown): string {
  if (typeof data === "string") {
    // already a JSON string?
    try {
      JSON.parse(data);
      return data;
    } catch {
      return JSON.stringify(data);
    }
  }
  return JSON.stringify(data);
}

/** Dump every CMS row from the local DB into content/cms-snapshot.json (git-tracked). */
export async function exportCmsSnapshot(): Promise<CmsSnapshot | null> {
  if (importing) return null;
  if (process.env.CMS_SYNC_EXPORT === "0") return null;

  const rows = await prisma.contentSection.findMany({
    orderBy: [{ page: "asc" }, { key: "asc" }],
  });

  const snapshot: CmsSnapshot = {
    version: CMS_SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    sections: rows.map((row) => ({
      page: row.page,
      key: row.key,
      data: parseDataField(row.data),
    })),
  };

  await fs.mkdir(path.dirname(CMS_SNAPSHOT_PATH), { recursive: true });
  await fs.writeFile(CMS_SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return snapshot;
}

/** Queue an export so rapid Saves do not stomp each other. */
export function scheduleCmsSnapshotExport(): void {
  if (importing) return;
  if (process.env.CMS_SYNC_EXPORT === "0") return;
  exportQueue = exportQueue
    .then(() => exportCmsSnapshot())
    .then(() => undefined)
    .catch((err) => {
      console.error("[cms-sync] export failed", err);
    });
}

async function readSnapshotFile(): Promise<CmsSnapshot | null> {
  try {
    const raw = await fs.readFile(CMS_SNAPSHOT_PATH, "utf8");
    const parsed = JSON.parse(raw) as CmsSnapshot;
    if (!parsed || parsed.version !== CMS_SNAPSHOT_VERSION || !Array.isArray(parsed.sections)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Load committed content/cms-snapshot.json into the DB (upsert).
 * Used on server start after git pull so localhost edits deploy with the code.
 */
export async function importCmsSnapshot(): Promise<{ updated: number; skipped: boolean }> {
  const snapshot = await readSnapshotFile();
  if (!snapshot || snapshot.sections.length === 0) {
    return { updated: 0, skipped: true };
  }

  importing = true;
  try {
    let updated = 0;
    for (const section of snapshot.sections) {
      if (!section?.page || !section?.key) continue;
      const data = serializeDataField(section.data);
      await prisma.contentSection.upsert({
        where: { page_key: { page: section.page, key: section.key } },
        create: { page: section.page, key: section.key, data },
        update: { data },
      });
      updated += 1;
    }
    return { updated, skipped: false };
  } finally {
    importing = false;
  }
}
