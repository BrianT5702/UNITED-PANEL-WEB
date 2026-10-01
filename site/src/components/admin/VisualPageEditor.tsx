"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CardItem,
  GalleryItem,
  HeroButton,
  PageDocument,
  PageSection,
  SectionColumns,
  SectionType,
  TabsSectionData,
} from "@/lib/page-document";
import {
  ADDABLE_SECTION_TYPES,
  COLLAGE_MAX_PHOTOS,
  COLLAGE_SLOT_LABELS,
  SECTION_TYPE_GROUPS,
  SECTION_TYPE_HELP,
  SECTION_TYPE_LABELS,
  clampTableSize,
  collectSectionJumpTargets,
  createDataTableSection,
  createEmptySection,
  createSpecsTableSection,
  cardGridLayout,
  gridClass,
  imageAspectStyle,
  newId,
  proofColumnsClass,
  resizeDataTable,
  resolveContactFields,
  resolveSectionButtons,
  resolveSectionNote,
  resolveSlideshowIntervalMs,
  veilOpacity,
} from "@/lib/page-document";
import type { ContactField } from "@/lib/page-document";
import { adminEditHref, livePathToAdminEdit, navItemsForAdminEdit, SITE_PAGES, type SitePage } from "@/lib/pages";
import { SITE_NAV } from "@/lib/nav";
import { defaultHomeContent } from "@/lib/defaults";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AboutShell } from "@/components/site/AboutShell";
import { LogoSlideshow } from "@/components/site/LogoSlideshow";
import { LogoutButton } from "./LogoutButton";
import { AdminGuide, AdminGuideButton } from "./AdminGuide";
import { EImage, EText } from "./visual/Editable";
import { ImageAspectPicker } from "./visual/ImageAspectPicker";
import { ImageAlignPicker } from "./visual/ImageAlignPicker";
import { SlideshowIntervalControl } from "./visual/SlideshowIntervalControl";
import { VeilStrengthControl } from "./visual/VeilStrengthControl";
import { SectionButtonsEditor, SectionButtonsView } from "./visual/SectionButtons";
import { PageLinkField } from "./visual/PageLinkField";

function reorder<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

type SectionSelection = {
  selectedSectionId: string | null;
  selectSection: (id: string | null) => void;
};

const SectionSelectionContext = createContext<SectionSelection>({
  selectedSectionId: null,
  selectSection: () => {},
});

function useSectionSelection() {
  return useContext(SectionSelectionContext);
}


