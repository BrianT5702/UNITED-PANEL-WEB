/** Sitewide page-builder document model */

export function newId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export type SectionColumns = 1 | 2 | 3;

/** What a button does when clicked */
export type HeroButtonAction = "link" | "section";

export type HeroButton = {
  id: string;
  label: string;
  /** Page/URL for "link", or #id for "section" */
  href: string;
  style?: "primary" | "ghost";
  action?: HeroButtonAction | "email" | "phone" | "whatsapp" | "scroll"; // legacy values still load
};

/** Map saved / legacy actions to the two current choices */
export function normalizeButtonAction(action?: HeroButton["action"]): HeroButtonAction {
  if (action === "section" || action === "scroll") return "section";
  return "link";
}

export type HeroSectionData = {
  brand: string;
  headline: string;
  lead: string;
  tagline?: string;
  backgroundImage: string;
  /** full = viewport hero; short = compact banner (default) */
  size?: "full" | "short";
  buttons?: HeroButton[];
  /** Older saved pages — migrated via resolveHeroButtons */
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export function resolveHeroButtons(d: HeroSectionData): HeroButton[] {
  if (d.buttons && d.buttons.length > 0) return d.buttons;
  const out: HeroButton[] = [];
  if (d.primaryCtaLabel) {
    out.push({
      id: "primary",
      label: d.primaryCtaLabel,
      href: d.primaryCtaHref || "#",
      style: "primary",
      action: "link",
    });
  }
  if (d.secondaryCtaLabel) {
    out.push({
      id: "secondary",
      label: d.secondaryCtaLabel,
      href: d.secondaryCtaHref || "#",
      style: "ghost",
      action: "link",
    });
  }
  return out;
}

export function heroButtonHref(btn: HeroButton): string {
  const raw = (btn.href || "").trim();
  const legacy = btn.action as string | undefined;

  // Keep old email / phone / WhatsApp buttons working until re-saved
  if (legacy === "email") return raw.startsWith("mailto:") ? raw : `mailto:${raw}`;
  if (legacy === "phone") return raw.startsWith("tel:") ? raw : `tel:${raw.replace(/\s+/g, "")}`;
  if (legacy === "whatsapp") {
    const num = raw.replace(/[^\d]/g, "");
    return num ? `https://wa.me/${num}` : "#";
  }

  if (normalizeButtonAction(btn.action) === "section") {
    if (!raw) return "#";
    return raw.startsWith("#") ? raw : `#${raw}`;
  }
  return raw || "#";
}

export const HERO_BUTTON_ACTION_LABELS: Record<HeroButtonAction, string> = {
  link: "Go to a page",
  section: "Jump down this page",
};

export function heroActionPlaceholder(action: HeroButtonAction): string {
  return action === "section" ? "Pick a section below" : "/contact or https://…";
}

export type ProofItem = {
  id: string;
  index: string;
  title: string;
  text: string;
};

export type ProofSectionData = {
  items: ProofItem[];
};

/** Friendly photo crop shapes for editors */
export type ImageAspectId = "wide" | "landscape" | "square" | "tall";

/**
 * Crop inside the photo frame:
 * - x/y = which part is visible (0–100%, like CSS object-position)
 * - zoom = how close the crop is (1 = normal, up to 3 = zoomed in)
 */
export type ImageFocus = { x: number; y: number; zoom?: number };

export const IMAGE_ZOOM_MIN = 1;
export const IMAGE_ZOOM_MAX = 3;
export const IMAGE_ZOOM_STEP = 0.1;

export const IMAGE_ASPECT_OPTIONS: ReadonlyArray<{
  id: ImageAspectId;
  label: string;
  hint: string;
  ratio: string;
  css: string;
}> = [
  { id: "wide", label: "Wide", hint: "Short panoramic crop", ratio: "2:1", css: "2 / 1" },
  { id: "landscape", label: "Landscape", hint: "Normal photo", ratio: "4:3", css: "4 / 3" },
  { id: "square", label: "Square", hint: "Equal sides", ratio: "1:1", css: "1 / 1" },
  { id: "tall", label: "Tall", hint: "Upright photo", ratio: "3:4", css: "3 / 4" },
];

export function isImageAspectId(value: unknown): value is ImageAspectId {
  return IMAGE_ASPECT_OPTIONS.some((o) => o.id === value);
}

/** CSS aspect-ratio value; defaults to Wide when unset */
export function resolveImageAspectCss(id?: string | null): string {
  if (id === "extraTall") return "3 / 4"; // legacy → Tall
  const found = IMAGE_ASPECT_OPTIONS.find((o) => o.id === id);
  return found?.css ?? "2 / 1";
}

export function imageAspectStyle(id?: string | null): { aspectRatio: string } | undefined {
  if (!id) return undefined;
  return { aspectRatio: resolveImageAspectCss(id) };
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

export function normalizeImageZoom(zoom?: number | null): number {
  const n = typeof zoom === "number" && Number.isFinite(zoom) ? zoom : IMAGE_ZOOM_MIN;
  const stepped = Math.round(n / IMAGE_ZOOM_STEP) * IMAGE_ZOOM_STEP;
  return Math.min(IMAGE_ZOOM_MAX, Math.max(IMAGE_ZOOM_MIN, Math.round(stepped * 10) / 10));
}

export function normalizeImageFocus(focus?: ImageFocus | null): ImageFocus {
  return {
    x: clampPercent(focus?.x ?? 50),
    y: clampPercent(focus?.y ?? 50),
    zoom: normalizeImageZoom(focus?.zoom),
  };
}

/** object-position + optional scale for editor/live crop */
export function imageFocusStyle(focus?: ImageFocus | null): {
  objectPosition: string;
  transform?: string;
  transformOrigin?: string;
} {
  const f = normalizeImageFocus(focus);
  const zoom = normalizeImageZoom(f.zoom);
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    ...(zoom > IMAGE_ZOOM_MIN
      ? {
          transform: `scale(${zoom})`,
          transformOrigin: `${f.x}% ${f.y}%`,
        }
      : {}),
  };
}

/** Default time each slideshow photo stays visible */
export const DEFAULT_SLIDESHOW_INTERVAL_SEC = 4.5;

/** Clamp editor interval (seconds) to a usable range */
export function normalizeSlideshowIntervalSec(sec?: number | null): number {
  const n = typeof sec === "number" && Number.isFinite(sec) ? sec : DEFAULT_SLIDESHOW_INTERVAL_SEC;
  return Math.min(60, Math.max(1, Math.round(n * 10) / 10));
}

export function resolveSlideshowIntervalMs(sec?: number | null): number {
  return Math.round(normalizeSlideshowIntervalSec(sec) * 1000);
}

export type RichTextSectionData = {
  eyebrow?: string;
  title: string;
  body: string;
  image?: string;
  imageAspect?: ImageAspectId;
  /** Visible crop point when the photo is larger than the frame */
  imageFocus?: ImageFocus;
  ctaLabel?: string;
  ctaHref?: string;
};

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  focus?: ImageFocus;
};

