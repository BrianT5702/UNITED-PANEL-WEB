import type { NavItem } from "./types";

/** Default top navigation — used until an admin saves their own menu */
export const DEFAULT_SITE_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About Us",
    href: "/about",
    children: [
      { label: "Company Profile", href: "/about/company-profile" },
      { label: "Vision & Mission", href: "/about/vision-mission" },
      { label: "Research & Development", href: "/about/research-development" },
      { label: "Certified, Recognized and Approved", href: "/about/certified" },
      { label: "FM Global Approval", href: "/about/certified/fm-global" },
      { label: "TÜV Fire Classification", href: "/about/certified/tuv" },
      { label: "ISO, SIRIM & Bomba", href: "/about/certified/quality-recognition" },
    ],
  },
  {
    label: "Products",
    href: "/products",
    children: [
      { label: "All products", href: "/products" },
      { label: "PIR Panels", href: "/products/pir" },
      { label: "PU Panels", href: "/products/pu" },
      { label: "RockWool Panels", href: "/products/rockwool" },
    ],
  },
  { label: "Services", href: "/services" },
  { label: "Refrigeration Parts", href: "/parts" },
  { label: "Contact Us", href: "/contact" },
];

/** @deprecated Prefer getSiteNav() from content — kept for fallbacks */
export const SITE_NAV = DEFAULT_SITE_NAV;

function cleanHref(href: string): string {
  const t = (href || "").trim();
  if (!t) return "/";
  if (/^(https?:|mailto:|tel:)/i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

export function normalizeNavItems(raw: unknown): NavItem[] {
  if (!Array.isArray(raw)) return cloneNav(DEFAULT_SITE_NAV);
  const items: NavItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const label = String((entry as NavItem).label || "").trim();
    if (!label) continue;
    const href = cleanHref(String((entry as NavItem).href || "/"));
    const childrenRaw = (entry as NavItem).children;
    const children = Array.isArray(childrenRaw)
      ? childrenRaw
          .map((child) => {
            const childLabel = String(child?.label || "").trim();
            if (!childLabel) return null;
            return {
              label: childLabel,
              href: cleanHref(String(child?.href || "/")),
            };
          })
          .filter((c): c is { label: string; href: string } => Boolean(c))
      : undefined;
    items.push({
      label,
      href,
      ...(children && children.length > 0 ? { children } : {}),
    });
  }
  return items.length > 0 ? items : cloneNav(DEFAULT_SITE_NAV);
}

export function cloneNav(items: NavItem[]): NavItem[] {
  return items.map((item) => ({
    label: item.label,
    href: item.href,
    children: item.children?.map((c) => ({ label: c.label, href: c.href })),
  }));
}