/** Slide list thumbnail + in-flow "Change picture" button (no chrome over the picture) */
function SlidePicturePicker({
  value,
  alt,
  onChange,
}: {
  value: string;
  alt: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    setUploading(false);
    if (!res.ok) {
      alert("Upload failed. Try a JPG or PNG under 8MB.");
      return;
    }
    const data = await res.json();
    onChange(data.url);
  }
  return (
    <div className="ve-logo-slides-picture">
      <div className="ve-logo-slides-thumb">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={alt} />
        ) : (
          <span className="ve-logo-slides-thumb-empty">No picture yet</span>
        )}
      </div>
      <button
        type="button"
        className="ve-mini-btn"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : value ? "Change picture" : "Add picture"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function OptionalEText({
  value,
  onChange,
  as = "p",
  className,
  multiline,
  rich,
  addLabel,
  seedValue,
  removeLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span" | "strong";
  className?: string;
  multiline?: boolean;
  rich?: boolean;
  addLabel: string;
  seedValue: string;
  /** Shown next to the field so beginners can clear it without guessing */
  removeLabel?: string;
}) {
  const clearLabel =
    removeLabel ||
    (addLabel.toLowerCase().includes("label")
      ? "Remove label"
      : addLabel.toLowerCase().includes("intro")
        ? "Remove intro"
        : addLabel.toLowerCase().includes("title")
          ? "Remove title"
          : "Remove");

  if ((value || "").trim()) {
    return (
      <div className="ve-optional-field">
        <EText
          as={as}
          className={className}
          multiline={multiline}
          rich={rich}
          value={value}
          onChange={(next) => {
            // Clearing all text removes the field (back to + Add …)
            // Strip tags when checking emptiness
            const plain = next.replace(/<[^>]+>/g, "").trim();
            if (!plain) onChange("");
            else onChange(next);
          }}
        />
        <button
          type="button"
          className="ve-mini-btn ve-remove-optional"
          title={clearLabel}
          onClick={() => onChange("")}
        >
          {clearLabel}
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="ve-mini-btn ve-add-optional"
      onClick={() => onChange(seedValue)}
    >
      {addLabel}
    </button>
  );
}


function SectionToolbar({
  label,
  columns,
  onColumns,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  canColumns,
}: {
  label: string;
  columns?: SectionColumns;
  onColumns?: (c: SectionColumns) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canColumns?: boolean;
}) {
  function confirmDelete() {
    if (window.confirm(`Remove this “${label}” block from the page?`)) onDelete();
  }

  return (
    <div className="ve-section-toolbar">
      <span className="ve-section-label">{label}</span>
      <div className="ve-section-toolbar-actions">
        {canColumns && onColumns ? (
          <span className="ve-tool-group" title="How many items in a row on a wide screen">
            <span className="ve-tool-group-label">Layout</span>
            {([1, 2, 3, 4] as SectionColumns[]).map((c) => (
              <button
                key={c}
                type="button"
                className={`ve-tool-btn ${(columns || 1) === c ? "is-active" : ""}`}
                onClick={() => onColumns(c)}
                title={`${c} in a row`}
              >
                {c} in a row
              </button>
            ))}
          </span>
        ) : null}
        <span className="ve-tool-group">
          <button type="button" className="ve-tool-btn" onClick={onMoveUp} title="Move up">
            Move up
          </button>
          <button type="button" className="ve-tool-btn" onClick={onMoveDown} title="Move down">
            Move down
          </button>
          <button type="button" className="ve-tool-btn" onClick={onDuplicate} title="Make a copy">
            Make a copy
          </button>
        </span>
        <button type="button" className="ve-tool-btn is-danger" onClick={confirmDelete} title="Delete block">
          Delete block
        </button>
      </div>
    </div>
  );
}

function EditableSection({
  section,
  onChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  nested,
  sectionTargets,
  sitePages = SITE_PAGES,
}: {
  section: PageSection;
  onChange: (s: PageSection) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  nested?: boolean;
  sectionTargets?: { id: string; label: string }[];
  sitePages?: SitePage[];
}) {
  const { selectedSectionId, selectSection } = useSectionSelection();
  const selected = selectedSectionId === section.id;
  const typeLabel = SECTION_TYPE_LABELS[section.type];

  const setData = <T,>(data: T) => onChange({ ...section, data } as PageSection);
  const setColumns = (columns: SectionColumns) => onChange({ ...section, columns });
  const canColumns = ["cardGrid", "gallery", "featureList", "proof"].includes(section.type);
  const [noteOpen, setNoteOpen] = useState(Boolean(resolveSectionNote(section).trim()));

  function setButtons(buttons: HeroButton[]) {
    if (section.type === "hero") {
      onChange({
        ...section,
        buttons,
        data: {
          ...section.data,
          buttons,
          primaryCtaLabel: undefined,
          primaryCtaHref: undefined,
          secondaryCtaLabel: undefined,
          secondaryCtaHref: undefined,
        },
      });
      return;
    }
    onChange({ ...section, buttons });
  }

  function setSectionNote(note: string) {
    const next = { ...section, note };
    if (next.type === "dataTable") {
      next.data = { ...next.data, note: undefined };
    }
    if (next.type === "callout" || next.type === "stats") {
      next.data = { ...next.data, note: undefined };
    }
    onChange(next);
  }

  const buttonsEditor = (
    <SectionButtonsEditor
      buttons={resolveSectionButtons(section)}
      onChange={setButtons}
      dark={section.type === "hero"}
      sectionTargets={sectionTargets}
      sitePages={sitePages}
    />
  );

  const noteValue = resolveSectionNote(section);
  const noteEditor = (
    <div className={`ve-note-fold${noteOpen ? " is-open" : ""}`}>
      <button type="button" className="ve-note-toggle" onClick={() => setNoteOpen((v) => !v)}>
        <span>Optional footnote under this block</span>
        <span className="ve-btns-toggle-meta">{noteValue.trim() ? "Has note" : "None"}</span>
        <span aria-hidden>{noteOpen ? "▾" : "▸"}</span>
      </button>
      {noteOpen ? (
        <label className={`ve-section-note-field${section.type === "hero" ? " is-dark" : ""}`}>
          <textarea
            value={noteValue}
            rows={2}
            placeholder="Optional small note under this block (sources, disclaimers…)"
            onChange={(e) => setSectionNote(e.target.value)}
          />
        </label>
      ) : null}
    </div>
  );

  const toolbar = (
    <SectionToolbar
      label={SECTION_TYPE_LABELS[section.type]}
      columns={section.columns}
      onColumns={canColumns ? setColumns : undefined}
      canColumns={canColumns}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    />
  );

  let body: ReactNode = null;
  switch (section.type) {
    case "hero": {
      const d = section.data;
      const heroClass = d.size === "full" ? "hero ve-block" : "hero hero-short ve-block";
      body = (
        <section className={heroClass}>
          <div className="hero-media">
            <EImage
              className="ve-hero-bg"
              value={d.backgroundImage}
              onChange={(backgroundImage) => setData({ ...d, backgroundImage })}
              focus={d.imageFocus}
              onFocusChange={(imageFocus) => setData({ ...d, imageFocus })}
              label="Click to add banner photo"
              underChrome={
                <div className="hero-veil" style={{ opacity: veilOpacity(d.veilStrength) }} />
              }
            />
          </div>
          <div className="hero-content">
            <EText as="p" className="hero-brand" multiline value={d.brand} onChange={(brand) => setData({ ...d, brand })} />
            <EText as="h1" multiline value={d.headline} onChange={(headline) => setData({ ...d, headline })} />
            {d.tagline !== undefined ? (
              <EText
                as="p"
                className="hero-tagline"
                multiline
                value={d.tagline || ""}
                onChange={(tagline) => setData({ ...d, tagline })}
              />
            ) : (
              <button
                type="button"
                className="ve-mini-btn"
                onClick={() => setData({ ...d, tagline: "Add a short tagline" })}
              >
                + Add tagline
              </button>
            )}
            <EText
              as="p"
              className="hero-lead"
              multiline
              value={d.lead}
              onChange={(lead) => setData({ ...d, lead })}
            />
          </div>
        </section>
      );
      break;
    }
    case "proof": {
      const d = section.data;
      const syncProofColumns = (items: typeof d.items) => {
        const n = items.length;
        if (n >= 2 && n <= 4) {
          onChange({ ...section, columns: n as SectionColumns, data: { items } });
        } else {
          setData({ items });
        }
      };
      body = (
        <section className={`proof ve-block ${proofColumnsClass(section.columns)}`}>
          {d.items.map((item, index) => (
            <div className="proof-item ve-card" key={item.id}>
              <EText
                as="span"
                className="proof-index"
                value={item.index}
                onChange={(indexLabel) => {
                  const items = [...d.items];
                  items[index] = { ...item, index: indexLabel };
                  setData({ items });
                }}
              />
              <EText
                as="h2"
                value={item.title}
                onChange={(title) => {
                  const items = [...d.items];
                  items[index] = { ...item, title };
                  setData({ items });
                }}
              />
              <EText
                as="p"
                multiline
                value={item.text}
                onChange={(text) => {
                  const items = [...d.items];
                  items[index] = { ...item, text };
                  setData({ items });
                }}
              />
              <div className="ve-card-foot">
                <button
                  type="button"
                  className="ve-remove"
                  title="Remove this highlight"
                  onClick={() => {
                    if (!window.confirm("Remove this highlight from the row?")) return;
                    syncProofColumns(d.items.filter((_, i) => i !== index));
                  }}
                >
                  Remove highlight
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="ve-add-btn ve-add-wide"
            onClick={() =>
              syncProofColumns([
                ...d.items,
                {
                  id: newId("p"),
                  index: String(d.items.length + 1).padStart(2, "0"),
                  title: "New highlight",
                  text: "Short description",
                },
              ])
            }
          >
            + Add highlight
          </button>
        </section>
      );
      break;
    }
    case "richText": {
      const d = section.data;
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <div className="section-head">
            <OptionalEText
              as="p"
              className="eyebrow"
              value={d.eyebrow || ""}
              onChange={(eyebrow) => setData({ ...d, eyebrow })}
              addLabel="+ Add small label above title"
              seedValue="Label"
            />
            <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
            <EText
              as="p"
              className="section-lead"
              multiline
              value={d.body}
              onChange={(body) => setData({ ...d, body })}
            />
          </div>
        </section>
      );
      break;
    }
    case "photoCollage": {
      const d = section.data;
      const items = d.items || [];
      const photosLeft = d.photoSide === "left";
      const setItems = (next: GalleryItem[]) => setData({ ...d, items: next });
      const patchItem = (index: number, next: Partial<GalleryItem>) =>
        setItems(items.map((item, i) => (i === index ? { ...item, ...next } : item)));
      const collageButtons = resolveSectionButtons(section);
      body = (
        <section
          className={`section ve-block pb-collage ${nested ? "pb-nested" : ""}`}
          data-photo-side={photosLeft ? "left" : "right"}
          data-count={items.length}
        >
          <div className="ve-block-toolbar">
            <div className="ve-block-toolbar-row">
              <span className="ve-placement-label">Layout</span>
              <div className="ve-seg" title="Which side the photos sit on">
                <button
                  type="button"
                  className={`ve-seg-btn ${!photosLeft ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, photoSide: "right" })}
                >
                  Text left · Photos right
                </button>
                <button
                  type="button"
                  className={`ve-seg-btn ${photosLeft ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, photoSide: "left" })}
                >
                  Photos left · Text right
                </button>
              </div>
            </div>
            <div className="ve-block-toolbar-row">
              <span className="ve-placement-label">Small label</span>
              <div className="ve-seg" title="Small coloured label above the heading">
                <button
                  type="button"
                  className={`ve-seg-btn ${d.eyebrow ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, eyebrow: d.eyebrow || "Our projects" })}
                >
                  Show
                </button>
                <button
                  type="button"
                  className={`ve-seg-btn ${!d.eyebrow ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, eyebrow: "" })}
                >
                  Hide
                </button>
              </div>
            </div>
            <p className="ve-toolbar-hint">
              3–5 photos look best. Click a photo to change it, drag inside it to reframe, − / + to zoom.
              The button is set under “Buttons” at the bottom of this block.
            </p>
          </div>
          <div className="ve-collage-manager">
            <p className="ve-btns-toggle-meta">Photo order — photo 1 is the tall one; use ← → to swap places</p>
            <ol className="ve-collage-list">
              {items.map((item, index) => (
                <li className="ve-collage-row" key={item.id}>
                  <span className="ve-collage-thumb" aria-hidden="true">
                    {item.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.src} alt="" />
                    ) : (
                      <span>Empty</span>
                    )}
                  </span>
                  <span className="ve-collage-row-label">
                    <strong>Photo {index + 1}</strong>
                    <span>{COLLAGE_SLOT_LABELS[index] || "Photo"}</span>
                  </span>
                  <span className="ve-card-actions ve-card-actions-inline">
                    <button
                      type="button"
                      className="ve-move"
                      title="Move earlier"
                      aria-label={`Move photo ${index + 1} earlier`}
                      disabled={index === 0}
                      onClick={() => setItems(reorder(items, index, index - 1))}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="ve-move"
                      title="Move later"
                      aria-label={`Move photo ${index + 1} later`}
                      disabled={index >= items.length - 1}
                      onClick={() => setItems(reorder(items, index, index + 1))}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className="ve-remove"
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ol>
            {items.length < COLLAGE_MAX_PHOTOS ? (
              <button
                type="button"
                className="ve-add-btn ve-add-slide"
                onClick={() => setItems([...items, { id: newId("ph"), src: "", alt: "" }])}
              >
                + Add a photo ({items.length} of {COLLAGE_MAX_PHOTOS})
              </button>
            ) : (
              <p className="ve-btns-toggle-meta">5 photos is the most this collage holds.</p>
            )}
          </div>
          <div className="pb-collage-grid">
            <span className="pb-collage-accent" aria-hidden="true" />
            <div className="pb-collage-copy">
              {d.eyebrow ? (
                <EText
                  as="p"
                  className="eyebrow"
                  value={d.eyebrow}
                  onChange={(eyebrow) => setData({ ...d, eyebrow: eyebrow.replace(/<[^>]+>/g, "").trim() ? eyebrow : "" })}
                />
              ) : null}
              <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
              <div className="pb-collage-body">
                <EText as="p" multiline value={d.body} onChange={(body) => setData({ ...d, body })} />
              </div>
              {collageButtons.length ? (
                <div
                  className="ve-collage-actions-preview"
                  title="Edit this button under “Buttons” at the bottom of the block"
                  onClickCapture={(e) => e.preventDefault()}
                >
                  <SectionButtonsView buttons={collageButtons} />
                </div>
              ) : null}
            </div>
            {items.map((item, index) => (
              <div className="pb-collage-tile pb-photo-frame" data-slot={index + 1} key={item.id}>
                <EImage
                  value={item.src}
                  onChange={(src) => patchItem(index, { src })}
                  focus={item.focus}
                  onFocusChange={(focus) => patchItem(index, { focus })}
                  label={`Photo ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </section>
      );
      break;
    }
    case "mediaText": {
      const d = section.data;
      const photoRight = d.imageSide === "right";
      const slides = d.images || [];
      const slideshowOn = slides.length > 0;
      body = (
        <section className={`section ve-block ${nested ? "pb-nested" : ""}`}>
          <div className="ve-block-toolbar">
            <div className="ve-block-toolbar-row">
              <span className="ve-placement-label">Layout</span>
              <div className="ve-seg" title="Where the photo sits">
                <button
                  type="button"
                  className={`ve-seg-btn ${!photoRight ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, imageSide: "left" })}
                >
                  Photo left · Text right
                </button>
                <button
                  type="button"
                  className={`ve-seg-btn ${photoRight ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, imageSide: "right" })}
                >
                  Text left · Photo right
                </button>
              </div>
            </div>
            <div className="ve-block-toolbar-row">
              <span className="ve-placement-label">Photos</span>
              <div className="ve-seg" title="One photo or a rotating set">
                <button
                  type="button"
                  className={`ve-seg-btn ${!slideshowOn ? "is-active" : ""}`}
                  onClick={() => {
                    const kept =
                      [d.image, ...slides.map((s) => s.src)].find((src) => Boolean(src?.trim())) || "";
                    setData({
                      ...d,
                      images: undefined,
                      image: kept,
                    });
                  }}
                >
                  One photo
                </button>
                <button
                  type="button"
                  className={`ve-seg-btn ${slideshowOn ? "is-active" : ""}`}
                  onClick={() =>
                    setData({
                      ...d,
                      image: d.image || slides[0]?.src || "",
                      images:
                        slides.length > 0
                          ? slides
                          : [
                              {
                                id: newId("slide"),
                                src: d.image || "",
                                alt: "Photo",
                              },
                            ],
                    })
                  }
                >
                  Slideshow
                </button>
              </div>
            </div>
            <ImageAspectPicker
              compact
              value={d.imageAspect}
              onChange={(imageAspect) => setData({ ...d, imageAspect })}
            />
            <p className="ve-toolbar-hint">Choose layout, then photo shape.</p>
          </div>
          {slideshowOn ? (
            <SlideshowIntervalControl
              value={d.slideshowIntervalSec}
              onChange={(slideshowIntervalSec) => setData({ ...d, slideshowIntervalSec })}
            />
          ) : null}
          {slideshowOn ? (
            <div className="ve-slideshow-panel ve-slideshow-panel-wide">
              <p className="ve-btns-toggle-meta">
                Slideshow photos — pick a Photo shape above, then drag inside each frame
              </p>
              <div className="ve-slideshow-edit">
                {slides.map((img, index) => (
                  <div className="ve-card ve-slide-card" key={img.id}>
                    <div className="ve-slide-index">Photo {index + 1}</div>
                    <div
                      className="ve-slide-frame pb-photo-frame"
                      style={imageAspectStyle(d.imageAspect) ?? { aspectRatio: "2 / 1" }}
                    >
                      <EImage
                        value={img.src}
                        onChange={(src) => {
                          const next = [...slides];
                          next[index] = { ...img, src };
                          setData({ ...d, images: next, image: next[0]?.src || d.image });
                        }}
                        focus={img.focus || d.imageFocus}
                        onFocusChange={(focus) => {
                          const next = [...slides];
                          next[index] = { ...img, focus };
                          setData({ ...d, images: next });
                        }}
                        label="Slide photo"
                      />
                    </div>
                    <div className="ve-card-foot">
                      <button
                        type="button"
                        className="ve-remove"
                        onClick={() => {
                          const next = slides.filter((_, i) => i !== index);
                          setData({
                            ...d,
                            images: next.length ? next : undefined,
                            image: next[0]?.src || img.src || d.image,
                          });
                        }}
                      >
                        Remove photo {index + 1}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="ve-add-btn ve-add-slide"
                onClick={() =>
                  setData({
                    ...d,
                    images: [...slides, { id: newId("slide"), src: "", alt: "Photo" }],
                  })
                }
              >
                + Add another photo
              </button>
            </div>
          ) : null}
          <div className={`capability ve-media-split ${photoRight ? "pb-media-reverse" : ""}`}>
            {!slideshowOn ? (
              <div
                className="capability-visual capability-visual-clear pb-photo-frame"
                data-photo-shape={d.imageAspect || "default"}
                style={imageAspectStyle(d.imageAspect)}
              >
                <EImage
                  value={d.image || ""}
                  onChange={(image) => setData({ ...d, image })}
                  focus={d.imageFocus}
                  onFocusChange={(imageFocus) => setData({ ...d, imageFocus })}
                  label="Section photo"
                />
              </div>
            ) : (
              <div
                className="ve-slideshow-preview"
                data-photo-shape={d.imageAspect || "default"}
                style={imageAspectStyle(d.imageAspect) ?? { aspectRatio: "4 / 3" }}
                aria-hidden="true"
              >
                <span>On the live page, these photos rotate here</span>
              </div>
            )}
            <div className="ve-media-copy">
              <OptionalEText
                as="p"
                className="eyebrow"
                value={d.eyebrow || ""}
                onChange={(eyebrow) => setData({ ...d, eyebrow })}
                addLabel="+ Add small label above title"
                seedValue="Label"
              />
              <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
              <EText as="p" multiline value={d.body} onChange={(body) => setData({ ...d, body })} />
              <OptionalEText
                as="p"
                multiline
                value={d.body2 || ""}
                onChange={(body2) => setData({ ...d, body2 })}
                addLabel="+ Add second paragraph"
                seedValue="More detail"
              />
              <div className="ve-field-row">
                <label>
                  Link text
                  <input
                    value={d.linkLabel || ""}
                    onChange={(e) => setData({ ...d, linkLabel: e.target.value })}
                  />
                </label>
                <PageLinkField
                  value={d.linkHref || ""}
                  onChange={(linkHref) => setData({ ...d, linkHref })}
                  pages={sitePages}
                  label="Opens this page"
                  allowEmpty
                />
              </div>
            </div>
          </div>
        </section>
      );
      break;
    }
    case "cardGrid": {
      const d = section.data;
      const updateItem = (index: number, patch: Partial<CardItem>) => {
        const items = [...d.items];
        items[index] = { ...items[index], ...patch };
        setData({ ...d, items });
      };
      const hasHeading = Boolean(d.eyebrow || d.title || d.lead);
      // Same layout rules as the live page (cardGridLayout) so editor = live
      const layout = cardGridLayout(
        section.columns,
        d.variant,
        d.items.some((item) => Boolean(item.image)),
      );
      const isGateway = layout.kind === "gateway";
      const isCerts = layout.kind === "certs";
      const isHub = layout.kind === "hub";
      body = (
        <section
          className={`section section-compact ve-block ve-card-grid ${isHub ? "about-hub-section" : ""} ${nested ? "pb-nested" : ""}`}
        >
          {hasHeading ? (
            <div className="section-head ve-optional-head">
              <OptionalEText
                as="p"
                className="eyebrow"
                value={d.eyebrow || ""}
                onChange={(eyebrow) => setData({ ...d, eyebrow })}
                addLabel="+ Add small label above title"
                seedValue="Label"
              />
              <OptionalEText
                as="h2"
                value={d.title || ""}
                onChange={(title) => setData({ ...d, title })}
                addLabel="+ Add title"
                seedValue="Section title"
              />
              <OptionalEText
                as="p"
                className="section-lead"
                value={d.lead || ""}
                onChange={(lead) => setData({ ...d, lead })}
                addLabel="+ Add intro line under title"
                seedValue="Intro line"
              />
              {selected ? (
                <button
                  type="button"
                  className="ve-remove-heading"
                  onClick={() => setData({ ...d, eyebrow: "", title: "", lead: "" })}
                >
                  Remove heading
                </button>
              ) : null}
            </div>
          ) : (
            <div className="ve-optional-head-toggle">
              <button
                type="button"
                className="ve-mini-btn"
                onClick={() => setData({ ...d, title: "Section title", eyebrow: "", lead: "" })}
              >
                + Add section heading
              </button>
            </div>
          )}
          <div className="ve-block-toolbar">
            <div className="ve-block-toolbar-row">
              <span className="ve-placement-label">Card style</span>
              <div className="ve-seg">
                <button
                  type="button"
                  className={`ve-seg-btn ${(d.variant || "default") === "default" ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, variant: "default" })}
                >
                  Photo cards
                </button>
                <button
                  type="button"
                  className={`ve-seg-btn ${d.variant === "certs" ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, variant: "certs" })}
                >
                  Logo cards
                </button>
              </div>
            </div>
            {isCerts ? (
              <p className="ve-toolbar-hint">Logo cards keep marks sharp without photo cropping.</p>
            ) : isGateway ? (
              <p className="ve-toolbar-hint">
                2-column photo cards use side-by-side layout (image left) · Drag to reframe · − / + zoom
              </p>
            ) : (
              <>
                <ImageAspectPicker
                  compact
                  value={d.imageAspect}
                  onChange={(imageAspect) => setData({ ...d, imageAspect })}
                />
                <p className="ve-toolbar-hint">
                  Drag to reframe · − / + zoom · Change photo replaces the file
                </p>
              </>
            )}
          </div>
          <div className={layout.grid}>
            {d.items.map((item, index) => (
              <article
                className={`${layout.card} ve-card`}
                key={item.id}
              >
                <div className="ve-card-toolbar">
                  <span className="ve-card-index">Card {index + 1}</span>
                  <div className="ve-card-actions ve-card-actions-inline">
                    <button
                      type="button"
                      className="ve-move"
                      title="Move left"
                      aria-label="Move left"
                      disabled={index === 0}
                      onClick={() => setData({ ...d, items: reorder(d.items, index, index - 1) })}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="ve-move"
                      title="Move right"
                      aria-label="Move right"
                      disabled={index >= d.items.length - 1}
                      onClick={() => setData({ ...d, items: reorder(d.items, index, index + 1) })}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className="ve-remove"
                      onClick={() => setData({ ...d, items: d.items.filter((_, i) => i !== index) })}
                    >
                      Remove card
                    </button>
                  </div>
                </div>
                {isCerts ? (
                  <div className="panel-cert-logo">
                    <EImage
                      value={item.image || ""}
                      onChange={(image) => updateItem(index, { image })}
                      label="Logo / mark"
                    />
                  </div>
                ) : isGateway ? (
                  <div className="home-gateway-media">
                    <EImage
                      value={item.image || ""}
                      onChange={(image) => updateItem(index, { image })}
                      focus={item.focus}
                      onFocusChange={(focus) => updateItem(index, { focus })}
                      label="Card photo"
                    />
                  </div>
                ) : isHub ? (
                  // Text cards (live shows no photo area): slim editor-only strip to add one
                  <div className="ve-hub-photo">
                    <EImage
                      value={item.image || ""}
                      onChange={(image) => updateItem(index, { image })}
                      label="Card photo (optional)"
                    />
                  </div>
                ) : (
                  <div className="product-card-image pb-photo-frame" style={imageAspectStyle(d.imageAspect)}>
                    <EImage
                      value={item.image || ""}
                      onChange={(image) => updateItem(index, { image })}
                      focus={item.focus}
                      onFocusChange={(focus) => updateItem(index, { focus })}
                      label="Card photo"
                    />
                  </div>
                )}
                <div className={layout.body}>
                  <OptionalEText
                    as="p"
                    className="eyebrow"
                    value={item.eyebrow || ""}
                    onChange={(eyebrow) => updateItem(index, { eyebrow })}
                    addLabel="+ Add small label"
                    seedValue="Label"
                  />
                  <EText as="h3" value={item.title} onChange={(title) => updateItem(index, { title })} />
                  <EText as="p" multiline value={item.text} onChange={(text) => updateItem(index, { text })} />
                  <PageLinkField
                    value={item.href || ""}
                    onChange={(href) => updateItem(index, { href })}
                    pages={sitePages}
                    label={isGateway ? "Open →" : "Opens this page"}
                    allowEmpty
                  />
                </div>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="ve-add-btn ve-add-wide"
            onClick={() =>
              setData({
                ...d,
                items: [...d.items, { id: newId("c"), title: "New card", text: "Description", href: "#" }],
              })
            }
          >
            + Add card
          </button>
        </section>
      );
      break;
    }
    case "featureList": {
      const d = section.data;
      const images = d.images || [];
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          {images.length ? (
            <ImageAspectPicker
              value={d.imageAspect}
              onChange={(imageAspect) => setData({ ...d, imageAspect })}
            />
          ) : null}
          {images.length ? (
            <SlideshowIntervalControl
              value={d.slideshowIntervalSec}
              onChange={(slideshowIntervalSec) => setData({ ...d, slideshowIntervalSec })}
            />
          ) : null}
          {images.length ? (
            <div className="ve-slideshow-panel ve-slideshow-panel-wide">
              <p className="ve-btns-toggle-meta">
                Slideshow photos — add each photo below, then Save
              </p>
              <div className="ve-slideshow-edit">
                {images.map((img, index) => (
                  <div className="ve-card ve-slide-card" key={img.id}>
                    <div className="ve-slide-index">Photo {index + 1}</div>
                    <div
                      className="ve-slide-frame pb-photo-frame"
                      style={imageAspectStyle(d.imageAspect) ?? { aspectRatio: "2 / 1" }}
                    >
                      <EImage
                        value={img.src}
                        onChange={(src) => {
                          const next = [...images];
                          next[index] = { ...img, src };
                          setData({ ...d, images: next });
                        }}
                        focus={img.focus || d.imageFocus}
                        onFocusChange={(focus) => {
                          const next = [...images];
                          next[index] = { ...img, focus };
                          setData({ ...d, images: next });
                        }}
                        label="Slide photo"
                      />
                    </div>
                    <EText
                      as="p"
                      value={img.alt}
                      onChange={(alt) => {
                        const next = [...images];
                        next[index] = { ...img, alt };
                        setData({ ...d, images: next });
                      }}
                    />
                    <div className="ve-card-foot">
                      <button
                        type="button"
                        className="ve-remove"
                        onClick={() =>
                          setData({
                            ...d,
                            images: images.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Remove photo {index + 1}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="ve-add-btn ve-add-slide"
                onClick={() =>
                  setData({
                    ...d,
                    images: [...images, { id: newId("slide"), src: "", alt: "Application photo" }],
                  })
                }
              >
                + Add another photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ve-add-btn"
              onClick={() =>
                setData({
                  ...d,
                  images: [{ id: newId("slide"), src: "", alt: "Application photo" }],
                })
              }
            >
              + Add photo slideshow
            </button>
          )}
          <div className={images.length ? "panel-app-layout" : undefined}>
            <div>
              <div className="section-head">
                <OptionalEText
                  as="p"
                  className="eyebrow"
                  value={d.eyebrow || ""}
                  onChange={(eyebrow) => setData({ ...d, eyebrow })}
                  addLabel="+ Add small label above title"
                  seedValue="Label"
                />
                <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
                <OptionalEText
                  as="p"
                  className="section-lead"
                  value={d.lead || ""}
                  onChange={(lead) => setData({ ...d, lead })}
                  addLabel="+ Add intro line under title"
                  seedValue="Intro line"
                />
              </div>
              <ul className={images.length ? "panel-app-grid panel-app-grid-two" : "feature-list"}>
                {d.items.map((item, index) => (
                  <li key={index} className="ve-card">
                    <EText
                      as="span"
                      value={item}
                      onChange={(text) => {
                        const items = [...d.items];
                        items[index] = text;
                        setData({ ...d, items });
                      }}
                    />
                    <button
                      type="button"
                      className="ve-mini-btn"
                      onClick={() => setData({ ...d, items: d.items.filter((_, i) => i !== index) })}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="ve-add-btn"
                onClick={() => setData({ ...d, items: [...d.items, "New feature"] })}
              >
                + Feature
              </button>
            </div>
            {images.length ? (
              <div
                className="ve-slideshow-preview"
                data-photo-shape={d.imageAspect || "default"}
                style={imageAspectStyle(d.imageAspect) ?? { aspectRatio: "4 / 3" }}
                aria-hidden="true"
              >
                <span>On the live page, these photos rotate here</span>
              </div>
            ) : null}
          </div>
        </section>
      );
      break;
    }
    case "specsTable": {
      const d = section.data;
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <div className="section-head">
            <OptionalEText
              as="p"
              className="eyebrow"
              value={d.eyebrow || ""}
              onChange={(eyebrow) => setData({ ...d, eyebrow })}
              addLabel="+ Add small label above title"
              seedValue="Label"
            />
            <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
            <OptionalEText
              as="p"
              className="section-lead"
              value={d.lead || ""}
              onChange={(lead) => setData({ ...d, lead })}
              addLabel="+ Add intro line under title"
              seedValue="Intro line"
            />
          </div>
          <div className="ve-table-size-bar">
            <label>
              Rows
              <input
                type="number"
                min={1}
                max={12}
                value={d.rows.length}
                onChange={(e) => {
                  const n = clampTableSize(Number(e.target.value), d.rows.length);
                  const rows = Array.from({ length: n }, (_, i) => d.rows[i] || {
                    label: "Property",
                    value: "Value",
                  });
                  setData({ ...d, rows });
                }}
              />
            </label>
          </div>
          <div className="spec-table">
            {d.rows.map((row, index) => (
              <div className="spec-row ve-card" key={index}>
                <EText
                  as="strong"
                  value={row.label}
                  onChange={(label) => {
                    const rows = [...d.rows];
                    rows[index] = { ...row, label };
                    setData({ ...d, rows });
                  }}
                />
                <EText
                  as="span"
                  value={row.value}
                  onChange={(value) => {
                    const rows = [...d.rows];
                    rows[index] = { ...row, value };
                    setData({ ...d, rows });
                  }}
                />
                <button
                  type="button"
                  className="ve-mini-btn"
                  onClick={() => setData({ ...d, rows: d.rows.filter((_, i) => i !== index) })}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="ve-add-btn"
            onClick={() => setData({ ...d, rows: [...d.rows, { label: "Property", value: "Value" }] })}
          >
            + Row
          </button>
        </section>
      );
      break;
    }
    case "dataTable": {
      const d = section.data;
      const highlightIdx =
        typeof d.highlightRowIndex === "number" &&
        d.highlightRowIndex >= 0 &&
        d.highlightRowIndex < d.rows.length
          ? d.highlightRowIndex
          : null;
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <div className="section-head">
            <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
            <OptionalEText
              as="p"
              className="section-lead"
              value={d.lead || ""}
              onChange={(lead) => setData({ ...d, lead })}
              addLabel="+ Add intro line under title"
              seedValue="Intro line"
            />
          </div>
          <div className="ve-table-size-bar">
            <label>
              Columns
              <input
                type="number"
                min={1}
                max={12}
                value={d.headers.length}
                onChange={(e) =>
                  setData(resizeDataTable(d, Number(e.target.value), d.rows.length))
                }
              />
            </label>
            <label>
              Rows
              <input
                type="number"
                min={1}
                max={12}
                value={d.rows.length}
                onChange={(e) =>
                  setData(resizeDataTable(d, d.headers.length, Number(e.target.value)))
                }
              />
            </label>
            <label>
              Highlight row
              <select
                value={highlightIdx === null ? "" : String(highlightIdx)}
                onChange={(e) => {
                  const v = e.target.value;
                  setData({
                    ...d,
                    highlightRowIndex: v === "" ? null : Number(v),
                  });
                }}
              >
                <option value="">None</option>
                {d.rows.map((_, i) => (
                  <option key={i} value={i}>
                    Row {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <span className="ve-table-size-meta">
              {d.headers.length} × {d.rows.length}
            </span>
          </div>
          <p className="ve-hint">
            Edit cells below. Optionally highlight one row — it shows with emphasis on the public
            page.
          </p>
          <div className="ve-table-edit">
            <div className="ve-table-row ve-table-header-row">
              {d.headers.map((h, i) => (
                <input
                  key={i}
                  value={h}
                  onChange={(e) => {
                    const headers = [...d.headers];
                    headers[i] = e.target.value;
                    setData({ ...d, headers });
                  }}
                />
              ))}
              <span className="ve-table-row-actions" aria-hidden="true" />
            </div>
            {d.rows.map((row, ri) => {
              const isHighlighted = highlightIdx === ri;
              return (
                <div
                  className={`ve-table-row${isHighlighted ? " is-highlighted" : ""}`}
                  key={ri}
                >
                  {row.map((cell, ci) => (
                    <input
                      key={ci}
                      value={cell}
                      onChange={(e) => {
                        const rows = d.rows.map((r) => [...r]);
                        rows[ri][ci] = e.target.value;
                        setData({ ...d, rows });
                      }}
                    />
                  ))}
                  <div className="ve-table-row-actions">
                    <button
                      type="button"
                      className={`ve-mini-btn ve-highlight-btn${isHighlighted ? " is-active" : ""}`}
                      title={isHighlighted ? "Remove highlight" : "Highlight this row"}
                      aria-pressed={isHighlighted}
                      onClick={() =>
                        setData({
                          ...d,
                          highlightRowIndex: isHighlighted ? null : ri,
                        })
                      }
                    >
                      {isHighlighted ? "★" : "☆"}
                    </button>
                    <button
                      type="button"
                      className="ve-mini-btn"
                      title="Delete row"
                      onClick={() => {
                        const rows = d.rows.filter((_, i) => i !== ri);
                        let nextHighlight: number | null = highlightIdx;
                        if (highlightIdx === ri) nextHighlight = null;
                        else if (highlightIdx !== null && highlightIdx > ri) {
                          nextHighlight = highlightIdx - 1;
                        }
                        setData({ ...d, rows, highlightRowIndex: nextHighlight });
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="ve-add-btn"
            onClick={() => setData({ ...d, rows: [...d.rows, d.headers.map(() => "")] })}
          >
            + Row
          </button>
        </section>
      );
      break;
    }
    case "gallery": {
      const d = section.data;
      if (d.layout === "logoSlides") {
        const updateSlide = (index: number, patch: Partial<GalleryItem>) => {
          const items = [...d.items];
          items[index] = { ...items[index], ...patch };
          setData({ ...d, items });
        };
        const autoplay = d.slideshowAutoplay !== false;
        body = (
          <section className={`section section-compact ve-block pb-logo-slides ${nested ? "pb-nested" : ""}`}>
            <div className="section-head ve-optional-head">
              <OptionalEText
                as="p"
                className="eyebrow"
                value={d.eyebrow || ""}
                onChange={(eyebrow) => setData({ ...d, eyebrow })}
                addLabel="+ Add small label above title"
                seedValue="Label"
              />
              <OptionalEText
                as="h2"
                value={d.title || ""}
                onChange={(title) => setData({ ...d, title })}
                addLabel="+ Add title"
                seedValue="Our brand partners"
              />
            </div>
            {/* Exactly what visitors see */}
            <LogoSlideshow
              slides={d.items}
              label={d.title || d.eyebrow || "Logo slideshow"}
              intervalMs={resolveSlideshowIntervalMs(d.slideshowIntervalSec)}
              autoplay={autoplay}
            />
            <div className="ve-logo-slides-editor">
              <div className="ve-block-toolbar">
                <div className="ve-block-toolbar-row">
                  <span className="ve-placement-label">Show as</span>
                  <div className="ve-seg">
                    <button type="button" className="ve-seg-btn is-active">
                      Logo slideshow
                    </button>
                    <button
                      type="button"
                      className="ve-seg-btn"
                      onClick={() => setData({ ...d, layout: "logos" })}
                      title="Show every image as a separate tile instead"
                    >
                      Logo tiles
                    </button>
                  </div>
                  <label className="ve-logo-slides-autoplay">
                    <input
                      type="checkbox"
                      checked={autoplay}
                      onChange={(e) => setData({ ...d, slideshowAutoplay: e.target.checked })}
                    />
                    Play slides automatically
                  </label>
                </div>
                {autoplay ? (
                  <SlideshowIntervalControl
                    value={d.slideshowIntervalSec}
                    onChange={(slideshowIntervalSec) => setData({ ...d, slideshowIntervalSec })}
                  />
                ) : null}
                <p className="ve-toolbar-hint">
                  Each slide is one wide picture (for example several logos). It is shown whole,
                  never cropped. Visitors can use the arrows, dots or swipe; it pauses when hovered.
                </p>
              </div>
              <p className="ve-logo-slides-heading">
                Slides ({d.items.length}) — the text under each picture is shown as its caption
              </p>
              <ol className="ve-logo-slides-list">
                {d.items.map((item, index) => (
                  <li className="ve-logo-slides-item" key={item.id}>
                    <span className="ve-logo-slides-num">{index + 1}</span>
                    <SlidePicturePicker
                      value={item.src}
                      alt={item.alt}
                      onChange={(src) => updateSlide(index, { src })}
                    />
                    <div className="ve-logo-slides-caption">
                      <EText
                        as="p"
                        value={item.alt}
                        onChange={(alt) => updateSlide(index, { alt })}
                      />
                    </div>
                    <div className="ve-logo-slides-actions">
                      <button
                        type="button"
                        className="ve-move"
                        disabled={index === 0}
                        onClick={() => setData({ ...d, items: reorder(d.items, index, index - 1) })}
                        aria-label={`Move slide ${index + 1} earlier`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="ve-move"
                        disabled={index === d.items.length - 1}
                        onClick={() => setData({ ...d, items: reorder(d.items, index, index + 1) })}
                        aria-label={`Move slide ${index + 1} later`}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="ve-remove"
                        onClick={() => {
                          if (window.confirm(`Remove slide ${index + 1}?`)) {
                            setData({ ...d, items: d.items.filter((_, i) => i !== index) });
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="ve-add-btn"
                onClick={() =>
                  setData({
                    ...d,
                    items: [...d.items, { id: newId("g"), src: "", alt: "Slide caption" }],
                  })
                }
              >
                + Add slide
              </button>
            </div>
          </section>
        );
        break;
      }
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <OptionalEText
            as="h2"
            value={d.title || ""}
            onChange={(title) => setData({ ...d, title })}
            addLabel="+ Add gallery title"
            seedValue="Gallery"
          />
          <div className="ve-block-toolbar">
            <div className="ve-block-toolbar-row">
              <span className="ve-placement-label">Show as</span>
              <div className="ve-seg" title="How this gallery looks on the page">
                <button
                  type="button"
                  className={`ve-seg-btn ${(d.layout || "grid") === "grid" ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, layout: "grid" })}
                >
                  Photo grid
                </button>
                <button
                  type="button"
                  className={`ve-seg-btn ${d.layout === "slideshow" ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, layout: "slideshow" })}
                >
                  Slideshow
                </button>
                <button
                  type="button"
                  className={`ve-seg-btn ${d.layout === "logos" ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, layout: "logos" })}
                >
                  Logos
                </button>
                <button
                  type="button"
                  className={`ve-seg-btn ${d.layout === "pages" ? "is-active" : ""}`}
                  onClick={() => setData({ ...d, layout: "pages" })}
                >
                  Document pages
                </button>
                <button
                  type="button"
                  className="ve-seg-btn"
                  onClick={() => setData({ ...d, layout: "logoSlides" })}
                  title="Wide slides shown whole, e.g. several brand logos per slide"
                >
                  Logo slideshow
                </button>
              </div>
            </div>
            {d.layout === "logos" ? (
              <ImageAlignPicker
                value={d.imageAlign}
                onChange={(imageAlign) => setData({ ...d, imageAlign })}
              />
            ) : (
              <ImageAspectPicker
                compact
                value={d.imageAspect}
                onChange={(imageAspect) => setData({ ...d, imageAspect })}
              />
            )}
            <p className="ve-toolbar-hint">
              {d.layout === "logos"
                ? "Logos sit whole in the tile — adjust position if a mark looks off-centre."
                : d.layout === "pages"
                  ? "Auto = large full photo (same as live). Wide/Square/Tall change the frame shape itself."
                  : "Photo shape crops inside the frame. One-column galleries match live size."}
            </p>
          </div>
          {d.layout === "slideshow" ? (
            <SlideshowIntervalControl
              value={d.slideshowIntervalSec}
              onChange={(slideshowIntervalSec) => setData({ ...d, slideshowIntervalSec })}
            />
          ) : null}
          <div className={`pb-gallery ${gridClass(section.columns || 3)}`}>
            {d.items.map((item, index) => (
              <div
                className={`ve-card ve-slide-card${
                  d.layout === "pages"
                    ? " is-pages-layout"
                    : d.layout === "logos"
                      ? ""
                      : " is-grid-layout"
                }`}
                key={item.id}
              >
                <div
                  className={`ve-slide-frame${
                    d.layout === "logos"
                      ? " about-figure-logo"
                      : " pb-photo-frame"
                  }${
                    d.layout === "pages"
                      ? " is-pages-frame"
                      : d.layout === "logos"
                        ? ""
                        : " is-grid-frame"
                  }`}
                  data-align={d.layout === "logos" ? d.imageAlign || "center" : undefined}
                  data-photo-shape={
                    d.layout === "logos" ? undefined : d.imageAspect || "auto"
                  }
                  style={
                    d.layout === "logos"
                      ? undefined
                      : d.layout === "pages"
                        ? imageAspectStyle(d.imageAspect)
                        : // 1-col Auto: no forced ratio (sit whole under CSS cap).
                          // Multi-col without shape: default wide cell. Shapes use imageAspectStyle.
                          imageAspectStyle(d.imageAspect) ??
                          ((section.columns || 3) <= 1 ? undefined : { aspectRatio: "2 / 1" })
                  }
                >
                  <EImage
                    value={item.src}
                    onChange={(src) => {
                      const items = [...d.items];
                      items[index] = { ...item, src };
                      setData({ ...d, items });
                    }}
                    focus={item.focus}
                    onFocusChange={(focus) => {
                      const items = [...d.items];
                      items[index] = { ...item, focus };
                      setData({ ...d, items });
                    }}
                  />
                </div>
                <EText
                  as="p"
                  value={item.alt}
                  onChange={(alt) => {
                    const items = [...d.items];
                    items[index] = { ...item, alt };
                    setData({ ...d, items });
                  }}
                />
                <div className="ve-card-foot">
                  <button
                    type="button"
                    className="ve-remove"
                    onClick={() => setData({ ...d, items: d.items.filter((_, i) => i !== index) })}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="ve-add-btn"
            onClick={() =>
              setData({ ...d, items: [...d.items, { id: newId("g"), src: "", alt: "Caption" }] })
            }
          >
            + Image
          </button>
        </section>
      );
      break;
    }
    case "jointDetails": {
      const d = section.data;
      const pages = d.pages || [];
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <p className="ve-btns-toggle-meta">
            Visitors click “Show joint details” to expand diagrams on the live page
          </p>
          <div className="panel-joint ve-joint-edit">
            <div className="panel-joint-summary">
              <div className="section-head panel-joint-head">
                <OptionalEText
                  as="p"
                  className="eyebrow"
                  value={d.eyebrow || ""}
                  onChange={(eyebrow) => setData({ ...d, eyebrow })}
                  addLabel="+ Add small label above title"
                  seedValue="Label"
                />
                <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
                <EText
                  as="p"
                  className="section-lead"
                  multiline
                  value={d.summary}
                  onChange={(summary) => setData({ ...d, summary })}
                />
              </div>
              <EText
                as="span"
                className="panel-joint-toggle"
                value={d.toggleLabel || "Show joint details"}
                onChange={(toggleLabel) => setData({ ...d, toggleLabel })}
              />
            </div>
            <div className="panel-joint-body">
              <EText as="p" multiline value={d.body} onChange={(body) => setData({ ...d, body })} />
              <figure className="panel-joint-figure">
                <EImage
                  value={d.image}
                  onChange={(image) => setData({ ...d, image })}
                  label="Main joint diagram"
                />
                <EText
                  as="p"
                  value={d.imageAlt}
                  onChange={(imageAlt) => setData({ ...d, imageAlt })}
                />
              </figure>
              <div className="panel-joint-pages">
                {pages.map((page, index) => (
                  <figure className="panel-joint-page ve-card" key={page.id}>
                    <EText
                      as="h3"
                      value={page.title}
                      onChange={(title) => {
                        const next = [...pages];
                        next[index] = { ...page, title };
                        setData({ ...d, pages: next });
                      }}
                    />
                    <EText
                      as="p"
                      value={page.lead || ""}
                      onChange={(lead) => {
                        const next = [...pages];
                        next[index] = { ...page, lead };
                        setData({ ...d, pages: next });
                      }}
                    />
                    <EImage
                      value={page.src}
                      onChange={(src) => {
                        const next = [...pages];
                        next[index] = { ...page, src };
                        setData({ ...d, pages: next });
                      }}
                      label="Diagram photo"
                    />
                    <div className="ve-card-foot">
                      <button
                        type="button"
                        className="ve-remove"
                        onClick={() =>
                          setData({ ...d, pages: pages.filter((_, i) => i !== index) })
                        }
                      >
                        Remove diagram
                      </button>
                    </div>
                  </figure>
                ))}
              </div>
              <button
                type="button"
                className="ve-add-btn"
                onClick={() =>
                  setData({
                    ...d,
                    pages: [
                      ...pages,
                      { id: newId("jp"), title: "Diagram", lead: "", src: "", alt: "Joint diagram" },
                    ],
                  })
                }
              >
                + Diagram page
              </button>
            </div>
          </div>
        </section>
      );
      break;
    }
    case "contactCta": {
      const d = section.data;
      const fields = resolveContactFields(d);
      function setFields(next: ContactField[]) {
        setData({
          ...d,
          fields: next,
          email: undefined,
          phone: undefined,
          whatsapp: undefined,
        });
      }
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <div className="home-contact-teaser">
            <div>
              <OptionalEText
                as="p"
                className="eyebrow"
                value={d.eyebrow || ""}
                onChange={(eyebrow) => setData({ ...d, eyebrow })}
                addLabel="+ Add small label above title"
                seedValue="Label"
              />
              <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
              <EText as="p" multiline value={d.body} onChange={(body) => setData({ ...d, body })} />
              <ul className="contact-meta ve-contact-meta-edit">
                {fields.map((field, index) => (
                  <li key={field.id}>
                    <input
                      className="ve-contact-field-label"
                      value={field.label}
                      aria-label="Field label"
                      placeholder="Label"
                      onChange={(e) => {
                        const next = [...fields];
                        next[index] = { ...field, label: e.target.value };
                        setFields(next);
                      }}
                    />
                    <input
                      value={field.value}
                      aria-label="Field value"
                      placeholder="Value"
                      onChange={(e) => {
                        const next = [...fields];
                        next[index] = { ...field, value: e.target.value };
                        setFields(next);
                      }}
                    />
                    <button
                      type="button"
                      className="ve-mini-btn"
                      title="Remove field"
                      onClick={() => setFields(fields.filter((_, i) => i !== index))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="ve-add-btn"
                onClick={() =>
                  setFields([
                    ...fields,
                    { id: newId("cf"), label: "New field", value: "" },
                  ])
                }
              >
                + Add field
              </button>
            </div>
          </div>
        </section>
      );
      break;
    }
    case "callout": {
      const d = section.data;
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <div className="about-highlight pb-callout">
            <EText as="strong" value={d.title || ""} onChange={(title) => setData({ ...d, title })} />
            <EText as="p" multiline value={d.body} onChange={(body) => setData({ ...d, body })} />
          </div>
        </section>
      );
      break;
    }
    case "stats": {
      const d = section.data;
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <ul className="profile-stats">
            {d.items.map((item, index) => (
              <li key={item.id} className="ve-card">
                <EText
                  as="strong"
                  value={item.value}
                  onChange={(value) => {
                    const items = [...d.items];
                    items[index] = { ...item, value };
                    setData({ ...d, items });
                  }}
                />
                <EText
                  as="span"
                  value={item.label}
                  onChange={(label) => {
                    const items = [...d.items];
                    items[index] = { ...item, label };
                    setData({ ...d, items });
                  }}
                />
                <button
                  type="button"
                  className="ve-mini-btn"
                  onClick={() => setData({ ...d, items: d.items.filter((_, i) => i !== index) })}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="ve-add-btn"
            onClick={() =>
              setData({
                ...d,
                items: [...d.items, { id: newId("s"), value: "—", label: "Label" }],
              })
            }
          >
            + Stat
          </button>
        </section>
      );
      break;
    }
    case "tabs":
      body = (
        <TabsEditor
          section={section}
          onChange={onChange}
          nested={nested}
          sectionTargets={sectionTargets}
          sitePages={sitePages}
        />
      );
      break;
    default:
      body = null;
      break;
  }

  return (
    <div
      className={`ve-section-stack${selected ? " is-selected" : ""}${nested ? " is-nested" : ""}`}
      data-section-id={section.id}
      onClick={(e) => {
        const nearest = (e.target as HTMLElement).closest("[data-section-id]");
        if (nearest !== e.currentTarget) return;
        selectSection(section.id);
      }}
      onFocusCapture={(e) => {
        const nearest = (e.target as HTMLElement).closest("[data-section-id]");
        if (nearest !== e.currentTarget) return;
        selectSection(section.id);
      }}
    >
      <div className={`ve-section-chrome-label${selected ? " is-editing" : ""}`}>
        {selected ? `Editing: ${typeLabel}` : typeLabel}
      </div>
      {body}
      {selected ? (
        <div className={`ve-section-footer${section.type === "hero" ? " is-after-hero" : ""}`}>
          {toolbar}
          {section.type === "hero" ? (
            <VeilStrengthControl
              value={section.data.veilStrength}
              onChange={(veilStrength) => setData({ ...section.data, veilStrength })}
            />
          ) : (
            buttonsEditor
          )}
          {noteEditor}
        </div>
      ) : null}
    </div>
  );
}

function TabsEditor({
  section,
  onChange,
  sectionTargets,
  sitePages = SITE_PAGES,
}: {
  section: Extract<PageSection, { type: "tabs" }>;
  onChange: (s: PageSection) => void;
  nested?: boolean;
  sectionTargets?: { id: string; label: string }[];
  sitePages?: SitePage[];
}) {
  const d = section.data;
  const [active, setActive] = useState(d.tabs[0]?.id || "");
  const setData = (data: TabsSectionData) => onChange({ ...section, data });
  const current = d.tabs.find((t) => t.id === active) || d.tabs[0];

  function updateTabSections(sections: PageSection[]) {
    if (!current) return;
    setData({
      ...d,
      tabs: d.tabs.map((t) => (t.id === current.id ? { ...t, sections } : t)),
    });
  }

  return (
    <section className="section section-compact ve-block pb-tabs">
      <div className="section-head">
        <EText as="h2" value={d.title || ""} onChange={(title) => setData({ ...d, title })} />
      </div>
      <div className="pb-tablist">
        {d.tabs.map((tab, index) => (
          <span key={tab.id} className="ve-tab-edit">
            <button
              type="button"
              className={`pb-tab ${tab.id === current?.id ? "is-active" : ""}`}
              onClick={() => setActive(tab.id)}
            >
              <EText
                as="span"
                value={tab.label}
                onChange={(label) => {
                  const tabs = [...d.tabs];
                  tabs[index] = { ...tab, label };
                  setData({ ...d, tabs });
                }}
              />
            </button>
            <button
              type="button"
              className="ve-mini-btn"
              onClick={() => {
                const tabs = d.tabs.filter((_, i) => i !== index);
                setData({ ...d, tabs });
                if (active === tab.id) setActive(tabs[0]?.id || "");
              }}
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          className="ve-add-btn"
          onClick={() => {
            const tab = {
              id: newId("tab"),
              label: "New tab",
              sections: [createEmptySection("richText")],
            };
            setData({ ...d, tabs: [...d.tabs, tab] });
            setActive(tab.id);
          }}
        >
          + Tab
        </button>
      </div>
      {current ? (
        <div className="pb-tabpanel">
          <SectionList
            sections={current.sections}
            onChange={updateTabSections}
            allowTabs={false}
            nested
            sectionTargets={sectionTargets}
            sitePages={sitePages}
          />
        </div>
      ) : null}
    </section>
  );
}

function SectionList({
  sections,
  onChange,
  allowTabs = true,
  nested,
  sectionTargets,
  sitePages = SITE_PAGES,
}: {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
  allowTabs?: boolean;
  nested?: boolean;
  sectionTargets?: { id: string; label: string }[];
  sitePages?: SitePage[];
}) {
  const { selectedSectionId, selectSection } = useSectionSelection();
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [pendingTable, setPendingTable] = useState<"dataTable" | "specsTable" | null>(null);
  const [tableCols, setTableCols] = useState(3);
  const [tableRows, setTableRows] = useState(3);

  const allowed = allowTabs
    ? ADDABLE_SECTION_TYPES
    : ADDABLE_SECTION_TYPES.filter((t) => t !== "tabs");
  function patch(index: number, section: PageSection) {
    const next = [...sections];
    next[index] = section;
    onChange(next);
  }

  function insertSection(type: SectionType, at: number) {
    if (type === "dataTable" || type === "specsTable") {
      setPendingTable(type);
      setTableCols(3);
      setTableRows(type === "specsTable" ? 4 : 3);
      return;
    }
    const next = [...sections];
    // Page banners always go first so they sit at the top of the page
    const insertAt = type === "hero" ? 0 : at;
    const created = createEmptySection(type);
    next.splice(insertAt, 0, created);
    onChange(next);
    selectSection(created.id);
    setInsertAt(null);
    setPendingTable(null);
  }

  function confirmTableInsert(at: number) {
    const section =
      pendingTable === "specsTable"
        ? createSpecsTableSection(tableRows)
        : createDataTableSection(tableCols, tableRows);
    const next = [...sections];
    next.splice(at, 0, section);
    onChange(next);
    selectSection(section.id);
    setInsertAt(null);
    setPendingTable(null);
  }

  function BlockPreview({ type }: { type: SectionType }) {
    return (
      <span className={`ve-block-preview ve-block-preview--${type}`} aria-hidden="true">
        <span className="ve-block-preview-inner" />
      </span>
    );
  }

  function TypeChoices({ list, at }: { list: SectionType[]; at: number }) {
    return (
      <div className="ve-section-picker ve-section-picker-visual">
        {list.map((type: SectionType) => (
          <button
            key={type}
            type="button"
            className="ve-section-choice ve-section-choice-visual"
            onClick={() => insertSection(type, at)}
          >
            <BlockPreview type={type} />
            <span className="ve-section-choice-copy">
              <strong>{SECTION_TYPE_LABELS[type]}</strong>
              <span>{SECTION_TYPE_HELP[type]}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  function GroupedTypeChoices({ at }: { at: number }) {
    const groups = SECTION_TYPE_GROUPS.map((group) => ({
      ...group,
      types: group.types.filter((t) => allowed.includes(t)),
    })).filter((group) => group.types.length > 0);

    return (
      <div className="ve-section-groups">
        {groups.map((group) => (
          <section key={group.id} className="ve-section-group">
            <header className="ve-section-group-head">
              <h3>{group.label}</h3>
              <p>{group.hint}</p>
            </header>
            <TypeChoices list={group.types} at={at} />
          </section>
        ))}
      </div>
    );
  }

  function InsertPicker({
    at,
    label,
    prominent,
  }: {
    at: number;
    label: string;
    prominent?: boolean;
  }) {
    if (insertAt !== at) {
      return (
        <div className={`ve-insert-slot${prominent ? " is-prominent" : " is-mid"}`}>
          <button
            type="button"
            className="ve-insert-btn"
            onClick={(e) => {
              // Read the slot now — React clears e.currentTarget before the next frame
              const slot = e.currentTarget.closest(".ve-insert-slot") as HTMLElement | null;
              setPendingTable(null);
              setInsertAt(at);
              // Keep the picker clear of the sticky admin bar
              requestAnimationFrame(() => {
                slot?.scrollIntoView({
                  block: "center",
                  behavior: "smooth",
                });
              });
            }}
          >
            {label}
          </button>
        </div>
      );
    }

    if (pendingTable) {
      const isData = pendingTable === "dataTable";
      return (
        <div className="ve-add-section ve-insert-picker">
          <p className="ve-insert-hint">
            {isData
              ? "Choose how many columns and rows for the table"
              : "Choose how many rows for the label–value list"}
          </p>
          <div className="ve-table-size-bar ve-table-size-setup">
            {isData ? (
              <label>
                Columns
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={tableCols}
                  onChange={(e) => setTableCols(clampTableSize(Number(e.target.value), 3))}
                />
              </label>
            ) : null}
            <label>
              Rows
              <input
                type="number"
                min={1}
                max={12}
                value={tableRows}
                onChange={(e) => setTableRows(clampTableSize(Number(e.target.value), 3))}
              />
            </label>
          </div>
          <div className="ve-table-size-actions">
            <button type="button" className="btn btn-primary" onClick={() => confirmTableInsert(at)}>
              Add table
            </button>
            <button type="button" className="ve-mini-btn" onClick={() => setPendingTable(null)}>
              Back
            </button>
            <button
              type="button"
              className="ve-mini-btn"
              onClick={() => {
                setInsertAt(null);
                setPendingTable(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="ve-add-section ve-insert-picker ve-insert-picker-visual">
        <p className="ve-insert-hint">Choose a block to add — grouped with a small preview of each type</p>
        <GroupedTypeChoices at={at} />
        <button
          type="button"
          className="ve-mini-btn"
          onClick={() => {
            setInsertAt(null);
                    setPendingTable(null);
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <>
      <InsertPicker at={0} label="+ Add a block at the top" prominent />
      {sections.map((section, index) => {
        const nearSelected =
          section.id === selectedSectionId ||
          (index > 0 && sections[index - 1]?.id === selectedSectionId) ||
          sections[index + 1]?.id === selectedSectionId;
        const isLast = index === sections.length - 1;
        return (
          <div key={section.id}>
            <EditableSection
              section={section}
              nested={nested}
              sectionTargets={sectionTargets}
              sitePages={sitePages}
              onChange={(s) => patch(index, s)}
              onMoveUp={() => onChange(reorder(sections, index, index - 1))}
              onMoveDown={() => onChange(reorder(sections, index, index + 1))}
              onDuplicate={() => {
                const copy = structuredClone(section);
                copy.id = newId(section.type);
                const next = [...sections];
                next.splice(index + 1, 0, copy);
                onChange(next);
                selectSection(copy.id);
              }}
              onDelete={() => {
                if (selectedSectionId === section.id) selectSection(null);
                onChange(sections.filter((_, i) => i !== index));
              }}
            />
            <InsertPicker
              at={index + 1}
              label={isLast ? "+ Add a block at the bottom" : "+ Add a block here"}
              prominent={isLast || nearSelected}
            />
          </div>
        );
      })}
    </>
  );
}

function PageSwitcher({ currentId, pages }: { currentId: string; pages: SitePage[] }) {
  const [open, setOpen] = useState(false);
  const groups = ["Home", "About", "Products", "Other"] as const;
  const current = pages.find((p) => p.id === currentId);

  return (
    <div className={`ve-page-menu${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="ve-page-menu-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ve-page-select-label">Switch page</span>
        <span className="ve-page-menu-current">{current?.label || currentId}</span>
      </button>
      {open ? (
        <>
          <button type="button" className="ve-page-menu-backdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="ve-page-menu-panel" role="listbox">
            <p className="ve-page-menu-intro">Pick which page to edit</p>
            {groups.map((group) => {
              const groupPages = pages.filter((p: SitePage) => p.group === group);
              if (!groupPages.length) return null;
              return (
                <div key={group} className="ve-page-menu-group">
                  <p className="ve-page-menu-group-label">{group}</p>
                  {groupPages.map((page) => (
                    <a
                      key={page.id}
                      role="option"
                      aria-selected={page.id === currentId}
                      href={adminEditHref(page.id)}
                      className={page.id === currentId ? "is-active" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {page.label}
                      {page.custom ? " (new)" : ""}
                    </a>
                  ))}
                </div>
              );
            })}
            <div className="ve-page-menu-group">
              <a href="/admin/nav" className="ve-page-menu-create" onClick={() => setOpen(false)}>
                + Create a new empty page…
              </a>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

const HISTORY_LIMIT = 50;

function cloneDoc(doc: PageDocument): PageDocument {
  return structuredClone(doc);
}

export function VisualPageEditor({
  pageId,
  pageLabel: _pageLabel,
  livePath,
  initial,
  initialNav,
  sitePages = SITE_PAGES,
}: {
  pageId: string;
  pageLabel: string;
  livePath: string;
  initial: PageDocument;
  initialNav?: import("@/lib/types").NavItem[];
  sitePages?: SitePage[];
}) {
  const [doc, setDoc] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [past, setPast] = useState<PageDocument[]>([]);
  const [future, setFuture] = useState<PageDocument[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideFocus, setGuideFocus] = useState("start");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const selectSection = useCallback((id: string | null) => {
    setSelectedSectionId(id);
  }, []);
  const dirtyRef = useRef(false);
  const docRef = useRef(doc);
  const pastRef = useRef(past);
  const futureRef = useRef(future);
  docRef.current = doc;
  pastRef.current = past;
  futureRef.current = future;
  dirtyRef.current = dirty;

  useEffect(() => {
    try {
      if (window.localStorage.getItem("ve-hide-howto") === "1") setShowTip(false);
      // First visit: open Help once, focused on Start here
      if (window.localStorage.getItem("ve-opened-guide-once") !== "1") {
        setGuideFocus("start");
        setGuideOpen(true);
        window.localStorage.setItem("ve-opened-guide-once", "1");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  function dismissTip() {
    setShowTip(false);
    try {
      window.localStorage.setItem("ve-hide-howto", "1");
    } catch {
      /* ignore */
    }
  }

  function showQuickTips() {
    setShowTip(true);
    try {
      window.localStorage.removeItem("ve-hide-howto");
    } catch {
      /* ignore */
    }
  }

  function openHelp(chapter = "start") {
    setGuideFocus(chapter);
    setGuideOpen(true);
  }

  function update(next: PageDocument) {
    setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), cloneDoc(docRef.current)]);
    setFuture([]);
    setDoc(next);
    setDirty(true);
    setMessage("");
  }

  function undo() {
    const stack = pastRef.current;
    if (!stack.length) return;
    const prev = stack[stack.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [...f, cloneDoc(docRef.current)]);
    setDoc(prev);
    setDirty(true);
    setMessage("");
  }

  function redo() {
    const stack = futureRef.current;
    if (!stack.length) return;
    const next = stack[stack.length - 1];
    setFuture((f) => f.slice(0, -1));
    setPast((p) => [...p, cloneDoc(docRef.current)]);
    setDoc(next);
    setDirty(true);
    setMessage("");
  }

  useEffect(() => {
    function onSelectSection(e: Event) {
      const detail = (e as CustomEvent<{ id?: string }>).detail;
      if (detail?.id) setSelectedSectionId(detail.id);
    }
    window.addEventListener("ve-select-section", onSelectSection as EventListener);
    return () => window.removeEventListener("ve-select-section", onSelectSection as EventListener);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedSectionId(null);
        setMoreOpen(false);
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, document: doc }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Could not save. Are you still logged in?");
      return;
    }
    setDirty(false);
    setMessage("Saved — refresh the live page to see it");
  }

  const settings = defaultHomeContent.settings;
  const footer = { ...defaultHomeContent.footer, tagline: doc.title };
  const liveNav = initialNav?.length ? initialNav : SITE_NAV;
  const editNav = navItemsForAdminEdit(liveNav, sitePages);
  const sectionsEditor = (
    <SectionList
      sections={doc.sections}
      onChange={(sections) => update({ ...doc, sections })}
      sectionTargets={collectSectionJumpTargets(doc.sections)}
      sitePages={sitePages}
    />
  );

  const selectionValue = { selectedSectionId, selectSection };

  return (
    <SectionSelectionContext.Provider value={selectionValue}>
    <div
      className={`ve-root ve-root-site${showTip ? " has-howto" : ""}`}
      onMouseDown={(e) => {
        const t = e.target as HTMLElement;
        if (
          t.closest(
            "[data-section-id], .ve-insert-slot, .ve-edit-bar, .ve-howto, .ve-more, .ve-page-menu, .ag-panel, .ag-backdrop, .ve-section-picker, .ve-section-groups",
          )
        ) {
          return;
        }
        selectSection(null);
      }}
    >
      <div className="ve-edit-bar">
        <div className="ve-edit-bar-left">
          <span className="ve-edit-pill">Admin</span>
          <PageSwitcher currentId={pageId} pages={sitePages} />
        </div>
        <div className="ve-toolbar-actions">
          {dirty ? (
            <span className="ve-dirty" title="Visitors still see the last saved version">
              Not saved yet — visitors still see the old page
            </span>
          ) : null}
          {message ? <span className="ve-msg">{message}</span> : null}
          {/* Full page load on purpose: the browser's "unsaved changes" prompt must still fire. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="ve-tool-btn ve-bar-link is-dashboard" href="/admin/dashboard" title="See visitor statistics">
            Dashboard
          </a>
          <AdminGuideButton onClick={() => openHelp("start")} />
          <span className="ve-tool-group ve-history-group" role="group" aria-label="History">
            <button
              type="button"
              className="ve-tool-btn"
              onClick={undo}
              disabled={!past.length}
              title="Undo last change"
            >
              Undo
            </button>
            <button
              type="button"
              className="ve-tool-btn"
              onClick={redo}
              disabled={!future.length}
              title="Redo"
            >
              Redo
            </button>
          </span>
          <button
            className={`btn btn-primary ve-bar-btn ve-save-btn${dirty ? " is-dirty" : ""}`}
            type="button"
            onClick={save}
            disabled={saving}
            title={dirty ? "Publish your edits to the live website" : "Save this page"}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <div className={`ve-more${moreOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="btn btn-ghost ve-bar-btn"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
            >
              More
            </button>
            {moreOpen ? (
              <>
                <button
                  type="button"
                  className="ve-more-backdrop"
                  aria-label="Close"
                  onClick={() => setMoreOpen(false)}
                />
                <div className="ve-more-panel">
                  <button type="button" className="ve-more-item" onClick={undo} disabled={!past.length}>
                    Undo last change
                  </button>
                  <button type="button" className="ve-more-item" onClick={redo} disabled={!future.length}>
                    Redo
                  </button>
                  <button
                    type="button"
                    className="ve-more-item"
                    onClick={() => {
                      setMoreOpen(false);
                      openHelp("start");
                    }}
                  >
                    Help
                  </button>
                  <button
                    type="button"
                    className="ve-more-item"
                    onClick={() => {
                      setMoreOpen(false);
                      showQuickTips();
                    }}
                  >
                    Show quick tips
                  </button>
                  <a className="ve-more-item" href="/admin/nav" onClick={() => setMoreOpen(false)}>
                    Edit website menu
                  </a>
                  <a className="ve-more-item" href="/admin/catalogues" onClick={() => setMoreOpen(false)}>
                    Catalogues & brochures
                  </a>
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                  <a className="ve-more-item" href="/admin/dashboard" onClick={() => setMoreOpen(false)}>
                    Analytics dashboard
                  </a>
                  <a
                    className="ve-more-item"
                    href={livePath}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMoreOpen(false)}
                  >
                    View live page
                  </a>
                  <div className="ve-more-logout">
                    <LogoutButton className="ve-bar-btn" />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {showTip ? (
        <div className="ve-howto" role="region" aria-label="Quick start">
          <div className="ve-howto-main">
            <strong className="ve-howto-title">Quick start</strong>
            <p className="ve-howto-one-liner">
              Click a section to edit it. Change text or photos. Then <strong>Save changes</strong>.
            </p>
          </div>
          <div className="ve-howto-actions">
            <button
              type="button"
              className="ve-howto-dismiss"
              onClick={() => {
                openHelp("start");
              }}
            >
              Open help
            </button>
            <button type="button" className="ve-howto-dismiss is-primary" onClick={dismissTip}>
              Got it
            </button>
          </div>
        </div>
      ) : null}

      <AdminGuide
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        focusChapter={guideFocus}
      />

      {doc.chrome === "about" && doc.about ? (
        <AboutShell
          title={doc.title}
          crumbs={doc.about.crumbs}
          activeHref={doc.about.activeHref}
          image={doc.about.image}
          eyebrow={doc.about.eyebrow || "About Us"}
          brand={doc.about.brand}
          lead={doc.about.lead}
          navItems={liveNav}
          mapHref={livePathToAdminEdit}
          heroLabel={
            <div className="ve-section-label">
              Page banner — drag the photo to move it
            </div>
          }
          heroTools={
            <div className="ve-hero-tools ve-about-veil-tools">
              <VeilStrengthControl
                value={doc.about.veilStrength}
                onChange={(veilStrength) =>
                  update({
                    ...doc,
                    about: { ...doc.about!, veilStrength },
                  })
                }
              />
            </div>
          }
          mediaSlot={
            <EImage
              className="ve-about-hero-bg"
              value={doc.about.image || ""}
              onChange={(image) =>
                update({
                  ...doc,
                  about: { ...doc.about!, image },
                })
              }
              focus={doc.about.imageFocus}
              onFocusChange={(imageFocus) =>
                update({
                  ...doc,
                  about: { ...doc.about!, imageFocus },
                })
              }
              label="Banner background photo"
              underChrome={
                <div
                  className="about-hero-veil"
                  style={{ opacity: veilOpacity(doc.about.veilStrength) }}
                />
              }
            />
          }
          brandSlot={
            <EText
              as="p"
              className="hero-brand"
              value={doc.about.brand || "United Panel-System"}
              onChange={(brand) =>
                update({
                  ...doc,
                  about: { ...doc.about!, brand },
                })
              }
            />
          }
          eyebrowSlot={
            <EText
              as="p"
              className="eyebrow"
              value={doc.about.eyebrow || "About Us"}
              onChange={(eyebrow) =>
                update({
                  ...doc,
                  about: { ...doc.about!, eyebrow },
                })
              }
            />
          }
          titleSlot={
            <EText
              as="h1"
              value={doc.title}
              onChange={(title) => {
                const crumbs = [...(doc.about?.crumbs || [])];
                if (crumbs.length > 0) {
                  const last = crumbs.length - 1;
                  crumbs[last] = { ...crumbs[last], label: title };
                }
                update({
                  ...doc,
                  title,
                  about: doc.about ? { ...doc.about, crumbs } : doc.about,
                });
              }}
            />
          }
          leadSlot={
            <EText
              as="p"
              className="about-hero-lead"
              value={
                doc.about.lead ||
                "Add a short supporting line for this About page banner."
              }
              onChange={(lead) =>
                update({
                  ...doc,
                  about: { ...doc.about!, lead },
                })
              }
            />
          }
        >
          {sectionsEditor}
        </AboutShell>
      ) : (
        <>
          <SiteHeader settings={settings} navItems={editNav} brandHref={livePathToAdminEdit("/")} />
          <main>{sectionsEditor}</main>
          <SiteFooter footer={footer} />
        </>
      )}
    </div>
    </SectionSelectionContext.Provider>
  );
}