export type MediaTextSectionData = {
  eyebrow: string;
  title: string;
  body: string;
  body2?: string;
  /** Single photo (used when there is no slideshow) */
  image: string;
  /** Photo slideshow beside the text — when set with 1+ photos, replaces single image */
  images?: GalleryItem[];
  linkLabel?: string;
  linkHref?: string;
  imageSide?: "left" | "right";
  /** Crop shape for the photo frame */
  imageAspect?: ImageAspectId;
  /** Visible crop point for the single photo */
  imageFocus?: ImageFocus;
  /** Seconds each slide stays visible (slideshow mode) */
  slideshowIntervalSec?: number;
};

export type CardItem = {
  id: string;
  eyebrow?: string;
  title: string;
  text: string;
  image?: string;
  focus?: ImageFocus;
  href?: string;
};

export type CardGridSectionData = {
  eyebrow?: string;
  title?: string;
  lead?: string;
  items: CardItem[];
  /** Crop shape for card photos in this section */
  imageAspect?: ImageAspectId;
  /**
   * certs = logo tiles (contain, light mark area) for approvals / warranty cards
   * default = photo product cards
   */
  variant?: "default" | "certs";
};

export type FeatureListSectionData = {
  eyebrow?: string;
  title: string;
  lead?: string;
  items: string[];
  /** Optional photo slideshow beside the list (e.g. Applications) */
  images?: GalleryItem[];
  imageAspect?: ImageAspectId;
  imageFocus?: ImageFocus;
  slideshowIntervalSec?: number;
};

