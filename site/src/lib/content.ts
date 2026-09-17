import { prisma } from "./db";
import type { HomeContent, HomeSectionKey, NavItem } from "./types";
import { HOME_SECTION_KEYS } from "./types";
import { defaultHomeContent } from "./defaults";
import { defaultPirContent, type PirContent } from "./pir";
import { DEFAULT_SITE_NAV, normalizeNavItems, cloneNav } from "./nav";
import type { PageDocument, PageSection } from "./page-document";
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
import { importCmsSnapshot, scheduleCmsSnapshotExport } from "./cms-sync";

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
  scheduleCmsSnapshotExport();
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
  scheduleCmsSnapshotExport();
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
  scheduleCmsSnapshotExport();
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
  scheduleCmsSnapshotExport();
}

function normalizeDocument(doc: PageDocument): PageDocument {
  return repairCertCardGrids(repairSectionNotes(repairApplicationSlideshow(doc)));
}


/** Stable-ish fingerprint so we can detect a default block missing from a saved page */
function defaultSectionKey(section: PageSection): string {
  const data = section.data as {
    eyebrow?: string;
    title?: string;
    headline?: string;
    brand?: string;
  };
  const title = (data.title || data.headline || data.brand || "").trim().toLowerCase();
  const eyebrow = (data.eyebrow || "").trim().toLowerCase();
  return `${section.type}|${eyebrow}|${title}`;
}

/**
 * Insert any default sections that are missing from a saved document.
 * Keeps existing admin edits and custom blocks; only adds what defaults have
 * that the saved page does not (matched by type + eyebrow + title).
 */
export function mergeMissingDefaultSections(
  saved: PageDocument,
  defaults: PageDocument,
): { document: PageDocument; added: number } {
  const sections = [...(saved.sections || [])];
  const savedKeys = new Set(sections.map(defaultSectionKey));
  let added = 0;

  for (let di = 0; di < defaults.sections.length; di++) {
    const def = defaults.sections[di];
    const key = defaultSectionKey(def);
    // Require a title so empty stubs are not treated as unique defaults
    const data = def.data as { title?: string; headline?: string; brand?: string };
    if (!(data.title || data.headline || data.brand || "").trim()) continue;
    if (savedKeys.has(key)) continue;

    let insertAt = sections.length;
    for (let pj = di - 1; pj >= 0; pj--) {
      const prevKey = defaultSectionKey(defaults.sections[pj]);
      const prevIdx = sections.findIndex((s) => defaultSectionKey(s) === prevKey);
      if (prevIdx >= 0) {
        insertAt = prevIdx + 1;
        break;
      }
    }
    if (insertAt === sections.length) {
      for (let nj = di + 1; nj < defaults.sections.length; nj++) {
        const nextKey = defaultSectionKey(defaults.sections[nj]);
        const nextIdx = sections.findIndex((s) => defaultSectionKey(s) === nextKey);
        if (nextIdx >= 0) {
          insertAt = nextIdx;
          break;
        }
      }
    }

    const clone = structuredClone(def) as PageSection;
    clone.id = newId(def.type);
    sections.splice(insertAt, 0, clone);
    savedKeys.add(key);
    added += 1;
  }

  if (!added) return { document: saved, added: 0 };
  return {
    document: {
      ...saved,
      sections,
      // keep chrome/about from saved; fill only if missing
      chrome: saved.chrome ?? defaults.chrome,
      about: saved.about ?? defaults.about,
      title: saved.title || defaults.title,
    },
    added,
  };
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
  scheduleCmsSnapshotExport();
}


async function syncMissingDefaultSections() {
  const pages = mergeSitePages(await getCustomPages());
  for (const page of pages) {
    const row = await prisma.contentSection.findUnique({
      where: { page_key: { page: page.id, key: "document" } },
    });
    if (!row) continue;

    let saved: PageDocument;
    try {
      saved = JSON.parse(row.data) as PageDocument;
    } catch {
      continue;
    }
    if (!Array.isArray(saved.sections)) continue;

    const defaults = getDefaultPageDocument(page.id);
    const { document, added } = mergeMissingDefaultSections(saved, defaults);
    if (added > 0) {
      await savePageDocument(page.id, normalizeDocument(document));
    }
  }
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

  // Deploy sync: load committed CMS snapshot from git (localhost edits you pushed).
  await importCmsSnapshot();

  // Then fill any default blocks still missing from code defaults.
  await syncMissingDefaultSections();

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
