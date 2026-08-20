"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  CardItem,
  HeroButton,
  PageDocument,
  PageSection,
  SectionColumns,
  SectionType,
  TabsSectionData,
} from "@/lib/page-document";
import {
  ADDABLE_SECTION_TYPES,
  ADVANCED_SECTION_TYPES,
  COMMON_SECTION_TYPES,
  SECTION_TYPE_HELP,
  SECTION_TYPE_LABELS,
  clampTableSize,
  collectSectionJumpTargets,
  createDataTableSection,
  createEmptySection,
  createSpecsTableSection,
  imageAspectStyle,
  newId,
  resizeDataTable,
  resolveContactFields,
  resolveSectionButtons,
  resolveSectionNote,
} from "@/lib/page-document";
import type { ContactField } from "@/lib/page-document";
import { adminEditHref, livePathToAdminEdit, navItemsForAdminEdit, SITE_PAGES, type SitePage } from "@/lib/pages";
import { SITE_NAV } from "@/lib/nav";
import { defaultHomeContent } from "@/lib/defaults";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AboutShell } from "@/components/site/AboutShell";
import { LogoutButton } from "./LogoutButton";
import { EImage, EText } from "./visual/Editable";
import { ImageAspectPicker } from "./visual/ImageAspectPicker";
import { SlideshowIntervalControl } from "./visual/SlideshowIntervalControl";
import { SectionButtonsEditor } from "./visual/SectionButtons";
import { PageLinkField } from "./visual/PageLinkField";