export type SpecsTableSectionData = {
  eyebrow?: string;
  title: string;
  lead?: string;
  rows: { label: string; value: string }[];
};

export type DataTableSectionData = {
  eyebrow?: string;
  title: string;
  lead?: string;
  headers: string[];
  rows: string[][];
  note?: string;
};

export type GallerySectionData = {
  eyebrow?: string;
  title?: string;
  /** grid = photo listing (default); slideshow = rotating carousel */
  layout?: "grid" | "slideshow";
  items: GalleryItem[];
  imageAspect?: ImageAspectId;
  slideshowIntervalSec?: number;
};

export type JointDetailPage = {
  id: string;
  title: string;
  lead?: string;
  src: string;
  alt: string;
};

/** Expandable joint / diagram block (PIR panel joints, etc.) */
export type JointDetailsSectionData = {
  eyebrow: string;
  title: string;
  summary: string;
  body: string;
  image: string;
  imageAlt: string;
  toggleLabel?: string;
  hideLabel?: string;
  pages?: JointDetailPage[];
};

export type ContactField = {
  id: string;
  label: string;
  value: string;
};

export type ContactCtaSectionData = {
  eyebrow: string;
  title: string;
  body: string;
  /** Custom contact rows (Email, Phone, WhatsApp, or anything) */
  fields?: ContactField[];
  /** Legacy fixed fields — migrated via resolveContactFields */
  email?: string;
  phone?: string;
  whatsapp?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type CalloutSectionData = {
  title?: string;
  body: string;
  note?: string;
};

export type StatItem = { id: string; value: string; label: string };

export type StatsSectionData = {
  items: StatItem[];
  note?: string;
};

export type TabPanel = {
  id: string;
  label: string;
  sections: PageSection[];
};

export type TabsSectionData = {
  eyebrow?: string;
  title?: string;
  tabs: TabPanel[];
};

type SectionBase = {
  id: string;
  columns?: SectionColumns;
  visible?: boolean;
  /** Optional action buttons for any section */
  buttons?: HeroButton[];
  /** Optional footnote under the section (every section type) */
  note?: string;
};

export type PageSection =
  | (SectionBase & { type: "hero"; data: HeroSectionData })
  | (SectionBase & { type: "proof"; data: ProofSectionData })
  | (SectionBase & { type: "richText"; data: RichTextSectionData })
  | (SectionBase & { type: "mediaText"; data: MediaTextSectionData })
  | (SectionBase & { type: "cardGrid"; data: CardGridSectionData })
  | (SectionBase & { type: "featureList"; data: FeatureListSectionData })
  | (SectionBase & { type: "specsTable"; data: SpecsTableSectionData })
  | (SectionBase & { type: "dataTable"; data: DataTableSectionData })
  | (SectionBase & { type: "gallery"; data: GallerySectionData })
  | (SectionBase & { type: "jointDetails"; data: JointDetailsSectionData })
  | (SectionBase & { type: "contactCta"; data: ContactCtaSectionData })
  | (SectionBase & { type: "callout"; data: CalloutSectionData })
  | (SectionBase & { type: "stats"; data: StatsSectionData })
  | (SectionBase & { type: "tabs"; data: TabsSectionData });

/** Buttons for a section (supports older hero / CTA fields) */
export function resolveSectionButtons(section: PageSection): HeroButton[] {
  if (section.buttons && section.buttons.length > 0) return section.buttons;
  if (section.type === "hero") return resolveHeroButtons(section.data);
  if (section.type === "contactCta" && section.data.ctaLabel) {
    return [
      {
        id: "cta",
        label: section.data.ctaLabel,
        href: section.data.ctaHref || "/contact",
        style: "primary",
        action: "link",
      },
    ];
  }
  return [];
}

/** Contact rows for a contact box (supports older email/phone/whatsapp fields) */
export function resolveContactFields(data: ContactCtaSectionData): ContactField[] {
  if (data.fields && data.fields.length > 0) return data.fields;
  const out: ContactField[] = [];
  if (data.email) out.push({ id: "email", label: "Email", value: data.email });
  if (data.phone) out.push({ id: "phone", label: "Phone", value: data.phone });
  if (data.whatsapp) out.push({ id: "whatsapp", label: "WhatsApp", value: data.whatsapp });
  return out;
}

/** Footnote under a section — section.note, or legacy notes on some data types */
export function resolveSectionNote(section: PageSection): string {
  if (section.note?.trim()) return section.note.trim();
  if (section.type === "dataTable" && section.data.note?.trim()) return section.data.note.trim();
  if (section.type === "callout" && section.data.note?.trim()) return section.data.note.trim();
  if (section.type === "stats" && section.data.note?.trim()) return section.data.note.trim();
  return "";
}

export type SectionType = PageSection["type"];

export type PageChrome = "default" | "about" | "none";

export type PageDocument = {
  title: string;
  chrome?: PageChrome;
  /** About shell meta when chrome === "about" */
  about?: {
    crumbs: { label: string; href?: string }[];
    activeHref: string;
    image?: string;
    /** Small label above the page title (default: About Us) */
    eyebrow?: string;
    /** Optional brand line above the eyebrow (home-hero style) */
    brand?: string;
    /** Supporting sentence under the title */
    lead?: string;
  };
  sections: PageSection[];
};

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: "Page banner",
  proof: "Key highlights",
  richText: "Heading & text",
  mediaText: "Text with photo",
  cardGrid: "Cards / links",
  featureList: "List + photo slideshow",
  specsTable: "Label–value list",
  dataTable: "Table",
  gallery: "Photo gallery",
  jointDetails: "Expandable joint details",
  contactCta: "Contact box",
  callout: "Highlight note",
  stats: "Number stats",
  tabs: "Tabbed sections",
};

