/**
 * Safe HTML subset for admin rich-text fields.
 * No external deps — works in browser and Node (SSR).
 */

import {
  companionHighlightColors,
  companionTextColors,
  isSafeSolidColor,
  normalizeToHex,
} from "@/lib/rich-text-colors";

const ALLOWED_TAGS = new Set([
  "span",
  "br",
  "p",
  "div",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "mark",
  "ul",
  "ol",
  "li",
]);

/** Inline formatting (font/color) — full style allowlist. */
const STYLE_TAGS = new Set(["span", "mark"]);

/** Block wrappers that may carry text-align only. */
const BLOCK_ALIGN_TAGS = new Set(["p", "div", "li", "ul", "ol"]);

const ALLOWED_ALIGN = new Set(["left", "center", "right", "justify", "start", "end"]);

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "font-size",
  "font-family",
  "font-weight",
  "font-style",
  "text-align",
  "--rt-color",
  "--rt-color-dark",
  "--rt-bg",
  "--rt-bg-dark",
]);

const RT_COLOR_VARS = new Set(["--rt-color", "--rt-color-dark", "--rt-bg", "--rt-bg-dark"]);

const VAR_RT_RE = /^var\(\s*(--rt-(?:color|color-dark|bg|bg-dark))\s*\)$/i;

/** True when value looks like our allowed rich HTML (not plain text). */
export function isRichHtml(value: string | null | undefined): boolean {
  if (!value || !value.includes("<")) return false;
  return /<\/?(?:span|br|p|div|strong|b|em|i|u|mark|ul|ol|li)\b/i.test(value);
}

/** Escape plain text for safe insertion into HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeStyleValue(prop: string, value: string): string | null {
  const v = value.trim().replace(/["']/g, "");
  if (!v || /expression|javascript:|url\s*\(|@import|behavior/i.test(v)) return null;

  if (RT_COLOR_VARS.has(prop)) {
    if (isSafeSolidColor(v)) {
      return normalizeToHex(v) ?? v;
    }
    return null;
  }

  if (prop === "color" || prop === "background-color") {
    if (VAR_RT_RE.test(v)) {
      return v.replace(/\s+/g, "");
    }
    if (
      /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.%\s,]+\s*\)|hsla?\(\s*[\d.%\s,/deg]+\s*\)|[a-z]+)$/i.test(
        v,
      )
    ) {
      return v;
    }
    return null;
  }

  if (prop === "font-size") {
    if (/^\d+(\.\d+)?(px|em|rem|%)$/i.test(v)) return v;
    return null;
  }

  if (prop === "font-family") {
    // Allow CSS vars, quoted names, and common safe font tokens
    if (/^[\w\s,"'\-.,()]+$/i.test(v) && v.length < 200) return v;
    return null;
  }

  if (prop === "font-weight") {
    if (/^(normal|bold|bolder|lighter|[1-9]00)$/i.test(v)) return v;
    return null;
  }

  if (prop === "font-style") {
    if (/^(normal|italic|oblique)$/i.test(v)) return v;
    return null;
  }

  if (prop === "text-align") {
    const a = v.toLowerCase();
    if (ALLOWED_ALIGN.has(a)) return a;
    return null;
  }

  return null;
}

/**
 * Parse, sanitize, and migrate legacy single-theme color/bg to dual --rt-* vars.
 */
function sanitizeStyleAttr(raw: string): string {
  const map = new Map<string, string>();
  for (const decl of raw.split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
    const safe = sanitizeStyleValue(prop, val);
    if (safe) map.set(prop, safe);
  }

  migrateDualThemeVars(map);

  const order = [
    "--rt-color",
    "--rt-color-dark",
    "color",
    "--rt-bg",
    "--rt-bg-dark",
    "background-color",
    "font-size",
    "font-family",
    "font-weight",
    "font-style",
    "text-align",
  ];
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const prop of order) {
    if (map.has(prop)) {
      parts.push(`${prop}: ${map.get(prop)}`);
      seen.add(prop);
    }
  }
  for (const [prop, val] of map) {
    if (!seen.has(prop)) parts.push(`${prop}: ${val}`);
  }
  return parts.join("; ");
}

