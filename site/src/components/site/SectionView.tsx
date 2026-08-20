"use client";

import { useState } from "react";
import type { PageSection, TabsSectionData } from "@/lib/page-document";
import {
  gridClass,
  imageAspectStyle,
  imageFocusStyle,
  mediaTextPhotos,
  resolveContactFields,
  resolveSectionButtons,
  resolveSectionNote,
  resolveSlideshowIntervalMs,
  sectionAnchorId,
} from "@/lib/page-document";
import { SectionButtonsView } from "@/components/admin/visual/SectionButtons";
import { OverviewSlideshow } from "@/components/site/OverviewSlideshow";
import { LightboxImage } from "@/components/site/LightboxImage";
import { DetailsCloseButton } from "@/components/site/DetailsCloseButton";
import type { ReactNode } from "react";

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((block, i) => (
        <p key={i} style={{ whiteSpace: "pre-wrap" }}>
          {block}
        </p>
      ))}
    </>
  );
}

function SectionFoot({ note, actions }: { note: string; actions: ReactNode }) {
  return (
    <>
      {note ? <p className="about-note pb-section-note">{note}</p> : null}
      {actions}
    </>
  );
}

function TabsSectionView({ data, id }: { data: TabsSectionData; id?: string }) {
  const [active, setActive] = useState(data.tabs[0]?.id || "");
  const current = data.tabs.find((t) => t.id === active) || data.tabs[0];

  return (
    <section className="section section-compact pb-tabs" id={id}>
      {(data.eyebrow || data.title) && (
        <div className="section-head">
          {data.eyebrow ? <p className="eyebrow">{data.eyebrow}</p> : null}
          {data.title ? <h2>{data.title}</h2> : null}
        </div>
      )}
      <div className="pb-tablist" role="tablist">
        {data.tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`pb-tab ${tab.id === current?.id ? "is-active" : ""}`}
            aria-selected={tab.id === current?.id}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pb-tabpanel" role="tabpanel">
        {current?.sections
          .filter((s) => s.visible !== false)
          .map((section) => (
            <SectionView key={section.id} section={section} nested />
          ))}
      </div>
    </section>
  );
}