/** Short plain-language help for the add-section picker */
export const SECTION_TYPE_HELP: Record<SectionType, string> = {
  hero: "Big top banner with headline, text, and buttons",
  proof: "Three short highlights in a row (01, 02, 03…)",
  richText: "A title and paragraph of writing",
  mediaText: "Title & text beside one photo or a rotating slideshow — swap sides",
  cardGrid: "Rows of cards with photo, title, and link",
  featureList: "Bullet points beside a rotating photo slideshow (like Applications)",
  specsTable: "Rows like “Thickness → 100 mm”",
  dataTable: "Spreadsheet-style table — you’ll pick columns & rows",
  gallery: "A row of photos (or switch to slideshow)",
  jointDetails: "Collapsed joint diagrams visitors expand to view",
  contactCta: "Ask visitors to email / call / contact you",
  callout: "One important sentence to stand out",
  stats: "Big numbers with short labels (e.g. 1978 · Established)",
  tabs: "Switch between tabs (Overview, Specs, etc.)",
};

export const ADDABLE_SECTION_TYPES: SectionType[] = [
  "hero",
  "proof",
  "richText",
  "mediaText",
  "featureList",
  "cardGrid",
  "specsTable",
  "dataTable",
  "gallery",
  "jointDetails",
  "contactCta",
  "callout",
  "stats",
  "tabs",
];

/** Everyday blocks shown first in the add picker */
export const COMMON_SECTION_TYPES: SectionType[] = [
  "hero",
  "richText",
  "mediaText",
  "cardGrid",
  "gallery",
  "proof",
  "contactCta",
  "callout",
];

/** Less common blocks tucked under “More options” */
export const ADVANCED_SECTION_TYPES: SectionType[] = [
  "featureList",
  "specsTable",
  "dataTable",
  "jointDetails",
  "stats",
  "tabs",
];

