export type PageGroup = "Home" | "About" | "Products" | "Other";

export type SitePage = {
  id: string;
  label: string;
  path: string;
  group: PageGroup;
  /** True when created by an admin (not built into the app) */
  custom?: boolean;
};

/** Built-in editable public pages (always available) */
export const SITE_PAGES: SitePage[] = [
  { id: "home", label: "Homepage", path: "/", group: "Home" },

  { id: "about", label: "About Us", path: "/about", group: "About" },
  { id: "about/company-profile", label: "Company Profile", path: "/about/company-profile", group: "About" },
  { id: "about/vision-mission", label: "Vision & Mission", path: "/about/vision-mission", group: "About" },
  {
    id: "about/research-development",
    label: "Research & Development",
    path: "/about/research-development",
    group: "About",
  },
  { id: "about/certified", label: "Certified hub", path: "/about/certified", group: "About" },
  { id: "about/certified/fm-global", label: "FM Global", path: "/about/certified/fm-global", group: "About" },
  { id: "about/certified/tuv", label: "TÜV", path: "/about/certified/tuv", group: "About" },
  {
    id: "about/certified/quality-recognition",
    label: "ISO / SIRIM / Bomba",
    path: "/about/certified/quality-recognition",
    group: "About",
  },

  { id: "products", label: "Products", path: "/products", group: "Products" },
  { id: "products/pir", label: "PIR Panels", path: "/products/pir", group: "Products" },
  { id: "products/pu", label: "PU Panels", path: "/products/pu", group: "Products" },
  { id: "products/rockwool", label: "RockWool", path: "/products/rockwool", group: "Products" },

  { id: "parts", label: "Refrigeration Parts", path: "/parts", group: "Other" },
  { id: "services", label: "Services", path: "/services", group: "Other" },
  { id: "contact", label: "Contact", path: "/contact", group: "Other" },
];

/** Groups admins can put a new empty page into */
export const CREATABLE_PAGE_GROUPS: Exclude<PageGroup, "Home">[] = ["About", "Products", "Other"];

const RESERVED_TOP_SEGMENTS = new Set([
  "admin",
  "api",
  "_next",
  "uploads",
  "favicon.ico",
  "about",
  "products",
  "parts",
  "services",
  "contact",
]);

export function getSitePage(id: string, pages: SitePage[] = SITE_PAGES): SitePage | undefined {
  return pages.find((p) => p.id === id);
}

export function getSitePageByPath(path: string, pages: SitePage[] = SITE_PAGES): SitePage | undefined {
  const clean = path.split("?")[0].split("#")[0] || "/";
  return pages.find((p) => p.path === clean);
}

export function pageIdFromPathSegments(segments: string[] | undefined): string {
  if (!segments || segments.length === 0) return "home";
  return segments.join("/");
}

export function adminEditHref(pageId: string): string {
  if (pageId === "home") return "/admin/edit";
  return `/admin/edit/${pageId}`;
}

export function slugifyLabel(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "page";
}

/** Build id + public path for a new page from title + section */
export function buildCustomPageMeta(
  label: string,
  group: Exclude<PageGroup, "Home">,
  existing: SitePage[],
): { id: string; path: string; label: string; group: Exclude<PageGroup, "Home"> } | { error: string } {
  const cleanLabel = label.trim().replace(/\s+/g, " ");
  if (!cleanLabel) return { error: "Enter a page title." };
  if (cleanLabel.length > 80) return { error: "Title is too long." };

  let base = slugifyLabel(cleanLabel);
  if (group === "Other" && RESERVED_TOP_SEGMENTS.has(base)) {
    base = `${base}-page`;
  }

  let id =
    group === "About" ? `about/${base}` : group === "Products" ? `products/${base}` : base;
  let path = `/${id}`;

  let n = 2;
  while (existing.some((p) => p.id === id || p.path === path)) {
    const suffix = `-${n}`;
    id =
      group === "About"
        ? `about/${base}${suffix}`
        : group === "Products"
          ? `products/${base}${suffix}`
          : `${base}${suffix}`;
    path = `/${id}`;
    n += 1;
    if (n > 50) return { error: "Could not find a free page address." };
  }

  return { id, path, label: cleanLabel, group };
}

export function normalizeCustomPages(raw: unknown): SitePage[] {
  if (!Array.isArray(raw)) return [];
  const out: SitePage[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const id = String((entry as SitePage).id || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");
    const label = String((entry as SitePage).label || "").trim();
    const pathRaw = String((entry as SitePage).path || "").trim();
    const groupRaw = String((entry as SitePage).group || "Other");
    if (!id || !label) continue;
    const group: PageGroup =
      groupRaw === "About" || groupRaw === "Products" || groupRaw === "Home" || groupRaw === "Other"
        ? groupRaw
        : "Other";
    if (group === "Home") continue;
    const path = pathRaw.startsWith("/") ? pathRaw : `/${pathRaw || id}`;
    if (SITE_PAGES.some((p) => p.id === id || p.path === path)) continue;
    out.push({ id, label, path, group, custom: true });
  }
  return out;
}

export function mergeSitePages(custom: SitePage[]): SitePage[] {
  const byId = new Map<string, SitePage>();
  for (const p of SITE_PAGES) byId.set(p.id, p);
  for (const p of custom) {
    if (!byId.has(p.id)) byId.set(p.id, { ...p, custom: true });
  }
  return [...byId.values()];
}

/** Map a live site path to its admin edit URL when known */
export function livePathToAdminEdit(path: string, pages: SitePage[] = SITE_PAGES): string {
  const clean = path.split("?")[0].split("#")[0] || "/";
  if (/^(https?:|mailto:|tel:)/i.test(clean)) return path;

  const exact = pages.find((p) => p.path === clean);
  if (exact) return adminEditHref(exact.id);

  const prefix = [...pages]
    .filter((p) => p.path !== "/" && clean.startsWith(`${p.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  if (prefix) return adminEditHref(prefix.id);

  // Custom / unknown site paths → admin edit by id (= path without leading /)
  if (clean.startsWith("/") && clean !== "/") {
    return adminEditHref(clean.slice(1));
  }
  return path;
}

export function navItemsForAdminEdit(
  items: { label: string; href: string; children?: { label: string; href: string }[] }[],
  pages: SitePage[] = SITE_PAGES,
) {
  return items.map((item) => ({
    ...item,
    href: livePathToAdminEdit(item.href, pages),
    children: item.children?.map((child) => ({
      ...child,
      href: livePathToAdminEdit(child.href, pages),
    })),
  }));
}