export function SectionView({
  section,
  nested,
}: {
  section: PageSection;
  nested?: boolean;
  editMode?: boolean;
}) {
  if (section.visible === false) return null;
  const cols = section.columns || 1;
  const anchorId = sectionAnchorId(section);
  const actionButtons = resolveSectionButtons(section);
  const footnote = resolveSectionNote(section);
  const actions =
    section.type === "hero" ? null : (
      <SectionButtonsView buttons={actionButtons} />
    );
  const foot = <SectionFoot note={footnote} actions={actions} />;

  switch (section.type) {
    case "hero": {
      const d = section.data;
      const heroClass = d.size === "full" ? "hero" : "hero hero-short";
      return (
        <section className={heroClass} aria-label="Introduction" id={anchorId}>
          <div className="hero-media" aria-hidden="true">
            {d.backgroundImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hero-photo" src={d.backgroundImage} alt="" />
            ) : (
              <div className="hero-photo-fallback" />
            )}
            <div className="hero-veil" />
          </div>
          <div className="hero-content">
            <p className="hero-brand">{d.brand}</p>
            <h1>{d.headline}</h1>
            {d.tagline ? <p className="hero-tagline">{d.tagline}</p> : null}
            <p className="hero-lead">{d.lead}</p>
            {footnote ? <p className="about-note pb-section-note hero-section-note">{footnote}</p> : null}
          </div>
        </section>
      );
    }
    case "proof":
      return (
        <section className="proof" aria-label="Key highlights" id={anchorId}>
          {section.data.items.map((item) => (
            <div className="proof-item" key={item.id}>
              <span className="proof-index">{item.index}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
          ))}
          {foot}
        </section>
      );
    case "richText": {
      const d = section.data;
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          <div className="section-head">
            {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
            <h2>{d.title}</h2>
            <div className="section-lead">
              <Paragraphs text={d.body} />
            </div>
          </div>
          {d.image ? (
            <div className="about-figure pb-photo-frame" style={imageAspectStyle(d.imageAspect)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image} alt="" style={imageFocusStyle(d.imageFocus)} />
            </div>
          ) : null}
          {d.ctaLabel && d.ctaHref ? (
            <a className="text-link" href={d.ctaHref}>
              {d.ctaLabel}
            </a>
          ) : null}
          {foot}
        </section>
      );
    }
    case "mediaText": {
      const d = section.data;
      const reverse = d.imageSide === "right";
      const photos = mediaTextPhotos(d);
      const useSlideshow = (d.images && d.images.length > 0) || photos.length > 1;
      return (
        <section className={`section ${nested ? "pb-nested" : ""}`} id={anchorId}>
          <div className={`capability ${reverse ? "pb-media-reverse" : ""}`}>
            <div
              className="capability-visual capability-visual-clear pb-photo-frame"
              data-photo-shape={d.imageAspect || "default"}
              style={imageAspectStyle(d.imageAspect)}
            >
              {useSlideshow && photos.length > 0 ? (
                <OverviewSlideshow
                  images={photos}
                  label={d.title || "Photos"}
                  intervalMs={resolveSlideshowIntervalMs(d.slideshowIntervalSec)}
                />
              ) : photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[0].src}
                  alt=""
                  style={imageFocusStyle(photos[0].focus)}
                />
              ) : (
                <span>Photo</span>
              )}
            </div>
            <div>
              {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
              <h2>{d.title}</h2>
              <Paragraphs text={d.body} />
              {d.body2 ? <Paragraphs text={d.body2} /> : null}
              {d.linkLabel && d.linkHref ? (
                <a className="text-link" href={d.linkHref}>
                  {d.linkLabel}
                </a>
              ) : null}
            </div>
          </div>
          {foot}
        </section>
      );
    }
    case "cardGrid": {
      const d = section.data;
      const hasImages = d.items.some((item) => Boolean(item.image));
      const isGateway = cols === 2 && hasImages;
      const isHub = cols === 2 && !hasImages;
      const grid = isGateway
        ? "home-gateway-grid"
        : isHub
          ? "about-hub-grid"
          : cols === 3
            ? "product-grid"
            : "offer-grid";
      const cardClass = isGateway ? "home-gateway-card" : isHub ? "about-hub-card" : "product-card";
      const bodyClass = isGateway ? "home-gateway-body" : isHub ? "about-hub-body" : "product-card-body";
      const cardAspect = imageAspectStyle(d.imageAspect);
      return (
        <section
          className={`section section-compact ${isHub ? "about-hub-section" : ""} ${nested ? "pb-nested" : ""}`}
          id={anchorId}
        >
          {(d.eyebrow || d.title || d.lead) && (
            <div className="section-head">
              {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
              {d.title ? <h2>{d.title}</h2> : null}
              {d.lead ? <p className="section-lead">{d.lead}</p> : null}
            </div>
          )}
          <div className={grid}>
            {d.items.map((item) => {
              const inner = (
                <>
                  {item.image ? (
                    <div
                      className={`${isGateway ? "home-gateway-media" : "product-card-image"} pb-photo-frame`}
                      style={cardAspect}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" style={imageFocusStyle(item.focus)} />
                    </div>
                  ) : null}
                  <div className={bodyClass}>
                    {item.eyebrow ? <p className="eyebrow">{item.eyebrow}</p> : null}
                    <h3>{item.title}</h3>
                    {item.text ? <p>{item.text}</p> : null}
                    {item.href ? <span className="product-card-link">Open →</span> : null}
                  </div>
                </>
              );
              return item.href ? (
                <a className={cardClass} href={item.href} key={item.id}>
                  {inner}
                </a>
              ) : (
                <article className={cardClass} key={item.id}>
                  {inner}
                </article>
              );
            })}
          </div>
          {foot}
        </section>
      );
    }
    case "featureList": {
      const d = section.data;
      const images = (d.images || []).filter((img) => img.src);
      const list = (
        <>
          <div className="section-head">
            {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
            <h2>{d.title}</h2>
            {d.lead ? <p className="section-lead">{d.lead}</p> : null}
          </div>
          <ul
            className={
              images.length
                ? "panel-app-grid panel-app-grid-two"
                : `feature-list ${gridClass(cols)}`
            }
          >
            {d.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </>
      );
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          {images.length ? (
            <div className="panel-app-layout">
              <div>{list}</div>
              <div
                className="panel-app-visual capability-visual capability-visual-clear pb-photo-frame"
                data-photo-shape={d.imageAspect || "default"}
                style={imageAspectStyle(d.imageAspect)}
              >
                <OverviewSlideshow
                  images={images.map((img) => ({
                    src: img.src,
                    focus: img.focus || d.imageFocus,
                  }))}
                  label={d.title || "Application photos"}
                  intervalMs={resolveSlideshowIntervalMs(d.slideshowIntervalSec)}
                />
              </div>
            </div>
          ) : (
            list
          )}
          {foot}
        </section>
      );
    }
    case "specsTable": {
      const d = section.data;
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          <div className="section-head">
            {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
            <h2>{d.title}</h2>
            {d.lead ? <p className="section-lead">{d.lead}</p> : null}
          </div>
          <div className="spec-table">
            {d.rows.map((row, i) => (
              <div className="spec-row" key={i}>
                <strong>{row.label}</strong>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
          {foot}
        </section>
      );
    }
    case "dataTable": {
      const d = section.data;
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          <div className="section-head">
            {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
            <h2>{d.title}</h2>
            {d.lead ? <p className="section-lead">{d.lead}</p> : null}
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {d.headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {foot}
        </section>
      );
    }
    case "gallery": {
      const d = section.data;
      const isSlideshow = d.layout === "slideshow";
      const slideshowImages = d.items
        .filter((item) => item.src)
        .map((item) => ({ src: item.src, focus: item.focus }));
      const aspect = imageAspectStyle(d.imageAspect);
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          {d.title ? (
            <div className="section-head">
              <h2>{d.title}</h2>
            </div>
          ) : null}
          {isSlideshow ? (
            <div
              className="panel-app-visual capability-visual capability-visual-clear pb-gallery-slideshow pb-photo-frame"
              data-photo-shape={d.imageAspect || "default"}
              style={aspect}
            >
              <OverviewSlideshow
                images={slideshowImages}
                label={d.title || "Photo slideshow"}
                intervalMs={resolveSlideshowIntervalMs(d.slideshowIntervalSec)}
              />
            </div>
          ) : (
            <div className={`pb-gallery ${gridClass(cols)}`}>
              {d.items.map((item) => (
                <figure
                  className={`about-figure${item.src ? "" : " about-figure-empty"}`}
                  key={item.id}
                >
                  {item.src ? (
                    <div className="pb-photo-frame" style={aspect}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt={item.alt || ""}
                        style={imageFocusStyle(item.focus)}
                      />
                    </div>
                  ) : (
                    <div className="about-figure-placeholder pb-photo-frame" style={aspect} aria-hidden="true" />
                  )}
                  {item.alt ? <figcaption>{item.alt}</figcaption> : null}
                </figure>
              ))}
            </div>
          )}
          {foot}
        </section>
      );
    }
    case "jointDetails": {
      const d = section.data;
      const pages = d.pages || [];
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          <details className="panel-joint">
            <summary className="panel-joint-summary">
              <div className="section-head panel-joint-head">
                {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
                <h2>{d.title}</h2>
                {d.summary ? <p className="section-lead">{d.summary}</p> : null}
              </div>
              <span className="panel-joint-toggle" role="button">
                {d.toggleLabel || "Show joint details"}
              </span>
            </summary>
            <div className="panel-joint-body">
              <div className="panel-joint-main">
                <div className="panel-joint-copy">
                  {d.body ? <p style={{ whiteSpace: "pre-wrap" }}>{d.body}</p> : null}
                </div>
                {d.image ? (
                  <figure className="panel-joint-figure">
                    <LightboxImage src={d.image} alt={d.imageAlt || d.title} caption={d.title} />
                    <figcaption>{d.title}</figcaption>
                  </figure>
                ) : null}
              </div>
              {pages.length > 0 ? (
                <div className="panel-joint-pages">
                  {pages.map((page) => (
                    <figure className="panel-joint-page" key={page.id}>
                      <div className="panel-joint-page-head">
                        <h3>{page.title}</h3>
                        {page.lead ? <p>{page.lead}</p> : null}
                      </div>
                      {page.src ? (
                        <LightboxImage src={page.src} alt={page.alt || page.title} caption={page.title} />
                      ) : null}
                    </figure>
                  ))}
                </div>
              ) : null}
              <div className="panel-joint-footer">
                <DetailsCloseButton
                  className="panel-joint-hide"
                  label={d.hideLabel || "Hide joint details"}
                />
              </div>
            </div>
          </details>
          {foot}
        </section>
      );
    }
    case "contactCta": {
      const d = section.data;
      const fields = resolveContactFields(d);
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          <div className="home-contact-teaser">
            <div>
              <p className="eyebrow">{d.eyebrow}</p>
              <h2>{d.title}</h2>
              <p>{d.body}</p>
              {fields.length > 0 ? (
                <ul className="contact-meta">
                  {fields.map((field) => (
                    <li key={field.id}>
                      <span>{field.label}</span>
                      {field.value}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          {foot}
        </section>
      );
    }
    case "callout":
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          <div className="about-highlight pb-callout">
            {section.data.title ? <strong>{section.data.title}</strong> : null}
            <p>{section.data.body}</p>
          </div>
          {foot}
        </section>
      );
    case "stats":
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          <ul className="profile-stats" aria-label="Highlights">
            {section.data.items.map((item) => (
              <li key={item.id}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          {foot}
        </section>
      );
    case "tabs":
      return (
        <>
          <TabsSectionView data={section.data} id={anchorId} />
          {foot}
        </>
      );
    default:
      return null;
  }
}
