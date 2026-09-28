"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  MOTION_PREHIDE_ID,
  REVEAL_GROUPS,
  REVEAL_SELECTOR,
  isMotionFreePath,
  type RevealKind,
} from "@/lib/motion";

/** Max stagger steps for items that come into view together */
const STAGGER_STEPS = 8;
const STAGGER_MS = 80;

function kindOf(el: Element): RevealKind {
  for (const [kind, selectors] of Object.entries(REVEAL_GROUPS) as [RevealKind, string[]][]) {
    if (selectors.some((selector) => el.matches(selector))) return kind;
  }
  return "block";
}

/** Count a numeric stat up when it appears ("1978", "25+", "1,200", "98%"). Text stats are left alone. */
function countUp(item: Element) {
  const strong = item.querySelector<HTMLElement>("strong");
  if (!strong || strong.dataset.counted) return;
  const raw = (strong.textContent || "").trim();
  const match = raw.match(/^([^\d-]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return;
  const [, prefix, numText, suffix] = match;
  const target = Number.parseFloat(numText.replace(/,/g, ""));
  if (!Number.isFinite(target) || target <= 0) return;
  const decimals = (numText.split(".")[1] || "").length;
  const grouped = numText.includes(",");
  // A year ("1978") rolls up from a few decades earlier instead of spinning from 0
  const isYear = decimals === 0 && !grouped && !prefix && !suffix.trim() && target >= 1900 && target <= 2100;
  const from = isYear ? target - 30 : 0;
  const format = (value: number) => {
    const fixed = decimals ? value.toFixed(decimals) : String(Math.round(value));
    const body = grouped
      ? Number(fixed).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : fixed;
    return `${prefix}${body}${suffix}`;
  };
  strong.dataset.counted = "1";
  strong.setAttribute("aria-label", raw);
  strong.classList.add("fx-counting");
  const duration = 1400;
  const start = performance.now();
  strong.textContent = format(from);
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    if (t < 1) {
      strong.textContent = format(from + (target - from) * eased);
      requestAnimationFrame(step);
    } else {
      strong.textContent = raw;
      strong.classList.remove("fx-counting");
    }
  };
  requestAnimationFrame(step);
}

/**
 * Site-wide scroll reveal + motion flags. Mounted once in the root layout.
 * Adds html.fx (hover polish) and html.fx-reveal (scroll reveal) on live pages only.
 */
export function SiteMotion() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const html = document.documentElement;
    const removePrehide = () => document.getElementById(MOTION_PREHIDE_ID)?.remove();
    const revealAll = () => {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
    };

    // Editor / admin: never hide anything, no hover transforms
    if (isMotionFreePath(pathname) || document.querySelector(".ve-root")) {
      html.classList.remove("fx", "fx-reveal");
      revealAll();
      removePrehide();
      return;
    }

    html.classList.add("fx");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || !("IntersectionObserver" in window)) {
      html.classList.remove("fx-reveal");
      revealAll();
      removePrehide();
      return;
    }

    let batch: HTMLElement[] = [];
    let frame = 0;
    const flush = () => {
      frame = 0;
      const items = batch.sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
      batch = [];
      items.forEach((el, i) => {
        el.style.setProperty("--fx-delay", `${Math.min(i, STAGGER_STEPS) * STAGGER_MS}ms`);
        el.classList.add("is-in");
        if (el.matches(".profile-stats > li")) {
          window.setTimeout(() => countUp(el), Math.min(i, STAGGER_STEPS) * STAGGER_MS);
        }
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          batch.push(entry.target as HTMLElement);
        }
        if (batch.length && !frame) frame = requestAnimationFrame(flush);
      },
      // threshold 0 so very tall blocks (tables) still reveal; start a little before the bottom edge
      { rootMargin: "0px 0px -6% 0px", threshold: 0 },
    );

    const tag = () => {
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        if (el.dataset.reveal) return;
        if (el.closest(".ve-root")) return;
        // Only the outermost candidate animates (no double motion on nested blocks)
        if (el.parentElement?.closest("[data-reveal]")) return;
        el.dataset.reveal = kindOf(el);
        io.observe(el);
      });
    };

    // Tag first, then switch hiding over from the boot pre-hide — same task, so no flash
    tag();
    html.classList.add("fx-reveal");
    removePrehide();

    // Content rendered later (tabs, client components) gets the same treatment
    let pending = 0;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = window.setTimeout(() => {
        pending = 0;
        tag();
      }, 150);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const onReduceChange = () => {
      if (reduce.matches) {
        html.classList.remove("fx-reveal");
        revealAll();
      }
    };
    reduce.addEventListener?.("change", onReduceChange);
    window.addEventListener("beforeprint", revealAll);

    return () => {
      io.disconnect();
      mo.disconnect();
      if (pending) window.clearTimeout(pending);
      if (frame) cancelAnimationFrame(frame);
      reduce.removeEventListener?.("change", onReduceChange);
      window.removeEventListener("beforeprint", revealAll);
    };
  }, [pathname]);

  return null;
}
