import { prisma } from "./db";
import type { HomeContent, HomeSectionKey, NavItem } from "./types";
import { HOME_SECTION_KEYS } from "./types";
import { defaultHomeContent } from "./defaults";
import { defaultPirContent, type PirContent } from "./pir";
import { DEFAULT_SITE_NAV, normalizeNavItems, cloneNav } from "./nav";
import type { PageDocument, PageSection } from "./page-document";
import { repairApplicationSlideshow, repairCertCardGrids, repairSectionNotes, stripRichTextImages } from "./page-document";
import { getDefaultPageDocument, legacyContactDocument } from "./page-defaults";
import { CAREER_ENQUIRY_HREF } from "./phase2-documents";
import { promises as fsp } from "fs";
import path from "path";
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


const CATALOGUES_NAV: NavItem = { label: "Catalogues", href: "/catalogues" };

/** Append Catalogues before Contact Us if missing — keeps custom menus intact */
export function ensureCataloguesNavItem(items: NavItem[]): NavItem[] {
  const has = items.some(
    (i) => i.href === "/catalogues" || i.label.toLowerCase() === "catalogues",
  );
  if (has) return items;
  const next = cloneNav(items);
  const contactIdx = next.findIndex(
    (i) => i.href === "/contact" || i.label.toLowerCase().includes("contact"),
  );
  if (contactIdx >= 0) {
    next.splice(contactIdx, 0, { ...CATALOGUES_NAV });
  } else {
    next.push({ ...CATALOGUES_NAV });
  }
  return next;
}


export async function getSiteNav(): Promise<NavItem[]> {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: NAV_PAGE, key: NAV_KEY } },
  });
  if (!row) return ensureCataloguesNavItem(cloneNav(DEFAULT_SITE_NAV));
  try {
    const parsed = JSON.parse(row.data) as { items?: unknown };
    return ensureCataloguesNavItem(normalizeNavItems(parsed?.items ?? parsed));
  } catch {
    return ensureCataloguesNavItem(cloneNav(DEFAULT_SITE_NAV));
  }
}

// —— "Show Catalogues page on website" (stored in ContentSection, no schema change) ——

const CATALOGUES_SETTINGS_KEY = "cataloguesPage";

/** Whether visitors can see /catalogues (and its menu item). Defaults to visible. */
export async function getCataloguesPagePublic(): Promise<boolean> {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: NAV_PAGE, key: CATALOGUES_SETTINGS_KEY } },
  });
  if (!row) return true;
  try {
    return (JSON.parse(row.data) as { public?: unknown }).public !== false;
  } catch {
    return true;
  }
}

export async function setCataloguesPagePublic(isPublic: boolean) {
  const payload = JSON.stringify({ public: Boolean(isPublic) });
  await prisma.contentSection.upsert({
    where: { page_key: { page: NAV_PAGE, key: CATALOGUES_SETTINGS_KEY } },
    create: { page: NAV_PAGE, key: CATALOGUES_SETTINGS_KEY, data: payload },
    update: { data: payload },
  });
  scheduleCmsSnapshotExport();
  return Boolean(isPublic);
}

function isCataloguesLink(i: { label: string; href: string }) {
  return i.href === "/catalogues" || i.href.startsWith("/catalogues?") || i.href.startsWith("/catalogues#");
}

/**
 * Menu for the public website: same as getSiteNav(), minus "Catalogues" while
 * the Catalogues page is switched off. (Admin editors keep using getSiteNav().)
 */
export async function getPublicSiteNav(): Promise<NavItem[]> {
  const [items, cataloguesPublic] = await Promise.all([getSiteNav(), getCataloguesPagePublic()]);
  if (cataloguesPublic) return items;
  return items
    .filter((i) => !isCataloguesLink(i))
    .map((i) =>
      i.children ? { ...i, children: i.children.filter((c) => !isCataloguesLink(c)) } : i,
    );
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
  return stripRichTextImages(repairCertCardGrids(repairSectionNotes(repairApplicationSlideshow(doc))));
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
  /** Only consider these default keys (blocks the page has never had yet) */
  onlyKeys?: Set<string>,
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
    if (onlyKeys && !onlyKeys.has(key)) continue;
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
  const cleaned = normalizeDocument(document);
  await prisma.contentSection.upsert({
    where: { page_key: { page: pageId, key: "document" } },
    create: { page: pageId, key: "document", data: JSON.stringify(cleaned) },
    update: { data: JSON.stringify(cleaned) },
  });
  scheduleCmsSnapshotExport();
}


