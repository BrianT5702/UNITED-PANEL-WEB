"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CLEAR_HIGHLIGHT_PROPS,
  HIGHLIGHT_COLOR_PAIRS,
  TEXT_COLOR_PAIRS,
  companionHighlightColors,
  companionTextColors,
  highlightStyle,
  normalizeToHex,
  textColorStyle,
} from "@/lib/rich-text-colors";

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Site Body", value: "var(--font-body)" },
  { label: "Site Display", value: "var(--font-display)" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
];

const SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32];

type PanelId = "color" | "highlight" | null;

function hexEq(a: string, b: string): boolean {
  const na = normalizeToHex(a) ?? a.trim().toLowerCase();
  const nb = normalizeToHex(b) ?? b.trim().toLowerCase();
  return na.toLowerCase() === nb.toLowerCase();
}


/** Nearest ul/ol ancestor from caret (inside the editable). */
function listFromSelection(): "ul" | "ol" | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const node = sel.getRangeAt(0).startContainer;
  let el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE
      ? (node.parentElement as HTMLElement | null)
      : (node as HTMLElement);
  while (el) {
    if (el.isContentEditable) return null;
    const tag = el.tagName;
    if (tag === "UL") return "ul";
    if (tag === "OL") return "ol";
    el = el.parentElement;
  }
  return null;
}

type TextAlign = "left" | "center" | "justify";

const BLOCK_ALIGN_TAGS = new Set([
  "P",
  "DIV",
  "LI",
  "UL",
  "OL",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
]);

function normalizeAlign(raw: string): TextAlign | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === "left" || v === "start" || v === "initial" || v === "inherit") return "left";
  if (v === "center") return "center";
  if (v === "justify") return "justify";
  // right / end — not offered in the toolbar; treat as unset for active state
  return null;
}

/** Alignment of the nearest block ancestor (or computed style on the editable). */
function alignFromSelection(editable: HTMLElement | null): TextAlign {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return "left";
  const node = sel.getRangeAt(0).startContainer;
  let el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE
      ? (node.parentElement as HTMLElement | null)
      : (node as HTMLElement);
  while (el && el !== editable) {
    if (BLOCK_ALIGN_TAGS.has(el.tagName)) {
      const inline = el.style.textAlign || el.getAttribute("align") || "";
      if (inline) {
        const n = normalizeAlign(inline);
        if (n) return n;
      }
      try {
        const computed = window.getComputedStyle(el).textAlign;
        const n = normalizeAlign(computed);
        if (n) return n;
      } catch {
        /* ignore */
      }
      break;
    }
    el = el.parentElement;
  }
  if (editable) {
    try {
      const computed = window.getComputedStyle(editable).textAlign;
      return normalizeAlign(computed) ?? "left";
    } catch {
      /* ignore */
    }
  }
  return "left";
}

/** Nearest styled span from caret / selection start. */
function spanFromSelection(): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const node = sel.getRangeAt(0).startContainer;
  let el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE
      ? (node.parentElement as HTMLElement | null)
      : (node as HTMLElement);
  while (el) {
    if (el.isContentEditable) return null;
    if (el.tagName === "SPAN") return el;
    el = el.parentElement;
  }
  return null;
}