/** Stable HTML id for in-page button jumps */
export function sectionAnchorId(section: PageSection): string {
  if (section.type === "specsTable") return "specs";
  if (section.type === "contactCta") return "contact";
  if (section.type === "jointDetails") return "joint";
  return section.id;
}

function sectionTitleHint(section: PageSection): string {
  const data = section.data as { title?: string; headline?: string; brand?: string };
  const title = (data.title || data.headline || data.brand || "").trim();
  return title ? title.slice(0, 48) : "";
}

/** Options for “Go to a section” in the button editor */
export function collectSectionJumpTargets(
  sections: PageSection[],
): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];

  function walk(list: PageSection[], prefix = "") {
    list.forEach((s, i) => {
      if (s.visible === false) return;
      const hint = sectionTitleHint(s);
      const base = `${i + 1}. ${SECTION_TYPE_LABELS[s.type]}`;
      out.push({
        id: sectionAnchorId(s),
        label: prefix + (hint ? `${base} — ${hint}` : base),
      });
      if (s.type === "tabs") {
        s.data.tabs.forEach((tab) => walk(tab.sections, `${tab.label} › `));
      }
    });
  }

  walk(sections);
  return out;
}

export function createEmptySection(type: SectionType): PageSection {
  const id = newId(type);
  switch (type) {
    case "hero":
      return {
        id,
        type,
        data: {
          brand: "United Panel-System",
          headline: "New headline",
          lead: "Supporting text for this section.",
          backgroundImage: "",
          buttons: [],
        },
      };
    case "proof":
      return {
        id,
        type,
        data: {
          items: [
            { id: newId("p"), index: "01", title: "Point one", text: "Description" },
            { id: newId("p"), index: "02", title: "Point two", text: "Description" },
            { id: newId("p"), index: "03", title: "Point three", text: "Description" },
          ],
        },
      };
    case "richText":
      return {
        id,
        type,
        data: { eyebrow: "Section", title: "New section", body: "Add your content here." },
      };
    case "mediaText":
      return {
        id,
        type,
        columns: 2,
        data: {
          eyebrow: "Overview",
          title: "Image and text",
          body: "Describe this block.",
          image: "",
          imageSide: "left",
        },
      };
    case "cardGrid":
      return {
        id,
        type,
        columns: 3,
        data: {
          eyebrow: "Explore",
          title: "Cards",
          lead: "",
          items: [
            { id: newId("c"), title: "Card one", text: "Description", href: "#" },
            { id: newId("c"), title: "Card two", text: "Description", href: "#" },
            { id: newId("c"), title: "Card three", text: "Description", href: "#" },
          ],
        },
      };
    case "featureList":
      return {
        id,
        type,
        data: {
          eyebrow: "Advantages",
          title: "Features",
          items: ["Feature one", "Feature two", "Feature three"],
        },
      };
    case "specsTable":
      return {
        id,
        type,
        data: {
          eyebrow: "Specifications",
          title: "Specifications",
          lead: "",
          rows: [
            { label: "Property", value: "Value" },
            { label: "Property", value: "Value" },
          ],
        },
      };
    case "dataTable":
      return {
        id,
        type,
        data: {
          eyebrow: "Properties",
          title: "Data table",
          headers: ["Column A", "Column B", "Column C"],
          rows: [
            ["A1", "B1", "C1"],
            ["A2", "B2", "C2"],
          ],
        },
      };
    case "gallery":
      return {
        id,
        type,
        columns: 3,
        data: { title: "Gallery", items: [] },
      };
    case "jointDetails":
      return {
        id,
        type,
        data: {
          eyebrow: "Joint detail",
          title: "Panel joint",
          summary: "Expand to view joint diagrams and installation details.",
          body: "Describe how the panels lock together.",
          image: "",
          imageAlt: "Panel joint diagram",
          toggleLabel: "Show joint details",
          hideLabel: "Hide joint details",
          pages: [],
        },
      };
    case "contactCta":
      return {
        id,
        type,
        data: {
          eyebrow: "Next step",
          title: "Contact us",
          body: "Tell us about your project.",
          ctaLabel: "Contact Us",
          ctaHref: "/contact",
          fields: [
            { id: newId("cf"), label: "Email", value: "sales@ur.com.my" },
            { id: newId("cf"), label: "Phone", value: "" },
            { id: newId("cf"), label: "WhatsApp", value: "" },
          ],
        },
      };
    case "callout":
      return { id, type, data: { body: "A short callout or note." } };
    case "stats":
      return {
        id,
        type,
        data: {
          items: [
            { id: newId("s"), value: "1978", label: "Established" },
            { id: newId("s"), value: "Johor", label: "HQ & factory" },
          ],
        },
      };
    case "tabs":
      return {
        id,
        type,
        data: {
          title: "Details",
          tabs: [
            {
              id: newId("tab"),
              label: "Tab one",
              sections: [
                {
                  id: newId("richText"),
                  type: "richText",
                  data: { title: "Tab one content", body: "Edit this tab." },
                },
              ],
            },
            {
              id: newId("tab"),
              label: "Tab two",
              sections: [
                {
                  id: newId("richText"),
                  type: "richText",
                  data: { title: "Tab two content", body: "Edit this tab." },
                },
              ],
            },
          ],
        },
      };
  }
}

