import { createHash } from "crypto";
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

/**
 * Private bookkeeping row (never exported / imported): hash of the snapshot file
 * this database last imported or wrote. The snapshot is only re-imported when the
 * file really changed (git pull / deploy / hand edit) — not on every page render,
 * which used to put the file's older content back over a fresh Save.
 */
const SYNC_STATE_PAGE = "__cms_sync";
const SYNC_STATE_KEY = "state";

/** Import and export run one at a time, in order (an export is never dropped). */
let syncQueue: Promise<unknown> = Promise.resolve();
function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const next = syncQueue.then(task, task);
  syncQueue = next.catch(() => undefined);
  return next;
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

async function readSyncHash(): Promise<string | null> {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: SYNC_STATE_PAGE, key: SYNC_STATE_KEY } },
  });
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.data) as { snapshotHash?: string };
    return typeof parsed.snapshotHash === "string" ? parsed.snapshotHash : null;
  } catch {
    return null;
  }
}

async function writeSyncHash(snapshotHash: string): Promise<void> {
  const data = JSON.stringify({ snapshotHash, at: new Date().toISOString() });
  await prisma.contentSection.upsert({
    where: { page_key: { page: SYNC_STATE_PAGE, key: SYNC_STATE_KEY } },
    create: { page: SYNC_STATE_PAGE, key: SYNC_STATE_KEY, data },
    update: { data },
  });
}

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
export function exportCmsSnapshot(): Promise<CmsSnapshot | null> {
  if (process.env.CMS_SYNC_EXPORT === "0") return Promise.resolve(null);
  return runExclusive(exportNow);
}

async function exportNow(): Promise<CmsSnapshot | null> {
  const rows = await prisma.contentSection.findMany({
    where: { page: { not: SYNC_STATE_PAGE } },
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

  const text = `${JSON.stringify(snapshot, null, 2)}\n`;
  await fs.mkdir(path.dirname(CMS_SNAPSHOT_PATH), { recursive: true });
  await fs.writeFile(CMS_SNAPSHOT_PATH, text, "utf8");
  // Our own file now matches the DB — do not import it back over later Saves
  await writeSyncHash(hashText(text));
  return snapshot;
}

/** Queue an export so rapid Saves do not stomp each other. */
export function scheduleCmsSnapshotExport(): void {
  if (process.env.CMS_SYNC_EXPORT === "0") return;
  exportCmsSnapshot().catch((err) => {
    console.error("[cms-sync] export failed", err);
  });
}

async function readSnapshotFile(): Promise<{ snapshot: CmsSnapshot; hash: string } | null> {
  try {
    const raw = await fs.readFile(CMS_SNAPSHOT_PATH, "utf8");
    const parsed = JSON.parse(raw) as CmsSnapshot;
    if (!parsed || parsed.version !== CMS_SNAPSHOT_VERSION || !Array.isArray(parsed.sections)) {
      return null;
    }
    return { snapshot: parsed, hash: hashText(raw) };
  } catch {
    return null;
  }
}

/**
 * Load committed content/cms-snapshot.json into the DB (upsert).
 * Runs when the file changed since this DB last imported / exported it
 * (e.g. after git pull on the server), or always with { force: true }.
 */
export function importCmsSnapshot(
  options: { force?: boolean } = {},
): Promise<{ updated: number; skipped: boolean }> {
  return runExclusive(async () => {
    const file = await readSnapshotFile();
    if (!file || file.snapshot.sections.length === 0) {
      return { updated: 0, skipped: true };
    }
    if (!options.force && (await readSyncHash()) === file.hash) {
      return { updated: 0, skipped: true };
    }

    let updated = 0;
    for (const section of file.snapshot.sections) {
      if (!section?.page || !section?.key || section.page === SYNC_STATE_PAGE) continue;
      const data = serializeDataField(section.data);
      await prisma.contentSection.upsert({
        where: { page_key: { page: section.page, key: section.key } },
        create: { page: section.page, key: section.key, data },
        update: { data },
      });
      updated += 1;
    }
    await writeSyncHash(file.hash);
    return { updated, skipped: false };
  });
}
