import { prisma } from "./db";
import type { HomeContent, HomeSectionKey, NavItem } from "./types";
import { HOME_SECTION_KEYS } from "./types";
import { defaultHomeContent } from "./defaults";
import { defaultPirContent, type PirContent } from "./pir";
import { DEFAULT_SITE_NAV, normalizeNavItems, cloneNav } from "./nav";
import type { PageDocument } from "./page-document";
import { repairApplicationSlideshow, repairCertCardGrids, repairSectionNotes } from "./page-document";
import { getDefaultPageDocument } from "./page-defaults";
import {
  SITE_PAGES,
  buildCustomPageMeta,
  mergeSitePages,
  normalizeCustomPages,
  type PageGroup,
  type SitePage,
} from "./pages";
import { panelProductToDocument } from "./panel-to-document";
import { defaultPirContent as defaultPirPanel } from "./panels";
import { newId } from "./page-document";

const NAV_PAGE = "site";
const NAV_KEY = "navigation";
const CUSTOM_PAGES_KEY = "customPages";

export async function getSiteNav(): Promise<NavItem[]> {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: NAV_PAGE, key: NAV_KEY } },
  });
  if (!row) return cloneNav(DEFAULT_SITE_NAV);
  try {
    const parsed = JSON.parse(row.data) as { items?: unknown };
    return normalizeNavItems(parsed?.items ?? parsed);
  } catch {
    return cloneNav(DEFAULT_SITE_NAV);
  }
}

export async function saveSiteNav(items: NavItem[]) {
  const normalized = normalizeNavItems(items);
  const payload = JSON.stringify({ items: normalized });
  await prisma.contentSection.upsert({
    where: { page_key: { page: NAV_PAGE, key: NAV_KEY } },
    create: { page: NAV_PAGE, key: NAV_KEY, data: payload },
    update: { data: payload },
  });
  return normalized;
}

export async function getCustomPages(): Promise<SitePage[]> {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: NAV_PAGE, key: CUSTOM_PAGES_KEY } },
  });
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.data) as { pages?: unknown };
    return normalizeCustomPages(parsed?.pages ?? parsed);
  } catch {
    return [];
  }
}

export async function getAllSitePages(): Promise<SitePage[]> {
  return mergeSitePages(await getCustomPages());
}

export async function findSitePage(pageId: string): Promise<SitePage | undefined> {
  const pages = await getAllSitePages();
  return pages.find((p) => p.id === pageId);
}

function emptyPageDocument(page: SitePage): PageDocument {
  return {
    title: page.label,
    chrome: page.group === "About" ? "about" : "default",
    about:
      page.group === "About"
        ? { crumbs: [{ label: page.label }], activeHref: page.path, image: "" }
        : undefined,
    sections: [
      {
        id: newId("richText"),
        type: "richText",
        data: {
          title: page.label,
          body: "This is a new page. Use the admin editor to add your content.",
        },
      },
    ],
  };
}

async function saveCustomPagesList(pages: SitePage[]) {
  const customOnly = pages.filter((p) => p.custom);
  await prisma.contentSection.upsert({
    where: { page_key: { page: NAV_PAGE, key: CUSTOM_PAGES_KEY } },
    create: {
      page: NAV_PAGE,
      key: CUSTOM_PAGES_KEY,
      data: JSON.stringify({ pages: customOnly }),
    },
    update: { data: JSON.stringify({ pages: customOnly }) },
  });
}

/** Create a blank CMS page admins can edit and link from the menu */
export async function createEmptySitePage(input: {
  label: string;
  group?: Exclude<PageGroup, "Home">;
}): Promise<{ page: SitePage } | { error: string }> {
  const group = input.group || "Other";
  const existing = await getAllSitePages();
  const meta = buildCustomPageMeta(input.label, group, existing);
  if ("error" in meta) return meta;

  const page: SitePage = {
    id: meta.id,
    label: meta.label,
    path: meta.path,
    group: meta.group,
    custom: true,
  };

  const custom = await getCustomPages();
  custom.push(page);
  await saveCustomPagesList(custom);
  await savePageDocument(page.id, emptyPageDocument(page));
  return { page };
}

export async function getHomeContent(): Promise<HomeContent> {
  const rows = await prisma.contentSection.findMany({
    where: { page: "home" },
  });

  if (rows.length === 0) {
    return {
      ...defaultHomeContent,
      nav: { items: await getSiteNav() },
    };
  }

  const map = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.data)])) as Partial<HomeContent>;
  const merged = {
    ...defaultHomeContent,
    ...map,
  } as HomeContent;

  merged.nav = { items: await getSiteNav() };
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

function normalizeDocument(doc: PageDocument): PageDocument {
  return repairCertCardGrids(repairSectionNotes(repairApplicationSlideshow(doc)));
}

export async function getPageDocument(pageId: string): Promise<PageDocument> {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: pageId, key: "document" } },
  });
  const fallback = getDefaultPageDocument(pageId);

  // One-time bridge: older PIR blob → products/pir document
  if (!row && pageId === "products/pir") {
    const pirRow = await prisma.contentSection.findUnique({
      where: { page_key: { page: "pir", key: "page" } },
    });
    if (pirRow) {
      try {
        const pirData = { ...defaultPirPanel, ...JSON.parse(pirRow.data), slug: "pir" as const };
        return normalizeDocument(panelProductToDocument(pirData));
      } catch {
        /* use fallback */
      }
    }
  }

  if (!row) return normalizeDocument(fallback);
  try {
    const parsed = JSON.parse(row.data) as PageDocument;
    return normalizeDocument({
      ...fallback,
      ...parsed,
      sections: Array.isArray(parsed.sections) ? parsed.sections : fallback.sections,
      about: parsed.about ?? fallback.about,
      chrome: parsed.chrome ?? fallback.chrome,
    });
  } catch {
    return normalizeDocument(fallback);
  }
}

export async function savePageDocument(pageId: string, document: PageDocument) {
  await prisma.contentSection.upsert({
    where: { page_key: { page: pageId, key: "document" } },
    create: { page: pageId, key: "document", data: JSON.stringify(document) },
    update: { data: JSON.stringify(document) },
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

  for (const page of SITE_PAGES) {
    await prisma.contentSection.upsert({
      where: { page_key: { page: page.id, key: "document" } },
      create: {
        page: page.id,
        key: "document",
        data: JSON.stringify(getDefaultPageDocument(page.id)),
      },
      update: {},
    });
  }

  const nav = await prisma.contentSection.findUnique({
    where: { page_key: { page: NAV_PAGE, key: NAV_KEY } },
  });
  if (!nav) {
    await prisma.contentSection.create({
      data: {
        page: NAV_PAGE,
        key: NAV_KEY,
        data: JSON.stringify({ items: cloneNav(DEFAULT_SITE_NAV) }),
      },
    });
  }

  const customPages = await prisma.contentSection.findUnique({
    where: { page_key: { page: NAV_PAGE, key: CUSTOM_PAGES_KEY } },
  });
  if (!customPages) {
    await prisma.contentSection.create({
      data: {
        page: NAV_PAGE,
        key: CUSTOM_PAGES_KEY,
        data: JSON.stringify({ pages: [] }),
      },
    });
  }
}