const TABLE_SIZE_MIN = 1;
const TABLE_SIZE_MAX = 12;

export function clampTableSize(n: number, fallback: number): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return fallback;
  return Math.min(TABLE_SIZE_MAX, Math.max(TABLE_SIZE_MIN, v));
}

/** Build a spreadsheet-style table with the chosen size */
export function createDataTableSection(columnCount = 3, rowCount = 2): PageSection {
  const cols = clampTableSize(columnCount, 3);
  const rows = clampTableSize(rowCount, 2);
  const headers = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);
  const body = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
  return {
    id: newId("dataTable"),
    type: "dataTable",
    data: {
      eyebrow: "Properties",
      title: "Data table",
      headers,
      rows: body,
    },
  };
}

/** Label–value list with N rows (always 2 columns) */
export function createSpecsTableSection(rowCount = 2): PageSection {
  const rows = clampTableSize(rowCount, 2);
  return {
    id: newId("specsTable"),
    type: "specsTable",
    data: {
      eyebrow: "Specifications",
      title: "Specifications",
      lead: "",
      rows: Array.from({ length: rows }, () => ({ label: "Property", value: "Value" })),
    },
  };
}

export function resizeDataTable(
  data: DataTableSectionData,
  columnCount: number,
  rowCount: number,
): DataTableSectionData {
  const cols = clampTableSize(columnCount, data.headers.length || 3);
  const rows = clampTableSize(rowCount, data.rows.length || 2);
  const headers = Array.from({ length: cols }, (_, i) => data.headers[i] || `Column ${i + 1}`);
  const nextRows = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => data.rows[r]?.[c] ?? ""),
  );
  return { ...data, headers, rows: nextRows };
}

export function gridClass(columns?: SectionColumns): string {
  if (columns === 2) return "pb-cols pb-cols-2";
  if (columns === 3) return "pb-cols pb-cols-3";
  return "pb-cols pb-cols-1";
}

/** Photo URLs for a text+photo section (slideshow or single) */
export function mediaTextPhotoSrcs(data: MediaTextSectionData): string[] {
  return mediaTextPhotos(data).map((p) => p.src);
}

/** Photos + crop focus for a text+photo section */
export function mediaTextPhotos(
  data: MediaTextSectionData,
): Array<{ src: string; focus?: ImageFocus }> {
  const raw = data.images || [];
  const fromSlides: Array<{ src: string; focus?: ImageFocus }> = [];
  for (const img of raw) {
    if (typeof img === "string") {
      if (img) fromSlides.push({ src: img, focus: data.imageFocus });
      continue;
    }
    if (!img?.src) continue;
    fromSlides.push({ src: img.src, focus: img.focus || data.imageFocus });
  }
  if (fromSlides.length > 0) return fromSlides;
  return data.image ? [{ src: data.image, focus: data.imageFocus }] : [];
}