/** If span has only a solid color/bg, synthesize --rt-* companions. */
function migrateDualThemeVars(map: Map<string, string>) {
  const color = map.get("color");
  const hasRtColor = map.has("--rt-color");
  const hasRtColorDark = map.has("--rt-color-dark");

  if (!hasRtColor && color && isSafeSolidColor(color)) {
    const pair = companionTextColors(color);
    map.set("--rt-color", pair.light);
    map.set("--rt-color-dark", pair.dark);
    map.set("color", "var(--rt-color)");
  } else if (hasRtColor) {
    if (!hasRtColorDark) {
      const base = map.get("--rt-color")!;
      map.set("--rt-color-dark", companionTextColors(base).dark);
    }
    // Prefer var() so dark theme CSS can override via --rt-color-dark
    if (!color || isSafeSolidColor(color) || color === "var(--rt-color)") {
      map.set("color", "var(--rt-color)");
    }
  } else if (hasRtColorDark && !hasRtColor) {
    // Unusual: only dark var — synthesize light companion from it
    const pair = companionTextColors(map.get("--rt-color-dark")!);
    map.set("--rt-color", pair.light);
    map.set("color", "var(--rt-color)");
  }

  const bg = map.get("background-color");
  const hasRtBg = map.has("--rt-bg");
  const hasRtBgDark = map.has("--rt-bg-dark");

  if (!hasRtBg && bg && isSafeSolidColor(bg)) {
    const pair = companionHighlightColors(bg);
    map.set("--rt-bg", pair.light);
    map.set("--rt-bg-dark", pair.dark);
    map.set("background-color", "var(--rt-bg)");
  } else if (hasRtBg) {
    if (!hasRtBgDark) {
      const base = map.get("--rt-bg")!;
      map.set("--rt-bg-dark", companionHighlightColors(base).dark);
    }
    if (!bg || isSafeSolidColor(bg) || bg === "var(--rt-bg)") {
      map.set("background-color", "var(--rt-bg)");
    }
  } else if (hasRtBgDark && !hasRtBg) {
    const pair = companionHighlightColors(map.get("--rt-bg-dark")!);
    map.set("--rt-bg", pair.light);
    map.set("background-color", "var(--rt-bg)");
  }
}

type Token =
  | { type: "text"; value: string }
  | { type: "tag"; raw: string; name: string; closing: boolean; selfClosing: boolean; attrs: string };

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) {
      tokens.push({ type: "text", value: html.slice(last, m.index) });
    }
    if (m[0].startsWith("<!--")) {
      last = re.lastIndex;
      continue;
    }
    const raw = m[0];
    const name = (m[1] || "").toLowerCase();
    const attrs = m[2] || "";
    const closing = raw.startsWith("</");
    const selfClosing = /\/\s*>$/.test(raw) || name === "br";
    tokens.push({ type: "tag", raw, name, closing, selfClosing, attrs });
    last = re.lastIndex;
  }
  if (last < html.length) {
    tokens.push({ type: "text", value: html.slice(last) });
  }
  return tokens;
}

function parseAttrs(attrStr: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr)) !== null) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return out;
}

/**
 * Sanitize to allowed tags/attrs/styles. Safe for dangerouslySetInnerHTML.
 * Also migrates legacy color/bg-only spans to dual-theme --rt-* vars.
 */

const BLOCK_TAGS = new Set(["p", "div", "ul", "ol", "li"]);

type AstNode =
  | { kind: "text"; value: string }
  | { kind: "br" }
  | { kind: "el"; name: string; attrs: string; children: AstNode[] };

/** Parse sanitized HTML into a shallow AST (trusted tags only). */
function parseAst(html: string): AstNode[] {
  const tokens = tokenize(html);
  const root: AstNode[] = [];
  const stack: { name: string; attrs: string; children: AstNode[] }[] = [];

  const dest = () => (stack.length ? stack[stack.length - 1]!.children : root);

  for (const tok of tokens) {
    if (tok.type === "text") {
      if (tok.value) dest().push({ kind: "text", value: tok.value });
      continue;
    }
    const name = tok.name.toLowerCase();
    if (tok.closing) {
      while (stack.length) {
        const top = stack.pop()!;
        const node: AstNode = { kind: "el", name: top.name, attrs: top.attrs, children: top.children };
        dest().push(node);
        if (top.name === name) break;
      }
      continue;
    }
    if (name === "br" || tok.selfClosing) {
      dest().push({ kind: "br" });
      continue;
    }
    // Opening tag — attrs already sanitized in the HTML string (style="…")
    const attrs = (tok.attrs || "").trim();
    stack.push({ name, attrs: attrs ? ` ${attrs}` : "", children: [] });
  }
  while (stack.length) {
    const top = stack.pop()!;
    dest().push({ kind: "el", name: top.name, attrs: top.attrs, children: top.children });
  }
  return root;
}

