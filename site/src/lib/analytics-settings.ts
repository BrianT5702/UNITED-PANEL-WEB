import { prisma } from "./db";
import { scheduleCmsSnapshotExport } from "./cms-sync";

/**
 * Analytics settings, kept in the existing ContentSection table (page "site", key "analyticsPrivacy"), so there is
 * no schema change. Same pattern as the catalogues page switch.
 *
 * respectDnt: false (default) = every visitor is counted, even if their browser sends "Do Not Track" or
 *             "Global Privacy Control". true = those visitors are skipped.
 */
const PAGE = "site";
const KEY = "analyticsPrivacy";
const TTL_MS = 15_000;

type Cache = { respectDnt: boolean; at: number };
const g = globalThis as unknown as { __upAnalyticsSettings?: Cache };

function parse(data: string | undefined | null): boolean {
  if (!data) return false;
  try {
    return (JSON.parse(data) as { respectDnt?: unknown }).respectDnt === true;
  } catch {
    return false;
  }
}

/** Cheap: answered from memory for 15 seconds, so the tracker's collect route does not query the database each time. */
export async function getRespectDnt(): Promise<boolean> {
  const c = g.__upAnalyticsSettings;
  if (c && Date.now() - c.at < TTL_MS) return c.respectDnt;
  let value = false;
  try {
    const row = await prisma.contentSection.findUnique({ where: { page_key: { page: PAGE, key: KEY } }, select: { data: true } });
    value = parse(row?.data);
  } catch {
    value = c?.respectDnt ?? false;
  }
  g.__upAnalyticsSettings = { respectDnt: value, at: Date.now() };
  return value;
}

export async function setRespectDnt(on: boolean): Promise<boolean> {
  const data = JSON.stringify({ respectDnt: Boolean(on) });
  await prisma.contentSection.upsert({
    where: { page_key: { page: PAGE, key: KEY } },
    create: { page: PAGE, key: KEY, data },
    update: { data },
  });
  g.__upAnalyticsSettings = { respectDnt: Boolean(on), at: Date.now() };
  scheduleCmsSnapshotExport();
  return Boolean(on);
}
