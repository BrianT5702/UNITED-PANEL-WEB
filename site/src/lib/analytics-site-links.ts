import { SITE_PAGES } from "./pages";
import { getAllSitePages, getHomeContent, getPageDocument, getSiteNav } from "./content";

/**
 * Which kinds of clickable links does the public website really contain?
 * Used by the analytics dashboard to hide "WhatsApp / phone / email / outbound" cards on sites that have none.
 * Reads the saved page content (database) and the built-in defaults, never the visitors. Cached for 5 minutes.
 */
export type SiteLinkKinds = { tel: boolean; mailto: boolean; whatsapp: boolean; outbound: boolean; form: boolean };

let cache: { at: number; value: SiteLinkKinds } | null = null;
const TTL = 5 * 60_000;
const SKIP_KEYS = /image|img|logo|src|background|poster|photo|thumb|icon|video|favicon|alt$/i;

function scan(node: unknown, key: string, out: SiteLinkKinds) {
  if (typeof node === "string") {
    if (SKIP_KEYS.test(key)) return;
    const v = node.trim();
    if (/^tel:/i.test(v)) out.tel = true;
    else if (/^mailto:/i.test(v)) out.mailto = true;
    else if (/^(https?:)?\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com|whatsapp\.com)(\/|$)/i.test(v)) out.whatsapp = true;
    else if (/^https?:\/\//i.test(v)) out.outbound = true;
    return;
  }
  if (Array.isArray(node)) {
    for (const x of node) scan(x, key, out);
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) scan(v, k, out);
  }
}

export async function getSiteLinkKinds(): Promise<SiteLinkKinds> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  const out: SiteLinkKinds = { tel: false, mailto: false, whatsapp: false, outbound: false, form: false };
  try {
    const pages = await getAllSitePages().catch(() => SITE_PAGES);
    const [home, nav] = await Promise.all([getHomeContent().catch(() => null), getSiteNav().catch(() => [])]);
    scan(home, "", out);
    scan(nav, "", out);
    for (const p of pages) {
      if (p.id === "home") continue;
      const doc = await getPageDocument(p.id).catch(() => null);
      scan(doc, "", out);
    }
    // the public pages contain no working form (the old static forms are not rendered), so "form" only shows if it was ever recorded
  } catch {
    /* if the scan fails, fall back to "show what has ever been recorded" */
  }
  cache = { at: Date.now(), value: out };
  return out;
}