function serializeAst(nodes: AstNode[]): string {
  let out = "";
  for (const n of nodes) {
    if (n.kind === "text") {
      out += n.value;
    } else if (n.kind === "br") {
      out += "<br>";
    } else {
      out += `<${n.name}${n.attrs}>${serializeAst(n.children)}</${n.name}>`;
    }
  }
  return out;
}

function isEmptyAst(nodes: AstNode[]): boolean {
  for (const n of nodes) {
    if (n.kind === "br") return false;
    if (n.kind === "text" && n.value.replace(/\u200b/g, "").trim()) return false;
    if (n.kind === "el" && !isEmptyAst(n.children)) return false;
  }
  return true;
}

function hasBlockChild(nodes: AstNode[]): boolean {
  return nodes.some((n) => n.kind === "el" && BLOCK_TAGS.has(n.name));
}

/**
 * Hoist block elements out of span/mark wrappers and drop empty spans.
 * Turns <span style="…"><div>text</div></span> into
 * <div><span style="…">text</span></div> so live HTML stays valid.
 */
function normalizeAst(nodes: AstNode[]): AstNode[] {
  const out: AstNode[] = [];
  for (const node of nodes) {
    if (node.kind !== "el") {
      out.push(node);
      continue;
    }
    let children = normalizeAst(node.children);

    if ((node.name === "span" || node.name === "mark") && hasBlockChild(children)) {
      // Split: styled inlines stay in span; blocks come out with styles pushed inward
      for (const child of children) {
        if (child.kind === "el" && BLOCK_TAGS.has(child.name)) {
          const wrapped = normalizeAst([
            {
              kind: "el",
              name: node.name,
              attrs: node.attrs,
              children: child.children,
            },
          ]);
          out.push({
            kind: "el",
            name: child.name,
            attrs: child.attrs,
            children: wrapped,
          });
        } else if (child.kind === "text" && !child.value.replace(/\u200b/g, "").trim()) {
          // drop whitespace-only between blocks
          continue;
        } else {
          out.push({
            kind: "el",
            name: node.name,
            attrs: node.attrs,
            children: normalizeAst([child]),
          });
        }
      }
      continue;
    }

    if ((node.name === "span" || node.name === "mark") && isEmptyAst(children)) {
      // Strip empty italic/size wrappers
      continue;
    }

    // Drop spans that have no style/attrs and only wrap content
    if (
      (node.name === "span" || node.name === "mark") &&
      !node.attrs.trim() &&
      children.length
    ) {
      out.push(...children);
      continue;
    }

    // Drop empty block wrappers left after stripping empty spans
    if (BLOCK_TAGS.has(node.name) && isEmptyAst(children)) {
      continue;
    }

    out.push({ ...node, children });
  }
  return out;
}

/** Structural cleanup after tag/style allowlisting. */
function normalizeRichHtml(html: string): string {
  if (!html.includes("<")) return html;
  try {
    return serializeAst(normalizeAst(parseAst(html)));
  } catch {
    return html;
  }
}


