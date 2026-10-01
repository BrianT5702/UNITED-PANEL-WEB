/**
 * Site-wide motion (live pages only — never the admin editor).
 *
 * Progressive enhancement:
 * - Without JS nothing is hidden (banner entrances are pure CSS and always finish).
 * - MOTION_BOOT_SCRIPT (inline, before first paint) hides reveal candidates so content
 *   in view on load does not flash visible → hidden → fade in. It removes itself after
 *   3 s if the runtime (SiteMotion) never starts, so content can never stay hidden.
 * - SiteMotion tags candidates with data-reveal, then reveals them with an
 *   IntersectionObserver (opacity + translate/scale only — no layout shift).
 */

/** Reveal kinds: how an element enters */
export type RevealKind = "text" | "card" | "media" | "block";

/** Selector groups (all scoped to <main> so header/footer/editor chrome are untouched) */
export const REVEAL_GROUPS: Record<RevealKind, string[]> = {
  text: [
    "main .section-head > *",
    "main .capability > div:not(.capability-visual)",
    "main .pb-collage-copy > *",
  ],
  card: [
    "main .product-grid > *",
    "main .home-gateway-grid > *",
    "main .offer-grid > *",
    "main .panel-cert-grid > *",
    "main .panel-finish-grid > *",
    "main .panel-app-grid > *",
    "main .feature-list > *",
    "main .attribute-grid > *",
    "main .pb-gallery > *",
    "main .cat-lib-grid > *",
    "main .profile-stats > li",
    "main .proof-item",
    "main .pb-collage-tile",
  ],
  media: [
    "main .capability-visual",
    "main .rw-product-photo",
  ],
  block: [
    "main .pb-callout",
    "main .home-contact-teaser",
    "main .logo-slides",
    "main .panel-joint",
    "main .spec-table",
    "main .data-table-wrap",
    "main .product-data-table-wrap",
  ],
};

export const REVEAL_SELECTOR = Object.values(REVEAL_GROUPS).flat().join(", ");

/** Paths that never get motion (editor, admin tools) */
export function isMotionFreePath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export const MOTION_PREHIDE_ID = "fx-prehide";

/**
 * Inline <head> script. Runs before the body paints.
 * Skips: admin paths, reduced motion, browsers without IntersectionObserver.
 */
export const MOTION_BOOT_SCRIPT = `(function(){try{
var p=location.pathname;if(p==="/admin"||p.indexOf("/admin/")===0)return;
if(!("IntersectionObserver" in window))return;
if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var s=document.createElement("style");s.id=${JSON.stringify(MOTION_PREHIDE_ID)};
s.textContent=${JSON.stringify(`${REVEAL_SELECTOR}{opacity:0}`)};
document.head.appendChild(s);
setTimeout(function(){var e=document.getElementById(${JSON.stringify(MOTION_PREHIDE_ID)});if(e&&!document.documentElement.classList.contains("fx-reveal"))e.remove();},3000);
}catch(e){}})();`;