function reorder<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
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
          <span className="ve-tool-group" title="How many across">
            <span className="ve-tool-group-label">Layout</span>
            {([1, 2, 3] as SectionColumns[]).map((c) => (
              <button
                key={c}
                type="button"
                className={`ve-tool-btn ${(columns || 1) === c ? "is-active" : ""}`}
                onClick={() => onColumns(c)}
              >
                {c} across
              </button>
            ))}
          </span>
        ) : null}
        <span className="ve-tool-group">
          <button type="button" className="ve-tool-btn" onClick={onMoveUp} title="Move this block up">
            ↑ Up
          </button>
          <button type="button" className="ve-tool-btn" onClick={onMoveDown} title="Move this block down">
            ↓ Down
          </button>
          <button type="button" className="ve-tool-btn" onClick={onDuplicate} title="Make a copy of this block">
            Duplicate
          </button>
        </span>
        <button type="button" className="ve-tool-btn is-danger" onClick={confirmDelete} title="Remove this block">
          Remove
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
  const setData = <T,>(data: T) => onChange({ ...section, data } as PageSection);
  const setColumns = (columns: SectionColumns) => onChange({ ...section, columns });
  const canColumns = ["cardGrid", "gallery", "featureList"].includes(section.type);
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
              label="Click to add banner photo"
            />
            <div className="hero-veil" />
          </div>
          <div className="hero-content">
            <EText as="p" className="hero-brand" value={d.brand} onChange={(brand) => setData({ ...d, brand })} />
            <EText as="h1" value={d.headline} onChange={(headline) => setData({ ...d, headline })} />
            {d.tagline !== undefined ? (
              <EText
                as="p"
                className="hero-tagline"
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
      body = (
        <section className="proof ve-block">
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
                  onClick={() => setData({ items: d.items.filter((_, i) => i !== index) })}
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
              setData({
                items: [
                  ...d.items,
                  {
                    id: newId("p"),
                    index: String(d.items.length + 1).padStart(2, "0"),
                    title: "New highlight",
                    text: "Short description",
                  },
                ],
              })
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
            <EText
              as="p"
              className="eyebrow"
              value={d.eyebrow || ""}
              onChange={(eyebrow) => setData({ ...d, eyebrow })}
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
          <EImage
            value={d.image || ""}
            onChange={(image) => setData({ ...d, image })}
            focus={d.imageFocus}
            onFocusChange={(imageFocus) => setData({ ...d, imageFocus })}
            label="Optional image"
          />
          {d.image ? (
            <ImageAspectPicker
              value={d.imageAspect}
              onChange={(imageAspect) => setData({ ...d, imageAspect })}
            />
          ) : null}
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
          <div className="ve-tool-group ve-placement-bar" title="Photo placement">
            <span className="ve-placement-label">Layout</span>
            <button
              type="button"
              className={`ve-tool-btn ${!photoRight ? "is-active" : ""}`}
              onClick={() => setData({ ...d, imageSide: "left" })}
            >
              Photo left · Text right
            </button>
            <button
              type="button"
              className={`ve-tool-btn ${photoRight ? "is-active" : ""}`}
              onClick={() => setData({ ...d, imageSide: "right" })}
            >
              Text left · Photo right
            </button>
          </div>
          <div className="ve-tool-group ve-placement-bar" title="Photo mode">
            <span className="ve-placement-label">Photos</span>
            <button
              type="button"
              className={`ve-tool-btn ${!slideshowOn ? "is-active" : ""}`}
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
              className={`ve-tool-btn ${slideshowOn ? "is-active" : ""}`}
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
          <ImageAspectPicker
            value={d.imageAspect}
            onChange={(imageAspect) => setData({ ...d, imageAspect })}
          />
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
              <EText
                as="p"
                className="eyebrow"
                value={d.eyebrow}
                onChange={(eyebrow) => setData({ ...d, eyebrow })}
              />
              <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
              <EText as="p" multiline value={d.body} onChange={(body) => setData({ ...d, body })} />
              <EText
                as="p"
                multiline
                value={d.body2 || ""}
                onChange={(body2) => setData({ ...d, body2 })}
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
      body = (
        <section className={`section section-compact ve-block ve-card-grid ${nested ? "pb-nested" : ""}`}>
          {hasHeading ? (
            <div className="section-head ve-optional-head">
              <EText
                as="p"
                className="eyebrow"
                value={d.eyebrow || ""}
                onChange={(eyebrow) => setData({ ...d, eyebrow })}
              />
              <EText as="h2" value={d.title || ""} onChange={(title) => setData({ ...d, title })} />
              <EText
                as="p"
                className="section-lead"
                value={d.lead || ""}
                onChange={(lead) => setData({ ...d, lead })}
              />
              <button
                type="button"
                className="ve-mini-btn"
                onClick={() => setData({ ...d, eyebrow: "", title: "", lead: "" })}
              >
                Clear heading
              </button>
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
          <div className="ve-tool-group" style={{ marginBottom: "0.75rem" }}>
            <ImageAspectPicker
              value={d.imageAspect}
              onChange={(imageAspect) => setData({ ...d, imageAspect })}
            />
          </div>
          <div className={(section.columns || 3) === 2 ? "home-gateway-grid" : "product-grid"}>
            {d.items.map((item, index) => (
              <article className="product-card ve-card" key={item.id}>
                <div className="ve-card-actions">
                  <button type="button" className="ve-move" onClick={() => setData({ ...d, items: reorder(d.items, index, index - 1) })}>
                    ←
                  </button>
                  <button type="button" className="ve-move" onClick={() => setData({ ...d, items: reorder(d.items, index, index + 1) })}>
                    →
                  </button>
                  <button
                    type="button"
                    className="ve-remove"
                    onClick={() => setData({ ...d, items: d.items.filter((_, i) => i !== index) })}
                  >
                    Remove
                  </button>
                </div>
                <div className="product-card-image pb-photo-frame" style={imageAspectStyle(d.imageAspect)}>
                  <EImage
                    value={item.image || ""}
                    onChange={(image) => updateItem(index, { image })}
                    focus={item.focus}
                    onFocusChange={(focus) => updateItem(index, { focus })}
                    label="Card photo"
                  />
                </div>
                <div className="product-card-body">
                  <EText
                    as="p"
                    className="eyebrow"
                    value={item.eyebrow || ""}
                    onChange={(eyebrow) => updateItem(index, { eyebrow })}
                  />
                  <EText as="h3" value={item.title} onChange={(title) => updateItem(index, { title })} />
                  <EText as="p" multiline value={item.text} onChange={(text) => updateItem(index, { text })} />
                  <PageLinkField
                    value={item.href || ""}
                    onChange={(href) => updateItem(index, { href })}
                    pages={sitePages}
                    label="Opens this page"
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
                <EText
                  as="p"
                  className="eyebrow"
                  value={d.eyebrow || ""}
                  onChange={(eyebrow) => setData({ ...d, eyebrow })}
                />
                <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
                <EText
                  as="p"
                  className="section-lead"
                  value={d.lead || ""}
                  onChange={(lead) => setData({ ...d, lead })}
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
            <EText
              as="p"
              className="eyebrow"
              value={d.eyebrow || ""}
              onChange={(eyebrow) => setData({ ...d, eyebrow })}
            />
            <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
            <EText
              as="p"
              className="section-lead"
              value={d.lead || ""}
              onChange={(lead) => setData({ ...d, lead })}
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
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <div className="section-head">
            <EText as="h2" value={d.title} onChange={(title) => setData({ ...d, title })} />
            <EText
              as="p"
              className="section-lead"
              value={d.lead || ""}
              onChange={(lead) => setData({ ...d, lead })}
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
            <span className="ve-table-size-meta">
              {d.headers.length} × {d.rows.length}
            </span>
          </div>
          <p className="ve-hint">Edit cells below. Headers and rows are plain text.</p>
          <div className="ve-table-edit">
            <div className="ve-table-row">
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
            </div>
            {d.rows.map((row, ri) => (
              <div className="ve-table-row" key={ri}>
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
                <button
                  type="button"
                  className="ve-mini-btn"
                  onClick={() => setData({ ...d, rows: d.rows.filter((_, i) => i !== ri) })}
                >
                  ×
                </button>
              </div>
            ))}
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
      body = (
        <section className={`section section-compact ve-block ${nested ? "pb-nested" : ""}`}>
          <EText as="h2" value={d.title || ""} onChange={(title) => setData({ ...d, title })} />
          <div className="ve-tool-group" style={{ marginBottom: "0.75rem" }}>
            <button
              type="button"
              className={`ve-tool-btn ${(d.layout || "grid") === "grid" ? "is-active" : ""}`}
              onClick={() => setData({ ...d, layout: "grid" })}
            >
              Grid
            </button>
            <button
              type="button"
              className={`ve-tool-btn ${d.layout === "slideshow" ? "is-active" : ""}`}
              onClick={() => setData({ ...d, layout: "slideshow" })}
            >
              Slideshow
            </button>
          </div>
          <ImageAspectPicker
            value={d.imageAspect}
            onChange={(imageAspect) => setData({ ...d, imageAspect })}
          />
          {d.layout === "slideshow" ? (
            <SlideshowIntervalControl
              value={d.slideshowIntervalSec}
              onChange={(slideshowIntervalSec) => setData({ ...d, slideshowIntervalSec })}
            />
          ) : null}
          <div className="pb-gallery pb-cols pb-cols-3">
            {d.items.map((item, index) => (
              <div className="ve-card ve-slide-card" key={item.id}>
                <div
                  className="ve-slide-frame pb-photo-frame"
                  style={imageAspectStyle(d.imageAspect) ?? { aspectRatio: "2 / 1" }}
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
                <EText
                  as="p"
                  className="eyebrow"
                  value={d.eyebrow}
                  onChange={(eyebrow) => setData({ ...d, eyebrow })}
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
              <EText
                as="p"
                className="eyebrow"
                value={d.eyebrow}
                onChange={(eyebrow) => setData({ ...d, eyebrow })}
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
    <div className="ve-section-stack">
      {body}
      <div className={`ve-section-footer${section.type === "hero" ? " is-after-hero" : ""}`}>
        {toolbar}
        {section.type === "hero" ? null : buttonsEditor}
        {noteEditor}
      </div>
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
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [pendingTable, setPendingTable] = useState<"dataTable" | "specsTable" | null>(null);
  const [tableCols, setTableCols] = useState(3);
  const [tableRows, setTableRows] = useState(3);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const allowed = allowTabs
    ? ADDABLE_SECTION_TYPES
    : ADDABLE_SECTION_TYPES.filter((t) => t !== "tabs");
  const common = COMMON_SECTION_TYPES.filter((t) => allowed.includes(t));
  const advanced = ADVANCED_SECTION_TYPES.filter((t) => allowed.includes(t));

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
    next.splice(at, 0, createEmptySection(type));
    onChange(next);
    setInsertAt(null);
    setPendingTable(null);
    setShowAdvanced(false);
  }

  function confirmTableInsert(at: number) {
    const section =
      pendingTable === "specsTable"
        ? createSpecsTableSection(tableRows)
        : createDataTableSection(tableCols, tableRows);
    const next = [...sections];
    next.splice(at, 0, section);
    onChange(next);
    setInsertAt(null);
    setPendingTable(null);
    setShowAdvanced(false);
  }

  function TypeChoices({ list, at }: { list: SectionType[]; at: number }) {
    return (
      <div className="ve-section-picker">
        {list.map((type: SectionType) => (
          <button
            key={type}
            type="button"
            className="ve-section-choice"
            onClick={() => insertSection(type, at)}
          >
            <strong>{SECTION_TYPE_LABELS[type]}</strong>
            <span>{SECTION_TYPE_HELP[type]}</span>
          </button>
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
            onClick={() => {
              setPendingTable(null);
              setShowAdvanced(false);
              setInsertAt(at);
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
      <div className="ve-add-section ve-insert-picker">
        <p className="ve-insert-hint">Choose a block to add</p>
        <TypeChoices list={common} at={at} />
        {advanced.length > 0 ? (
          <div className="ve-section-more">
            <button
              type="button"
              className="ve-mini-btn"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "Hide more options" : "More options (tables, tabs, joint…)"}
            </button>
            {showAdvanced ? <TypeChoices list={advanced} at={at} /> : null}
          </div>
        ) : null}
        <button
          type="button"
          className="ve-mini-btn"
          onClick={() => {
            setInsertAt(null);
            setShowAdvanced(false);
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
      {sections.map((section, index) => (
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
            }}
            onDelete={() => onChange(sections.filter((_, i) => i !== index))}
          />
          <InsertPicker
            at={index + 1}
            label={
              index === sections.length - 1 ? "+ Add a block at the bottom" : "+ Add a block here"
            }
            prominent
          />
        </div>
      ))}
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
    function onKey(e: KeyboardEvent) {
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
    setMessage("Saved.");
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

  return (
    <div className={`ve-root ve-root-site${showTip ? " has-howto" : ""}`}>
      <div className="ve-edit-bar">
        <div className="ve-edit-bar-left">
          <span className="ve-edit-pill">Admin</span>
          <PageSwitcher currentId={pageId} pages={sitePages} />
        </div>
        <div className="ve-toolbar-actions">
          {dirty ? <span className="ve-dirty">Not saved yet</span> : null}
          {message ? <span className="ve-msg">{message}</span> : null}
          <button className="btn btn-primary ve-bar-btn" type="button" onClick={save} disabled={saving}>
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
                    Undo
                  </button>
                  <button type="button" className="ve-more-item" onClick={redo} disabled={!future.length}>
                    Redo
                  </button>
                  <a className="ve-more-item" href="/admin/nav" onClick={() => setMoreOpen(false)}>
                    Edit website menu
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
        <div className="ve-howto">
          <p>
            <strong>How to edit:</strong> Click any text to change it. On photos, use{" "}
            <em>Change photo</em>. Use <em>+ Add a block here</em> to insert new content. Under each
            block, use the dark bar to move, duplicate, or remove it. When you finish, click{" "}
            <strong>Save changes</strong>.
          </p>
          <button type="button" className="ve-howto-dismiss" onClick={dismissTip}>
            Got it
          </button>
        </div>
      ) : null}

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
          heroLabel={<div className="ve-section-label">Page banner — click photo or text to edit</div>}
          mediaSlot={
            <>
              <EImage
                className="ve-about-hero-bg"
                value={doc.about.image || ""}
                onChange={(image) =>
                  update({
                    ...doc,
                    about: { ...doc.about!, image },
                  })
                }
                label="Banner background photo"
              />
              <div className="about-hero-veil" />
            </>
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
  );
}