/** Keys of the code-default blocks each page has already been given (site/defaultSectionsSeen). */
const SEEN_DEFAULTS_PAGE = "site";
const SEEN_DEFAULTS_KEY = "defaultSectionsSeen";
type SeenDefaults = { version: 1; pages: Record<string, string[]> };

function eligibleDefaultKeys(defaults: PageDocument): string[] {
  return defaults.sections
    .filter((def) => {
      const data = def.data as { title?: string; headline?: string; brand?: string };
      return Boolean((data.title || data.headline || data.brand || "").trim());
    })
    .map(defaultSectionKey);
}

/**
 * Add default blocks that are NEW in the code (a page has never had them) to saved pages.
 * A default block the admin deleted is remembered as "seen" and never put back — so
 * deleting any block (e.g. the Career contact box) and saving sticks.
 * First run records every page's current defaults as seen without adding anything
 * (the old logic had already filled them in).
 */
async function syncMissingDefaultSections() {
  const seenRow = await prisma.contentSection.findUnique({
    where: { page_key: { page: SEEN_DEFAULTS_PAGE, key: SEEN_DEFAULTS_KEY } },
  });
  let seen: SeenDefaults = { version: 1, pages: {} };
  if (seenRow) {
    try {
      const parsed = JSON.parse(seenRow.data) as Partial<SeenDefaults>;
      if (parsed && typeof parsed.pages === "object" && parsed.pages) {
        seen = { version: 1, pages: { ...parsed.pages } };
      }
    } catch {
      /* start fresh */
    }
  }
  let seenChanged = !seenRow;

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
    const defaultKeys = eligibleDefaultKeys(defaults);
    const known = Array.isArray(seen.pages[page.id]) ? seen.pages[page.id] : null;
    if (!known) {
      // First time we track this page: whatever it has now is what the admin wants
      seen.pages[page.id] = defaultKeys;
      seenChanged = true;
      continue;
    }
    const knownSet = new Set(known);
    const fresh = defaultKeys.filter((key) => !knownSet.has(key));
    if (!fresh.length) continue;

    const { document, added } = mergeMissingDefaultSections(saved, defaults, new Set(fresh));
    if (added > 0) {
      await savePageDocument(page.id, normalizeDocument(document));
    }
    seen.pages[page.id] = [...known, ...fresh];
    seenChanged = true;
  }

  if (seenChanged) {
    const data = JSON.stringify(seen);
    await prisma.contentSection.upsert({
      where: { page_key: { page: SEEN_DEFAULTS_PAGE, key: SEEN_DEFAULTS_KEY } },
      create: { page: SEEN_DEFAULTS_PAGE, key: SEEN_DEFAULTS_KEY, data },
      update: { data },
    });
    scheduleCmsSnapshotExport();
  }
}

/** Private row (not exported). Stops the Rockwool spec publish from running twice. */
const CONTENT_PATCH_PAGE = "__cms_sync";
const CONTENT_PATCH_KEY = "contentPatches";
const ROCKWOOL_SPEC_PATCH_ID = "rockwool-specs-2026-09-28";

const OLD_ROCKWOOL_CAPABILITY_BULLET =
  "Technical details available on request — not published in full";
const NEW_ROCKWOOL_CAPABILITY_BULLET =
  "Standard range published — thickness, joint, skins and finishes";
const OLD_ROCKWOOL_POINTS_NOTE =
  "Full technical specifications and thickness ranges are available on enquiry — published figures will be added once approved.";
const NEW_ROCKWOOL_POINTS_NOTE =
  "Standard thickness, joint, skin and finish options are listed under Product range & data.";
const OLD_ROCKWOOL_SPECS_NOTE =
  "Stakeholder preview — final claims, thicknesses, and certificates subject to management approval.";

function rockwoolSpecsArePlaceholder(rows: { label: string; value: string }[], lead?: string): boolean {
  if ((lead ?? "").startsWith("Directional product data")) return true;
  return rows.some(
    (row) =>
      row.label === "Panel type" ||
      row.label === "Thickness range" ||
      row.label === "Joint system" ||
      row.value.includes("Available on enquiry"),
  );
}

/**
 * Replace the placeholder Rockwool spec block with the published UR® Rock-Panel range.
 * Returns null when the page already has that range. One database apply is enough;
 * later admin edits to the table are left in place.
 */