function matchFontValue(raw: string): string {
  const v = raw.trim().replace(/^["']|["']$/g, "");
  if (!v) return "";
  for (const f of FONT_OPTIONS) {
    if (f.value === raw || f.value === v) return f.value;
    // Computed style may expand CSS vars or strip quotes
    if (raw.includes(f.value) || f.value.includes(v)) return f.value;
    const bare = f.value.replace(/["']/g, "");
    if (bare === v || raw.replace(/["']/g, "") === bare) return f.value;
  }
  // Match by first family name token
  const first = v.split(",")[0].trim().toLowerCase();
  for (const f of FONT_OPTIONS) {
    const optFirst = f.value.replace(/["']/g, "").split(",")[0].trim().toLowerCase();
    if (optFirst === first) return f.value;
  }
  return "";
}

function matchSizeValue(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim().toLowerCase();
  let px = parseFloat(trimmed);
  if (!Number.isFinite(px)) return "";
  if (trimmed.endsWith("rem")) {
    const root =
      typeof document !== "undefined"
        ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
        : 16;
    px = px * root;
  } else if (trimmed.endsWith("em") && !trimmed.endsWith("rem")) {
    px = px * 16;
  }
  const rounded = Math.round(px);
  return SIZE_OPTIONS.includes(rounded) ? String(rounded) : "";
}

/** Expand a collapsed caret to the nearest word (same text node). */
function expandCollapsedToWord(range: Range): boolean {
  if (!range.collapsed) return true;
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return false;
  const text = node.textContent || "";
  let start = range.startOffset;
  let end = range.endOffset;
  while (start > 0 && /\S/.test(text[start - 1]!)) start--;
  while (end < text.length && /\S/.test(text[end]!)) end++;
  if (start === end) return false;
  range.setStart(node, start);
  range.setEnd(node, end);
  return true;
}

function writeStylesOnto(
  el: HTMLElement,
  styles: Record<string, string>,
  clearProps?: string[],
) {
  for (const [k, v] of Object.entries(styles)) {
    el.style.setProperty(k, v);
  }
  if (clearProps) {
    for (const p of clearProps) el.style.removeProperty(p);
  }
}

/**
 * Apply CSS properties to the current selection via <span style="…">.
 * Collapsed caret: expand to word when possible; otherwise start a typing-style
 * span (consistent with Bold/Italic via execCommand on an empty selection).
 */

const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "LI",
  "UL",
  "OL",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
]);

function rangeTouchesBlock(range: Range, editable: HTMLElement): boolean {
  const walker = document.createTreeWalker(editable, NodeFilter.SHOW_ELEMENT);
  let n: Node | null = walker.currentNode;
  while (n) {
    if (
      n instanceof HTMLElement &&
      n !== editable &&
      BLOCK_TAGS.has(n.tagName) &&
      range.intersectsNode(n)
    ) {
      return true;
    }
    n = walker.nextNode();
  }
  return false;
}

/** Apply inline styles to text nodes only — never wrap block elements in a span. */
function applyStylesToTextInRange(
  range: Range,
  editable: HTMLElement,
  styles: Record<string, string>,
  clearProps?: string[],
) {
  const texts: { node: Text; start: number; end: number }[] = [];
  const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT);
  let n: Node | null = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE && range.intersectsNode(n)) {
      const text = n as Text;
      let start = 0;
      let end = text.data.length;
      if (text === range.startContainer) start = range.startOffset;
      if (text === range.endContainer) end = range.endOffset;
      // When the range starts/ends in an element, offsets do not apply to this text node
      if (range.startContainer !== text && range.endContainer !== text) {
        // fully covered if intersects — keep whole node when ancestor selection
        start = 0;
        end = text.data.length;
      } else {
        if (range.startContainer !== text) start = 0;
        if (range.endContainer !== text) end = text.data.length;
      }
      if (end > start && text.data.slice(start, end).replace(/\u200b/g, "").length > 0) {
        texts.push({ node: text, start, end });
      }
    }
    n = walker.nextNode();
  }

  // Process from the end so splits do not invalidate earlier offsets
  for (let i = texts.length - 1; i >= 0; i--) {
    const { node, start, end } = texts[i]!;
    let target = node;
    if (start > 0 || end < node.data.length) {
      if (end < node.data.length) node.splitText(end);
      target = start > 0 ? node.splitText(start) : node;
    }
    const parent = target.parentElement;
    if (
      parent &&
      parent.tagName === "SPAN" &&
      parent.childNodes.length === 1 &&
      parent.firstChild === target
    ) {
      writeStylesOnto(parent, styles, clearProps);
      if (!parent.getAttribute("style")?.trim()) unwrap(parent);
    } else {
      const wrapper = document.createElement("span");
      writeStylesOnto(wrapper, styles, clearProps);
      parent?.insertBefore(wrapper, target);
      wrapper.appendChild(target);
    }
  }
}

/** If a span illegally contains blocks, hoist the blocks and push styles inward. */
function hoistBlocksOutOfSpan(span: HTMLElement) {
  const kids = Array.from(span.childNodes);
  if (!kids.some((k) => k instanceof HTMLElement && BLOCK_TAGS.has(k.tagName))) return;

  const parent = span.parentNode;
  if (!parent) return;
  const styleAttr = span.getAttribute("style");

  for (const child of kids) {
    span.removeChild(child);
    if (child instanceof HTMLElement && BLOCK_TAGS.has(child.tagName)) {
      if (styleAttr) {
        const inner = document.createElement("span");
        inner.setAttribute("style", styleAttr);
        while (child.firstChild) inner.appendChild(child.firstChild);
        if (inner.childNodes.length) child.appendChild(inner);
      }
      parent.insertBefore(child, span);
    } else {
      const wrap = document.createElement("span");
      if (styleAttr) wrap.setAttribute("style", styleAttr);
      wrap.appendChild(child);
      // absorb following inlines still in span? handled by loop
      parent.insertBefore(wrap, span);
    }
  }
  parent.removeChild(span);
}

export function applyInlineStyle(styles: Record<string, string>, clearProps?: string[]) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let range = sel.getRangeAt(0);
  const editable = findEditable(range.commonAncestorContainer);
  if (!editable) return;

  // Clear-only with collapsed caret: strip props from the nearest span
  if (range.collapsed && Object.keys(styles).length === 0 && clearProps?.length) {
    const span = spanFromSelection();
    if (span) {
      for (const p of clearProps) span.style.removeProperty(p);
      if (!span.getAttribute("style")?.trim()) unwrap(span);
    }
    return;
  }

  if (range.collapsed) {
    if (expandCollapsedToWord(range)) {
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (Object.keys(styles).length > 0) {
      // Typing style: insert an empty styled span and put the caret inside
      // so subsequent keystrokes inherit font/size (like Bold on a caret).
      const wrapper = document.createElement("span");
      writeStylesOnto(wrapper, styles, clearProps);
      const zw = document.createTextNode("\u200b");
      wrapper.appendChild(zw);
      range.insertNode(wrapper);
      const next = document.createRange();
      next.setStart(zw, 1);
      next.collapse(true);
      sel.removeAllRanges();
      sel.addRange(next);
      return;
    } else {
      return;
    }
  }

  // Re-read in case we expanded
  range = sel.getRangeAt(0);

  // Prefer updating an existing span that exactly matches the selection
  const existing = findExactSpan(range);
  if (existing) {
    writeStylesOnto(existing, styles, clearProps);
    // Drop empty style attribute spans that only had cleared props — keep if other styles remain
    if (!existing.getAttribute("style")?.trim() && existing.tagName === "SPAN") {
      unwrap(existing);
    }
    return;
  }

  // Clear-only: walk selected spans instead of wrapping with an empty span
  if (Object.keys(styles).length === 0 && clearProps?.length) {
    const walker = document.createTreeWalker(editable, NodeFilter.SHOW_ELEMENT);
    const spans: HTMLElement[] = [];
    let n: Node | null = walker.currentNode;
    while (n) {
      if (n instanceof HTMLElement && n.tagName === "SPAN" && range.intersectsNode(n)) {
        spans.push(n);
      }
      n = walker.nextNode();
    }
    for (const span of spans) {
      for (const p of clearProps) span.style.removeProperty(p);
      if (!span.getAttribute("style")?.trim()) unwrap(span);
    }
    return;
  }

  // Selections that include block elements (e.g. centered divs) must not be
  // wrapped in a <span> — that produces illegal nesting and breaks live render.
  if (rangeTouchesBlock(range, editable)) {
    applyStylesToTextInRange(range, editable, styles, clearProps);
    return;
  }

  let wrapper: HTMLSpanElement;
  try {
    wrapper = document.createElement("span");
    writeStylesOnto(wrapper, styles, clearProps);
    range.surroundContents(wrapper);
  } catch {
    const frag = range.extractContents();
    wrapper = document.createElement("span");
    writeStylesOnto(wrapper, styles, clearProps);
    wrapper.appendChild(frag);
    range.insertNode(wrapper);
  }

  hoistBlocksOutOfSpan(wrapper);
  if (!wrapper.isConnected) {
    // Hoist removed the wrapper; leave caret where the browser put it
    return;
  }

  sel.removeAllRanges();
  const next = document.createRange();
  next.selectNodeContents(wrapper);
  sel.addRange(next);
}

function findEditable(node: Node): HTMLElement | null {
  let n: Node | null = node;
  while (n) {
    if (n instanceof HTMLElement && n.isContentEditable) return n;
    n = n.parentNode;
  }
  return null;
}

function findExactSpan(range: Range): HTMLSpanElement | null {
  const { startContainer, endContainer } = range;
  const startEl =
    startContainer.nodeType === Node.TEXT_NODE
      ? startContainer.parentElement
      : (startContainer as Element);
  if (!startEl || startEl.tagName !== "SPAN") return null;

  // Selection covers entire span contents
  try {
    const full = document.createRange();
    full.selectNodeContents(startEl);
    if (
      range.compareBoundaryPoints(Range.START_TO_START, full) === 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, full) === 0
    ) {
      return startEl as HTMLSpanElement;
    }
  } catch {
    /* ignore */
  }

  // Single text node fully selected inside span
  if (
    startContainer === endContainer &&
    startContainer.nodeType === Node.TEXT_NODE &&
    range.startOffset === 0 &&
    range.endOffset === (startContainer.textContent?.length ?? 0) &&
    startEl.childNodes.length === 1
  ) {
    return startEl as HTMLSpanElement;
  }

  return null;
}

function unwrap(el: HTMLElement) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function exec(cmd: string, value?: string) {
  try {
    document.execCommand(cmd, false, value);
  } catch {
    /* ignore */
  }
}

export function RichTextToolbar({
  anchor,
  onRequestClose,
}: {
  /** Focused contentEditable element */
  anchor: HTMLElement | null;
  onRequestClose?: () => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelId>(null);
  const savedRange = useRef<Range | null>(null);
  /** While true, refuse to replace a non-collapsed saved range with a collapsed one
   *  (opening Font/Size <select> collapses the editable selection). */
  const holdRangeRef = useRef(false);

  // Dual pickers — admins can override either theme
  const [textLight, setTextLight] = useState("#c41230");
  const [textDark, setTextDark] = useState("#ff7a8a");
  const [hlLight, setHlLight] = useState("#fff59d");
  const [hlDark, setHlDark] = useState("#5c4d00");

  // Controlled font / size — show current applied choice
  const [fontValue, setFontValue] = useState("");
  const [sizeValue, setSizeValue] = useState("");
  const [inUl, setInUl] = useState(false);
  const [inOl, setInOl] = useState(false);
  const [textAlign, setTextAlign] = useState<TextAlign>("left");

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const next = sel.getRangeAt(0).cloneRange();
    // Prefer keeping a non-collapsed range when the live selection has already
    // collapsed (opening <select>/toolbar controls). mousedown on a select often
    // collapses the contenteditable selection while focus still appears to be in
    // the editable — so do not require activeElement to have left the anchor.
    if (next.collapsed && savedRange.current && !savedRange.current.collapsed) {
      const ae = document.activeElement as HTMLElement | null;
      const inToolbar = Boolean(ae?.closest?.(".ve-rich-toolbar"));
      const focusStillInEditable =
        Boolean(anchor) && (ae === anchor || Boolean(anchor && anchor.contains(ae)));
      // After pointerdown on the toolbar (Font/Size select), keep the range even
      // if focus still looks like it is in the editable for a moment.
      if (holdRangeRef.current || inToolbar || !focusStillInEditable) return;
      if (anchor && !anchor.contains(next.commonAncestorContainer)) return;
    }
    if (anchor && !anchor.contains(next.commonAncestorContainer)) return;
    if (!next.collapsed) holdRangeRef.current = false;
    savedRange.current = next;
  }, [anchor]);

  const restoreSelection = useCallback(() => {
    const range = savedRange.current;
    if (!range || !anchor) return;
    try {
      anchor.focus();
      const sel = window.getSelection();
      if (!sel) return;
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {
      /* range may be detached after DOM edits */
    }
  }, [anchor]);

  const syncFromSelection = useCallback(() => {
    const list = listFromSelection();
    setInUl(list === "ul");
    setInOl(list === "ol");
    setTextAlign(alignFromSelection(anchor));

    // Walk ancestors so nested spans (e.g. empty italic inside a sized span)
    // still surface the effective font/size in the dropdowns.
    const sel = window.getSelection();
    let el: HTMLElement | null = null;
    if (sel && sel.rangeCount > 0) {
      const node = sel.getRangeAt(0).startContainer;
      el =
        node.nodeType === Node.TEXT_NODE
          ? (node.parentElement as HTMLElement | null)
          : (node as HTMLElement);
    }

    let font = "";
    let size = "";
    let colorSpan: HTMLElement | null = null;
    while (el && el !== anchor) {
      if (el.isContentEditable) break;
      const ff = el.style.fontFamily || el.style.getPropertyValue("font-family");
      if (!font && ff) {
        const matched = matchFontValue(ff);
        if (matched) font = matched;
      }
      const fs = el.style.fontSize || el.style.getPropertyValue("font-size");
      if (!size && fs) {
        const matched = matchSizeValue(fs);
        if (matched) size = matched;
      }
      if (
        !colorSpan &&
        el.tagName === "SPAN" &&
        (el.style.getPropertyValue("--rt-color") || el.style.getPropertyValue("--rt-bg"))
      ) {
        colorSpan = el;
      }
      el = el.parentElement;
    }

    setFontValue(font);
    setSizeValue(size);

    const span = colorSpan || spanFromSelection();
    if (span) {
      const rtColor = span.style.getPropertyValue("--rt-color").trim();
      const rtColorDark = span.style.getPropertyValue("--rt-color-dark").trim();
      if (rtColor) {
        setTextLight(normalizeToHex(rtColor) ?? rtColor);
        if (rtColorDark) setTextDark(normalizeToHex(rtColorDark) ?? rtColorDark);
      }

      const rtBg = span.style.getPropertyValue("--rt-bg").trim();
      const rtBgDark = span.style.getPropertyValue("--rt-bg-dark").trim();
      if (rtBg) {
        setHlLight(normalizeToHex(rtBg) ?? rtBg);
        if (rtBgDark) setHlDark(normalizeToHex(rtBgDark) ?? rtBgDark);
      }
    }
  }, [anchor]);

  const run = useCallback(
    (fn: () => void) => {
      restoreSelection();
      fn();
      holdRangeRef.current = false;
      saveSelection();
      syncFromSelection();
      anchor?.dispatchEvent(new Event("input", { bubbles: true }));
    },
    [anchor, restoreSelection, saveSelection, syncFromSelection],
  );

  const applyTextPair = useCallback(
    (light: string, dark: string) => {
      setTextLight(light);
      setTextDark(dark);
      run(() => applyInlineStyle(textColorStyle(light, dark)));
    },
    [run],
  );

  const applyHighlightPair = useCallback(
    (light: string, dark: string) => {
      setHlLight(light);
      setHlDark(dark);
      run(() => applyInlineStyle(highlightStyle(light, dark)));
    },
    [run],
  );

  const togglePanel = useCallback((id: Exclude<PanelId, null>) => {
    setOpenPanel((cur) => (cur === id ? null : id));
  }, []);

  // Position once when anchor mounts / changes; on scroll & resize only — not every keystroke
  useLayoutEffect(() => {
    if (!anchor) {
      setPos(null);
      return;
    }
    const update = () => {
      const r = anchor.getBoundingClientRect();
      const bar = barRef.current;
      const barH = bar?.offsetHeight ?? 48;
      const barW = bar?.offsetWidth ?? 520;
      const gap = 6;
      const margin = 8;

      // Prefer above the editable so the caret stays visible
      let top = r.top - barH - gap;
      if (top < margin) {
        top = Math.min(r.bottom + gap, window.innerHeight - barH - margin);
      }

      // Align to left of field, clamp into viewport
      let left = Math.max(margin, Math.min(r.left, window.innerWidth - barW - margin));
      setPos({ top, left });
    };
    update();
    // Re-measure after paint (compact bar height) and again if a panel opens
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchor, openPanel]);

  useEffect(() => {
    if (!anchor) return;
    const onSel = () => {
      if (anchor.contains(document.activeElement) || document.activeElement === anchor) {
        saveSelection();
        syncFromSelection();
      }
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [anchor, saveSelection, syncFromSelection]);

  // Close color/highlight popovers on outside click
  useEffect(() => {
    if (!openPanel) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (t && barRef.current?.contains(t)) return;
      setOpenPanel(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openPanel]);

  // Escape: close open panel first, then the whole bar
  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (openPanel) {
        e.preventDefault();
        e.stopPropagation();
        setOpenPanel(null);
        return;
      }
      if (onRequestClose) {
        e.preventDefault();
        onRequestClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [anchor, openPanel, onRequestClose]);

  // Reset open panel when switching fields
  useEffect(() => {
    setOpenPanel(null);
  }, [anchor]);

  if (!anchor || !pos) return null;

  return createPortal(
    <div
      ref={barRef}
      className={`ve-rich-toolbar${openPanel ? " has-panel" : ""}`}
      style={{ top: pos.top, left: pos.left }}
      role="toolbar"
      aria-label="Text formatting"
      onPointerDownCapture={() => {
        // Snapshot the contenteditable selection before <select> / inputs steal
        // focus and collapse it, then hold that range until a new non-collapsed
        // selection is made (or apply runs).
        holdRangeRef.current = true;
        saveSelection();
      }}
      onMouseDown={(e) => {
        const t = e.target as HTMLElement;
        // Let native select / color input / option interact.
        if (t.closest("select, option, input, textarea, label")) {
          return; // do NOT preventDefault
        }
        e.preventDefault();
        saveSelection();
      }}
    >
      <div className="ve-rich-row">
        <label className="ve-rich-field">
          <span className="ve-rich-section-label">Font</span>
          <select
            value={fontValue}
            aria-label="Font"
            onChange={(e) => {
              const v = e.target.value;
              setFontValue(v);
              if (!v) return;
              run(() => applyInlineStyle({ "font-family": v }));
            }}
          >
            <option value="" disabled>
              Choose font…
            </option>
            {FONT_OPTIONS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ve-rich-field">
          <span className="ve-rich-section-label">Size</span>
          <select
            value={sizeValue}
            aria-label="Size"
            onChange={(e) => {
              const v = e.target.value;
              setSizeValue(v);
              if (!v) return;
              run(() => applyInlineStyle({ "font-size": `${v}px` }));
            }}
          >
            <option value="" disabled>
              Choose size…
            </option>
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>
        </label>

        <div className="ve-rich-section ve-rich-style-section">
          <span className="ve-rich-section-label">Style</span>
          <div className="ve-rich-btns">
            <button
              type="button"
              className="ve-rich-btn"
              title="Bold"
              aria-label="Bold"
              onClick={() =>
                run(() => {
                  exec("styleWithCSS", "true");
                  exec("bold");
                })
              }
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="ve-rich-btn"
              title="Italic"
              aria-label="Italic"
              onClick={() =>
                run(() => {
                  exec("styleWithCSS", "true");
                  exec("italic");
                })
              }
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className="ve-rich-btn"
              title="Underline"
              aria-label="Underline"
              onClick={() => run(() => exec("underline"))}
            >
              <span style={{ textDecoration: "underline" }}>U</span>
            </button>
            <button
              type="button"
              className={`ve-rich-btn ve-rich-btn-text${inUl ? " is-selected" : ""}`}
              title="Bullets — turn lines into a bullet list"
              aria-label="Bullets"
              aria-pressed={inUl}
              onClick={() =>
                run(() => {
                  exec("insertUnorderedList");
                })
              }
            >
              Bullets
            </button>
            <button
              type="button"
              className={`ve-rich-btn ve-rich-btn-text${inOl ? " is-selected" : ""}`}
              title="Numbers — turn lines into a numbered list"
              aria-label="Numbers"
              aria-pressed={inOl}
              onClick={() =>
                run(() => {
                  exec("insertOrderedList");
                })
              }
            >
              Numbers
            </button>
            <span className="ve-rich-sep" aria-hidden />
            <button
              type="button"
              className={`ve-rich-btn ve-rich-btn-text${textAlign === "left" ? " is-selected" : ""}`}
              title="Align left"
              aria-label="Left"
              aria-pressed={textAlign === "left"}
              onClick={() =>
                run(() => {
                  exec("styleWithCSS", "true");
                  exec("justifyLeft");
                })
              }
            >
              Left
            </button>
            <button
              type="button"
              className={`ve-rich-btn ve-rich-btn-text${textAlign === "center" ? " is-selected" : ""}`}
              title="Align center"
              aria-label="Center"
              aria-pressed={textAlign === "center"}
              onClick={() =>
                run(() => {
                  exec("styleWithCSS", "true");
                  exec("justifyCenter");
                })
              }
            >
              Center
            </button>
            <button
              type="button"
              className={`ve-rich-btn ve-rich-btn-text${textAlign === "justify" ? " is-selected" : ""}`}
              title="Justify — stretch lines to both edges"
              aria-label="Justify"
              aria-pressed={textAlign === "justify"}
              onClick={() =>
                run(() => {
                  exec("styleWithCSS", "true");
                  exec("justifyFull");
                })
              }
            >
              Justify
            </button>
            <button
              type="button"
              className={`ve-rich-btn ve-rich-btn-text${openPanel === "color" ? " is-selected" : ""}`}
              title="Text color"
              aria-label="Text color"
              aria-expanded={openPanel === "color"}
              aria-controls="ve-rich-panel-color"
              onClick={() => togglePanel("color")}
            >
              <span className="ve-rich-color-indicator" style={{ color: textLight }} aria-hidden>
                A
              </span>
              Color
            </button>
            <button
              type="button"
              className={`ve-rich-btn ve-rich-btn-text${openPanel === "highlight" ? " is-selected" : ""}`}
              title="Highlight"
              aria-label="Highlight"
              aria-expanded={openPanel === "highlight"}
              aria-controls="ve-rich-panel-highlight"
              onClick={() => togglePanel("highlight")}
            >
              <span
                className="ve-rich-hl-indicator"
                style={{ backgroundColor: hlLight }}
                aria-hidden
              />
              Highlight
            </button>
          </div>
        </div>

        {onRequestClose ? (
          <button
            type="button"
            className="ve-rich-btn ve-rich-close"
            title="Close"
            aria-label="Close formatting bar"
            onClick={onRequestClose}
          >
            ✕
          </button>
        ) : null}
      </div>

      {openPanel === "color" ? (
        <div
          id="ve-rich-panel-color"
          className="ve-rich-panel ve-rich-color-section"
          role="group"
          aria-label="Text color"
        >
          <p className="ve-rich-note">
            Both are saved so text stays readable when visitors switch theme.
          </p>
          <div className="ve-rich-presets" role="group" aria-label="Text color presets">
            {TEXT_COLOR_PAIRS.map((p) => {
              const selected = hexEq(textLight, p.light) && hexEq(textDark, p.dark);
              return (
                <button
                  key={p.label}
                  type="button"
                  className={`ve-rich-pair-swatch${selected ? " is-selected" : ""}`}
                  title={`${p.label}: light ${p.light} / dark ${p.dark}`}
                  aria-label={`Text color ${p.label}`}
                  aria-pressed={selected}
                  onClick={() => applyTextPair(p.light, p.dark)}
                >
                  <span className="ve-rich-pair-chip ve-rich-chip-light" style={{ color: p.light }}>
                    Aa
                  </span>
                  <span className="ve-rich-pair-chip ve-rich-chip-dark" style={{ color: p.dark }}>
                    Aa
                  </span>
                </button>
              );
            })}
          </div>
          <div className="ve-rich-dual-pickers">
            <label className="ve-rich-picker-row">
              <span className="ve-rich-picker-label">On light pages</span>
              <span
                className="ve-rich-preview ve-rich-chip-light"
                style={{ color: textLight }}
                aria-hidden
              >
                Aa
              </span>
              <input
                type="color"
                className="ve-rich-color"
                title="Text color on light pages"
                aria-label="Text color on light pages"
                value={textLight}
                onChange={(e) => {
                  const c = e.target.value;
                  const pair = companionTextColors(c);
                  applyTextPair(pair.light, pair.dark);
                }}
              />
            </label>
            <label className="ve-rich-picker-row">
              <span className="ve-rich-picker-label">On dark pages</span>
              <span
                className="ve-rich-preview ve-rich-chip-dark"
                style={{ color: textDark }}
                aria-hidden
              >
                Aa
              </span>
              <input
                type="color"
                className="ve-rich-color"
                title="Text color on dark pages"
                aria-label="Text color on dark pages"
                value={textDark}
                onChange={(e) => {
                  const c = e.target.value;
                  // Override dark only; keep current light (or synthesize light if needed)
                  const light = textLight || companionTextColors(c).light;
                  applyTextPair(light, c);
                }}
              />
            </label>
          </div>
        </div>
      ) : null}

      {openPanel === "highlight" ? (
        <div
          id="ve-rich-panel-highlight"
          className="ve-rich-panel ve-rich-highlight-section"
          role="group"
          aria-label="Highlight"
        >
          <div className="ve-rich-presets" role="group" aria-label="Highlight presets">
            {HIGHLIGHT_COLOR_PAIRS.map((p) => {
              const selected = hexEq(hlLight, p.light) && hexEq(hlDark, p.dark);
              return (
                <button
                  key={p.label}
                  type="button"
                  className={`ve-rich-pair-swatch${selected ? " is-selected" : ""}`}
                  title={`${p.label} highlight`}
                  aria-label={`Highlight ${p.label}`}
                  aria-pressed={selected}
                  onClick={() => applyHighlightPair(p.light, p.dark)}
                >
                  <span
                    className="ve-rich-pair-chip ve-rich-chip-light"
                    style={{ backgroundColor: p.light, color: "#14181f" }}
                  >
                    Hi
                  </span>
                  <span
                    className="ve-rich-pair-chip ve-rich-chip-dark"
                    style={{ backgroundColor: p.dark, color: "#f3f5f7" }}
                  >
                    Hi
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className="ve-rich-clear-hl"
              title="Clear highlight"
              aria-label="Clear highlight"
              onClick={() => run(() => applyInlineStyle({}, CLEAR_HIGHLIGHT_PROPS))}
            >
              Clear highlight
            </button>
          </div>
          <div className="ve-rich-dual-pickers">
            <label className="ve-rich-picker-row">
              <span className="ve-rich-picker-label">On light pages</span>
              <span
                className="ve-rich-preview ve-rich-chip-light"
                style={{ backgroundColor: hlLight, color: "#14181f" }}
                aria-hidden
              >
                Hi
              </span>
              <input
                type="color"
                className="ve-rich-color"
                title="Highlight on light pages"
                aria-label="Highlight on light pages"
                value={hlLight}
                onChange={(e) => {
                  const c = e.target.value;
                  const pair = companionHighlightColors(c);
                  applyHighlightPair(pair.light, pair.dark);
                }}
              />
            </label>
            <label className="ve-rich-picker-row">
              <span className="ve-rich-picker-label">On dark pages</span>
              <span
                className="ve-rich-preview ve-rich-chip-dark"
                style={{ backgroundColor: hlDark, color: "#f3f5f7" }}
                aria-hidden
              >
                Hi
              </span>
              <input
                type="color"
                className="ve-rich-color"
                title="Highlight on dark pages"
                aria-label="Highlight on dark pages"
                value={hlDark}
                onChange={(e) => {
                  const c = e.target.value;
                  const light = hlLight || companionHighlightColors(c).light;
                  applyHighlightPair(light, c);
                }}
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