/**
 * Fix Applications that were migrated as a bullet list + photo grid.
 * Rejoins them into one feature list with a slideshow.
 */
export function repairApplicationSlideshow(doc: PageDocument): PageDocument {
  const sections = doc.sections;
  if (!sections?.length) return doc;
  const next: PageSection[] = [];
  for (let i = 0; i < sections.length; i++) {
    const current = sections[i];
    const following = sections[i + 1];
    if (
      current.type === "featureList" &&
      !(current.data.images && current.data.images.length > 0) &&
      following?.type === "gallery" &&
      !following.data.title &&
      following.data.items.length > 0
    ) {
      next.push({
        ...current,
        data: {
          ...current.data,
          images: following.data.items,
        },
      });
      i += 1;
      continue;
    }
    next.push(current);
  }
  if (next.length === sections.length) return doc;
  return { ...doc, sections: next };
}

/** Lift legacy data.note onto section.note so every section uses one footer field */
export function repairSectionNotes(doc: PageDocument): PageDocument {
  let changed = false;
  const sections: PageSection[] = doc.sections.map((section) => {
    if (section.note?.trim()) return section;
    if (section.type === "dataTable" && section.data.note?.trim()) {
      changed = true;
      return {
        ...section,
        note: section.data.note,
        data: { ...section.data, note: undefined },
      };
    }
    if (section.type === "callout" && section.data.note?.trim()) {
      changed = true;
      return {
        ...section,
        note: section.data.note,
        data: { ...section.data, note: undefined },
      };
    }
    if (section.type === "stats" && section.data.note?.trim()) {
      changed = true;
      return {
        ...section,
        note: section.data.note,
        data: { ...section.data, note: undefined },
      };
    }
    return section;
  });
  return changed ? { ...doc, sections } : doc;
}

/**
 * Quality / certification card grids should use logo tiles (not stretched photo cards).
 * Also fixes the PU ISO card that incorrectly reused the warranty icon.
 */
export function repairCertCardGrids(doc: PageDocument): PageDocument {
  let changed = false;
  const sections: PageSection[] = doc.sections.map((section) => {
    if (section.type !== "cardGrid") return section;
    const title = (section.data.title || "").toLowerCase();
    const looksLikeCerts =
      section.data.variant === "certs" ||
      title.includes("confidence") ||
      title.includes("certified quality") ||
      section.data.items.some((item) =>
        ["iso", "warranty", "approved", "fm", "tuv", "quality"].includes(item.id),
      );
    if (!looksLikeCerts) return section;

    const items = section.data.items.map((item) => {
      const name = (item.title || "").toLowerCase();
      const image = (item.image || "").toLowerCase();
      if (
        (item.id === "iso" || name.includes("iso 9001")) &&
        image.includes("warranty")
      ) {
        changed = true;
        return {
          ...item,
          title: "ISO 9001:2015",
          text:
            item.text && item.text.toLowerCase().includes("17975")
              ? item.text
              : "Manufactured under an audited quality management system — Certification No. 17975-A.",
          image: "/uploads/pir/certs/catalogue-page-18.jpg",
          href: item.href || "/about/certified/quality-recognition",
        };
      }
      if (item.id === "warranty" || name.includes("corrosion")) {
        const next = {
          ...item,
          title: "20-year corrosion-free warranty",
          text:
            item.text && item.text.length > 50
              ? item.text
              : "Eligible corrosion-free skin finishes are covered for up to 20 years — ask us which coatings apply to your project.",
          href: item.href || "/contact",
        };
        if (
          next.title !== item.title ||
          next.text !== item.text ||
          next.href !== item.href
        ) {
          changed = true;
        }
        return next;
      }
      return item;
    });

    if (section.data.variant !== "certs") changed = true;
    return {
      ...section,
      columns: section.columns || 3,
      data: {
        ...section.data,
        variant: "certs",
        items,
      },
    };
  });
  return changed ? { ...doc, sections } : doc;
}