export function patchRockwoolPublishedSpecs(document: PageDocument): PageDocument | null {
  const defaults = getDefaultPageDocument("products/rockwool");
  const defaultSpecs = defaults.sections.find((section) => section.id === "rw-specs");
  if (!defaultSpecs || defaultSpecs.type !== "specsTable") return null;

  let changed = false;
  const sections = document.sections.map((section) => {
    if (section.id === "rw-capability" && section.type === "featureList") {
      let itemsChanged = false;
      const items = section.data.items.map((item) => {
        if (item !== OLD_ROCKWOOL_CAPABILITY_BULLET) return item;
        itemsChanged = true;
        return NEW_ROCKWOOL_CAPABILITY_BULLET;
      });
      const buttons = (section.buttons ?? []).filter((button) => button.id !== "rw-cap-btn");
      const buttonsChanged = buttons.length !== (section.buttons ?? []).length;
      if (!itemsChanged && !buttonsChanged) return section;
      changed = true;
      return { ...section, data: { ...section.data, items }, buttons };
    }

    if (section.id === "rw-product" && section.type === "mediaText") {
      if (section.data.linkLabel !== "Request specifications →") return section;
      changed = true;
      return { ...section, data: { ...section.data, linkLabel: "" } };
    }

    if (section.id === "rw-product-points" && section.type === "featureList") {
      if (section.note !== OLD_ROCKWOOL_POINTS_NOTE) return section;
      changed = true;
      return { ...section, note: NEW_ROCKWOOL_POINTS_NOTE };
    }

    const isRockwoolSpecs =
      section.type === "specsTable" &&
      (section.id === "rw-specs" || section.data.title === "Specifications (RockWool)");
    if (!isRockwoolSpecs || section.type !== "specsTable") return section;

    const replaceTable = rockwoolSpecsArePlaceholder(section.data.rows, section.data.lead);
    const buttons = (section.buttons ?? []).filter((button) => button.id !== "rw-specs-btn");
    const buttonsChanged = buttons.length !== (section.buttons ?? []).length;
    const noteChanged = section.note === OLD_ROCKWOOL_SPECS_NOTE;
    if (!replaceTable && !buttonsChanged && !noteChanged) return section;

    changed = true;
    return {
      ...section,
      note: noteChanged ? undefined : section.note,
      buttons,
      data: replaceTable
        ? {
            ...section.data,
            lead: defaultSpecs.data.lead,
            rows: defaultSpecs.data.rows.map((row) => ({ ...row })),
          }
        : section.data,
    };
  });

  if (!changed) return null;
  return { ...document, sections };
}

async function readContentPatches(): Promise<string[]> {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: CONTENT_PATCH_PAGE, key: CONTENT_PATCH_KEY } },
  });
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.data) as { ids?: unknown };
    return Array.isArray(parsed.ids) ? parsed.ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

async function writeContentPatches(ids: string[]) {
  const data = JSON.stringify({ ids });
  await prisma.contentSection.upsert({
    where: { page_key: { page: CONTENT_PATCH_PAGE, key: CONTENT_PATCH_KEY } },
    create: { page: CONTENT_PATCH_PAGE, key: CONTENT_PATCH_KEY, data },
    update: { data },
  });
}

/** Publish the Rockwool spec range onto a saved page that still has the enquiry placeholder. */
async function applyRockwoolSpecPatchOnce() {
  const applied = await readContentPatches();
  if (applied.includes(ROCKWOOL_SPEC_PATCH_ID)) return;

  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: "products/rockwool", key: "document" } },
  });
  if (row) {
    try {
      const saved = JSON.parse(row.data) as PageDocument;
      if (Array.isArray(saved.sections)) {
        const next = patchRockwoolPublishedSpecs(saved);
        if (next) await savePageDocument("products/rockwool", next);
      }
    } catch {
      return;
    }
  }

  await writeContentPatches([...applied, ROCKWOOL_SPEC_PATCH_ID]);
}

const CONTACT_PAGE_PATCH_ID = "contact-page-offices-form-2026-10-02";
const CAREER_LINK_PATCH_ID = "career-enquiry-subject-link-2026-10-02";

/** Copy a saved page document to content/backups before a patch changes it (best effort). */
async function backupSavedDocument(pageId: string, raw: string, tag: string) {
  try {
    const dir = path.join(process.cwd(), "content", "backups");
    await fsp.mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const name = `${pageId.replace(/[^a-z0-9]+/gi, "-")}-document-before-${tag}-${stamp}.json`;
    await fsp.writeFile(path.join(dir, name), raw, "utf8");
  } catch (err) {
    console.error("[content] could not write backup", err);
  }
}

function sortedJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)))
      : v,
  );
}

/**
 * Career box "Send an enquiry" button → Contact page with the subject pre-filled.
 * Only rewrites a button/link that still points at plain /contact.
 */
export function patchCareerEnquiryLink(document: PageDocument): PageDocument | null {
  const isPlainContact = (href?: string) => (href || "").trim().replace(/\/+$/, "").toLowerCase() === "/contact";
  let changed = false;
  const sections = document.sections.map((section) => {
    if (section.type !== "contactCta") return section;
    let next: PageSection = section;
    if (section.buttons?.some((b) => isPlainContact(b.href))) {
      changed = true;
      next = {
        ...next,
        buttons: section.buttons.map((b) => (isPlainContact(b.href) ? { ...b, href: CAREER_ENQUIRY_HREF } : b)),
      } as PageSection;
    }
    if (section.data.ctaLabel && isPlainContact(section.data.ctaHref)) {
      changed = true;
      next = { ...next, data: { ...(next.data as object), ctaHref: CAREER_ENQUIRY_HREF } } as PageSection;
    }
    return next;
  });
  return changed ? { ...document, sections } : null;
}

/**
 * One-time upgrades of saved pages (each runs once per database, backup written first):
 * - Contact page: an untouched old copy becomes the new offices + map + enquiry form page.
 *   (A page the admin edited is left alone; sync then just adds the new blocks.)
 * - Career page: the enquiry button opens /contact?subject=Enquiries%20about%20jobs.
 */
async function applyContactAndCareerPatchesOnce() {
  const applied = await readContentPatches();
  const next = [...applied];

  if (!applied.includes(CONTACT_PAGE_PATCH_ID)) {
    const row = await prisma.contentSection.findUnique({
      where: { page_key: { page: "contact", key: "document" } },
    });
    if (row) {
      try {
        const saved = JSON.parse(row.data) as PageDocument;
        const legacy = legacyContactDocument();
        if (
          Array.isArray(saved.sections) &&
          sortedJson(saved.sections) === sortedJson(legacy.sections) &&
          (saved.title || "") === legacy.title
        ) {
          await backupSavedDocument("contact", row.data, "offices-form");
          await savePageDocument("contact", getDefaultPageDocument("contact"));
        }
      } catch {
        /* leave the saved page as it is */
      }
    }
    next.push(CONTACT_PAGE_PATCH_ID);
  }

  if (!applied.includes(CAREER_LINK_PATCH_ID)) {
    const row = await prisma.contentSection.findUnique({
      where: { page_key: { page: "career", key: "document" } },
    });
    if (row) {
      try {
        const saved = JSON.parse(row.data) as PageDocument;
        if (Array.isArray(saved.sections)) {
          const patched = patchCareerEnquiryLink(saved);
          if (patched) {
            await backupSavedDocument("career", row.data, "subject-link");
            await savePageDocument("career", patched);
          }
        }
      } catch {
        /* leave the saved page as it is */
      }
    }
    next.push(CAREER_LINK_PATCH_ID);
  }

  if (next.length !== applied.length) await writeContentPatches(next);
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

  // Load content/cms-snapshot.json. deploy.sh merges server edits into that file
  // before restart, so this import does not replace live pages with a raw git pull.
  await importCmsSnapshot();

  // One-time page upgrades (Contact page rebuild, Career enquiry link) before default-block sync.
  await applyContactAndCareerPatchesOnce();

  // Then fill any default blocks still missing from code defaults.
  await syncMissingDefaultSections();

  // The Rockwool page is one CMS document, so a deploy merge keeps the whole
  // server copy and the published spec table never lands. Apply it once.
  await applyRockwoolSpecPatchOnce();

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
  } else {
    // Soft-append Catalogues if an older saved menu is missing it (do not wipe custom menus)
    try {
      const parsed = JSON.parse(nav.data) as { items?: unknown };
      const current = normalizeNavItems(parsed?.items ?? parsed);
      const patched = ensureCataloguesNavItem(current);
      if (patched.length !== current.length) {
        await prisma.contentSection.update({
          where: { page_key: { page: NAV_PAGE, key: NAV_KEY } },
          data: { data: JSON.stringify({ items: patched }) },
        });
        scheduleCmsSnapshotExport();
      }
    } catch {
      /* keep existing nav */
    }
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