export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  const html = String(dirty);

  // Fast path: plain text
  if (!html.includes("<")) return escapeHtml(html);

  const tokens = tokenize(html);
  const openStack: string[] = [];
  let out = "";
  /** When set, skip text/nested tokens until this closing tag (script/style/iframe…). */
  let skipUntil: string | null = null;

  for (const tok of tokens) {
    if (skipUntil) {
      if (tok.type === "tag" && tok.closing && tok.name.toLowerCase() === skipUntil) {
        skipUntil = null;
      }
      continue;
    }

    if (tok.type === "text") {
      // Drop ZWSP used as typing-style caret anchors in the editor
      out += tok.value.replace(/\u200b/g, "").replace(/</g, "&lt;");
      continue;
    }

    const name = tok.name.toLowerCase();

    // Drop disallowed tags entirely; skip inner content for opaque dangerous tags
    if (!ALLOWED_TAGS.has(name)) {
      if (
        !tok.closing &&
        !tok.selfClosing &&
        /^(script|style|iframe|object|embed|svg|math|noscript|textarea|title)$/i.test(name)
      ) {
        skipUntil = name;
      }
      continue;
    }

    if (tok.closing) {
      // Close only if we opened it
      const idx = openStack.lastIndexOf(name);
      if (idx >= 0) {
        // Close nested opens first
        while (openStack.length > idx) {
          const n = openStack.pop()!;
          out += `</${n}>`;
        }
      }
      continue;
    }

    if (name === "br" || tok.selfClosing) {
      out += "<br>";
      continue;
    }

    let attrOut = "";
    const attrs = parseAttrs(tok.attrs);
    if (STYLE_TAGS.has(name)) {
      if (attrs.style) {
        const style = sanitizeStyleAttr(attrs.style);
        if (style) attrOut = ` style="${escapeHtml(style)}"`;
      }
    } else if (BLOCK_ALIGN_TAGS.has(name)) {
      // Prefer style text-align; migrate legacy align="…" from execCommand / paste
      const map = new Map<string, string>();
      if (attrs.style) {
        for (const decl of attrs.style.split(";")) {
          const idx = decl.indexOf(":");
          if (idx < 0) continue;
          const prop = decl.slice(0, idx).trim().toLowerCase();
          const val = decl.slice(idx + 1).trim();
          if (prop !== "text-align") continue;
          const safe = sanitizeStyleValue(prop, val);
          if (safe) map.set("text-align", safe);
        }
      }
      if (!map.has("text-align") && attrs.align) {
        const safe = sanitizeStyleValue("text-align", attrs.align);
        if (safe) map.set("text-align", safe);
      }
      if (map.has("text-align")) {
        attrOut = ` style="text-align: ${escapeHtml(map.get("text-align")!)}"`;
      }
    }
    // Strip all other attributes (onclick, href, class, id, …)

    out += `<${name}${attrOut}>`;
    openStack.push(name);
  }

  while (openStack.length) {
    out += `</${openStack.pop()}>`;
  }

  return normalizeRichHtml(out);
}

/** True if HTML has no meaningful formatting beyond line breaks / empty wrappers. */
export function isEffectivelyPlainHtml(html: string): boolean {
  const clean = sanitizeHtml(html);
  // Alignment (or any kept style) is meaningful — must not collapse to plain text
  if (/\sstyle\s*=/i.test(clean)) return false;
  const stripped = clean
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(?:p|div)\b[^>]*>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return !/<[a-z]/i.test(stripped);
}

/**
 * Plain text from sanitized HTML, preserving line breaks from <br> and blocks.
 * Unlike htmlToPlainText, does not collapse newlines to spaces.
 */
export function htmlToMultilinePlain(sanitizedHtml: string): string {
  if (!sanitizedHtml) return "";
  return sanitizedHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li)>/gi, "\n")
    .replace(/<(?:p|div|li)\b[^>]*>/gi, "")
    .replace(/<\/?(?:ul|ol)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\u200b/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n+$/g, "")
    .replace(/^\n+/g, "");
}

/** Convert editor HTML to stored value: plain text when no formatting, else sanitized HTML. */
export function serializeRichHtml(html: string, plainFallback: string): string {
  const clean = sanitizeHtml(html);
  if (!clean || isEffectivelyPlainHtml(clean)) {
    const fromHtml = htmlToMultilinePlain(clean);
    const plain = (fromHtml || plainFallback)
      .replace(/\u200b/g, "")
      .replace(/\u00a0/g, " ")
      .replace(/\n$/, "");
    return plain;
  }
  // Literal newlines in rich HTML are collapsed by CSS white-space:normal — store as <br>
  return clean.replace(/\r\n|\r|\n/g, "<br>");
}

/**
 * Live/display HTML: sanitize (if rich) or escape (if plain), then turn newlines into <br>
 * so Enter breaks survive regardless of white-space CSS.
 */
export function toDisplayHtml(value: string): string {
  if (!value) return "";
  const html = isRichHtml(value) ? sanitizeHtml(value) : escapeHtml(value);
  return html.replace(/\r\n|\r|\n/g, "<br>");
}


/** Strip tags for attributes (img alt) while keeping readable text. */
export function htmlToPlainText(value: string | null | undefined): string {
  if (!value) return "";
  if (!isRichHtml(value)) return value.replace(/\u200b/g, "").replace(/\u00a0/g, " ").trim();
  const clean = sanitizeHtml(value);
  return clean
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(?:p|div|li)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Prepare value for contentEditable innerHTML. */
export function toEditorHtml(value: string): string {
  if (!value) return "";
  if (isRichHtml(value)) return sanitizeHtml(value);
  return escapeHtml(value).replace(/\n/g, "<br>");
}
