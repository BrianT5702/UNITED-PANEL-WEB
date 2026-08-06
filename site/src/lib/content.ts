import { prisma } from "./db";
import type { HomeContent, HomeSectionKey, NavItem } from "./types";
import { HOME_SECTION_KEYS } from "./types";
import { defaultHomeContent } from "./defaults";
import { defaultPirContent, type PirContent } from "./pir";
import { SITE_NAV } from "./nav";

function withRequiredNav(_nav?: { items: NavItem[] }) {
  return { items: SITE_NAV };
}

export async function getHomeContent(): Promise<HomeContent> {
  const rows = await prisma.contentSection.findMany({
    where: { page: "home" },
  });

  if (rows.length === 0) {
    return defaultHomeContent;
  }

  const map = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.data)])) as Partial<HomeContent>;
  const merged = {
    ...defaultHomeContent,
    ...map,
  } as HomeContent;

  merged.nav = withRequiredNav(merged.nav || defaultHomeContent.nav);
  return merged;
}

export async function getSection<K extends HomeSectionKey>(key: K): Promise<HomeContent[K]> {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: "home", key } },
  });
  if (!row) return defaultHomeContent[key];
  return JSON.parse(row.data) as HomeContent[K];
}

export async function saveSection<K extends HomeSectionKey>(key: K, data: HomeContent[K]) {
  await prisma.contentSection.upsert({
    where: { page_key: { page: "home", key } },
    create: { page: "home", key, data: JSON.stringify(data) },
    update: { data: JSON.stringify(data) },
  });
}

export async function getPirContent(): Promise<typeof defaultPirContent> {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: "pir", key: "page" } },
  });
  if (!row) return defaultPirContent;
  return { ...defaultPirContent, ...JSON.parse(row.data), slug: "pir" };
}

export async function savePirContent(data: PirContent) {
  await prisma.contentSection.upsert({
    where: { page_key: { page: "pir", key: "page" } },
    create: { page: "pir", key: "page", data: JSON.stringify(data) },
    update: { data: JSON.stringify(data) },
  });
}

export async function ensureSeeded() {
  const count = await prisma.contentSection.count({ where: { page: "home" } });
  if (count === 0) {
    for (const key of HOME_SECTION_KEYS) {
      await prisma.contentSection.create({
        data: {
          page: "home",
          key,
          data: JSON.stringify(defaultHomeContent[key]),
        },
      });
    }
  }

  const pir = await prisma.contentSection.findUnique({
    where: { page_key: { page: "pir", key: "page" } },
  });
  if (!pir) {
    await prisma.contentSection.create({
      data: { page: "pir", key: "page", data: JSON.stringify(defaultPirContent) },
    });
  }
}
