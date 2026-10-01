"use client";

import { useState } from "react";
import type { PageSection, TabsSectionData } from "@/lib/page-document";
import {
  cardGridLayout,
  COLLAGE_MAX_PHOTOS,
  gridClass,
  proofColumnsClass,
  imageAspectStyle,
  imageFocusStyle,
  veilOpacity,
  mediaTextPhotos,
  resolveContactFields,
  resolveSectionButtons,
  resolveSectionNote,
  resolveSlideshowIntervalMs,
  sectionAnchorId,
} from "@/lib/page-document";
import { SectionButtonsView } from "@/components/admin/visual/SectionButtons";
import { OverviewSlideshow } from "@/components/site/OverviewSlideshow";
import { LogoSlideshow } from "@/components/site/LogoSlideshow";
import { LightboxImage } from "@/components/site/LightboxImage";
import { DetailsCloseButton } from "@/components/site/DetailsCloseButton";
import type { ReactNode } from "react";
import { RichText } from "@/components/site/RichText";
import { htmlToPlainText, isRichHtml } from "@/lib/sanitize-html";

function SectionFoot({
  note,
  actions,
  underTable,
}: {
  note: string;
  actions: ReactNode;
  underTable?: boolean;
}) {
  return (
    <>
      {note ? (
        <p className={`about-note pb-section-note${underTable ? " table-footnote" : ""}`}>{note}</p>
      ) : null}
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
          {data.title ? <RichText as="h2" text={data.title} /> : null}
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
  const tableFoot = <SectionFoot note={footnote} actions={actions} underTable />;

  switch (section.type) {
    case "hero": {
      const d = section.data;
      const heroClass = d.size === "full" ? "hero" : "hero hero-short";
      return (
        <section className={heroClass} aria-label="Introduction" id={anchorId}>
          <div className="hero-media" aria-hidden="true">
            {d.backgroundImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="hero-photo"
                src={d.backgroundImage}
                alt=""
                style={imageFocusStyle(d.imageFocus)}
              />
            ) : (
              <div className="hero-photo-fallback" />
            )}
            <div className="hero-veil" style={{ opacity: veilOpacity(d.veilStrength) }} />
          </div>
          <div className="hero-content">
            <RichText as="p" className="hero-brand" text={d.brand} />
            <RichText as="h1" className="hero-headline" text={d.headline} />
            {d.tagline ? <RichText as="p" className="hero-tagline" text={d.tagline} /> : null}
            <RichText as="p" className="hero-lead" text={d.lead} />
            {footnote ? <p className="about-note pb-section-note hero-section-note">{footnote}</p> : null}
          </div>
        </section>
      );
    }
    case "proof":
      return (
        <section className={`proof ${proofColumnsClass(section.columns)}`} aria-label="Key highlights" id={anchorId}>
          {section.data.items.map((item) => (
            <div className="proof-item" key={item.id}>
              <span className="proof-index">{item.index}</span>
              <RichText as="h2" text={item.title} />
              <RichText as="p" text={item.text} />
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
            <RichText as="h2" text={d.title} />
            <div className="section-lead">
              <RichText text={d.body} paragraphs />
            </div>
          </div>
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
                <LightboxImage
                  src={photos[0].src}
                  alt={d.title || ""}
                  style={imageFocusStyle(photos[0].focus)}
                  caption={d.title}
                />
              ) : (
                <span>Photo</span>
              )}
            </div>
            <div>
              {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
              <RichText as="h2" text={d.title} />
              <RichText text={d.body} paragraphs />
              {d.body2 ? <RichText text={d.body2} paragraphs /> : null}
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
    case "photoCollage": {
      const d = section.data;
      const photos = (d.items || []).filter((p) => p.src?.trim()).slice(0, COLLAGE_MAX_PHOTOS);
      return (
        <section
          className={`section pb-collage ${nested ? "pb-nested" : ""}`}
          id={anchorId}
          data-photo-side={d.photoSide === "left" ? "left" : "right"}
          data-count={photos.length}
        >
          <div className="pb-collage-grid">
            <span className="pb-collage-accent" aria-hidden="true" />
            <div className="pb-collage-copy">
              {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
              {d.title ? <RichText as="h2" text={d.title} /> : null}
              {d.body ? (
                <div className="pb-collage-body">
                  <RichText text={d.body} paragraphs />
                </div>
              ) : null}
              {actions}
            </div>
            {photos.map((photo, index) => (
              <div className="pb-collage-tile pb-photo-frame" data-slot={index + 1} key={photo.id}>
                <LightboxImage
                  src={photo.src}
                  alt={photo.alt || d.title || ""}
                  caption={photo.alt || undefined}
                  hint={false}
                  style={imageFocusStyle(photo.focus)}
                />
              </div>
            ))}
          </div>
          <SectionFoot note={footnote} actions={null} />
        </section>
      );
    }
    case "cardGrid": {
      const d = section.data;
      const hasImages = d.items.some((item) => Boolean(item.image));
      const layout = cardGridLayout(section.columns, d.variant, hasImages);
      const isCerts = layout.kind === "certs";
      const isGateway = layout.kind === "gateway";
      const isHub = layout.kind === "hub";
      const grid = layout.grid;
      const cardClass = layout.card;
      const bodyClass = layout.body;
      const cardAspect = isCerts ? undefined : imageAspectStyle(d.imageAspect);
      return (
        <section
          className={`section section-compact ${isHub ? "about-hub-section" : ""} ${nested ? "pb-nested" : ""}`}
          id={anchorId}
        >
          {(d.eyebrow || d.title || d.lead) && (
            <div className="section-head">
              {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
              {d.title ? <RichText as="h2" text={d.title} /> : null}
              {d.lead ? <RichText as="p" className="section-lead" text={d.lead} /> : null}
            </div>
          )}
          <div className={grid}>
            {d.items.map((item) => {
              const media = item.image ? (
                isCerts ? (
                  <div className="panel-cert-logo">
                    {d.enlarge === false ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <LightboxImage src={item.image} alt={item.title} caption={item.title} hint={false} />
                    )}
                  </div>
                ) : (
                  <div
                    className={`${isGateway ? "home-gateway-media" : "product-card-image"} pb-photo-frame`}
                    style={cardAspect}
                  >
                    {d.enlarge === false ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} style={imageFocusStyle(item.focus)} />
                    ) : (
                      <LightboxImage
                        src={item.image}
                        alt={item.title}
                        style={imageFocusStyle(item.focus)}
                        caption={item.title}
                        hint={false}
                      />
                    )}
                  </div>
                )
              ) : isCerts ? (
                <div className="panel-cert-logo panel-cert-logo-empty" aria-hidden="true" />
              ) : null;
              const bodyContent = (
                <>
                  {item.eyebrow ? <p className="eyebrow">{item.eyebrow}</p> : null}
                  <RichText as="h3" text={item.title} />
                  {item.text ? <RichText as="p" text={item.text} /> : null}
                  {item.href ? (
                    <span className={isCerts ? "panel-cert-link" : "product-card-link"}>
                      {isCerts ? "Learn more →" : "Open →"}
                    </span>
                  ) : null}
                </>
              );
              return (
                <article className={cardClass} key={item.id}>
                  {media}
                  {item.href ? (
                    <a className={bodyClass} href={item.href}>
                      {bodyContent}
                    </a>
                  ) : (
                    <div className={bodyClass}>{bodyContent}</div>
                  )}
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
        <div className="flex flex-col justify-between h-full">
          <div className="section-head">
            {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
            <RichText as="h2" text={d.title} />
            {d.lead ? <RichText as="p" className="section-lead" text={d.lead} /> : null}
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
        </div>
      );
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          {images.length ? (
            <div className="panel-app-layout items-stretch">
              <div>{list}</div>
              <div
                className="panel-app-visual capability-visual capability-visual-clear pb-photo-frame h-full min-h-[320px]"
                data-photo-shape={d.imageAspect || "default"}
                style={{ ...imageAspectStyle(d.imageAspect), height: "100%", minHeight: "100%" }}
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
            <RichText as="h2" text={d.title} />
            {d.lead ? <RichText as="p" className="section-lead" text={d.lead} /> : null}
          </div>
          <div className="spec-table">
            {d.rows.map((row, i) => (
              <div className="spec-row" key={i}>
                <strong>{row.label}</strong>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
          {tableFoot}
        </section>
      );
    }
    case "dataTable": {
      const d = section.data;
      const highlightIdx = typeof d.highlightRowIndex === "number" ? d.highlightRowIndex : -1;

      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          <div className="section-head">
            {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
            <RichText as="h2" text={d.title} />
            {d.lead ? <RichText as="p" className="section-lead" text={d.lead} /> : null}
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
                {d.rows.map((row, ri) => {
                  const isHighlighted = ri === highlightIdx;

                  return (
                    <tr key={ri} className={isHighlighted ? "is-highlighted" : undefined}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{cell}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {tableFoot}
        </section>
      );
    }
    case "gallery": {
      const d = section.data;
      if (d.layout === "logoSlides") {
        return (
          <section className={`section section-compact pb-logo-slides ${nested ? "pb-nested" : ""}`} id={anchorId}>
            {d.eyebrow || d.title ? (
              <div className="section-head">
                {d.eyebrow ? <p className="eyebrow">{d.eyebrow}</p> : null}
                {d.title ? <RichText as="h2" text={d.title} /> : null}
              </div>
            ) : null}
            <LogoSlideshow
              slides={d.items}
              label={htmlToPlainText(d.title || d.eyebrow || "Logo slideshow")}
              intervalMs={resolveSlideshowIntervalMs(d.slideshowIntervalSec)}
              autoplay={d.slideshowAutoplay !== false}
            />
            {foot}
          </section>
        );
      }
      const isSlideshow = d.layout === "slideshow";
      const isLogos = d.layout === "logos";
      const isPages = d.layout === "pages";
      const photoAlign = d.imageAlign || "center";
      const slideshowImages = d.items
        .filter((item) => item.src)
        .map((item) => ({ src: item.src, focus: item.focus }));
      // Logos sit whole (no crop). Pages keep size caps in CSS; Photo shape still applies
      // when set so Square/Tall/etc. change the frame on live + edit.
      const aspect = isLogos ? undefined : imageAspectStyle(d.imageAspect);
      const figureKind = isLogos ? " about-figure-logo" : isPages ? " about-figure-page" : "";
      return (
        <section className={`section section-compact ${nested ? "pb-nested" : ""}`} id={anchorId}>
          {d.title ? (
            <div className="section-head">
              <RichText as="h2" text={d.title} />
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
                  className={`about-figure${item.src ? "" : " about-figure-empty"}${figureKind}`}
                  data-align={isLogos ? photoAlign : undefined}
                  key={item.id}
                >
                  {item.src ? (
                    isLogos ? (
                      <div className="about-figure-logo-stage">
                        <LightboxImage
                          src={item.src}
                          alt={htmlToPlainText(item.alt || d.title || "")}
                          caption={htmlToPlainText(item.alt || d.title || "")}
                          hint={false}
                        />
                      </div>
                    ) : (
                      <div
                        className="pb-photo-frame"
                        data-photo-shape={isLogos ? undefined : d.imageAspect || "auto"}
                        style={aspect}
                      >
                        <LightboxImage
                          src={item.src}
                          alt={htmlToPlainText(item.alt || d.title || "")}
                          style={imageFocusStyle(item.focus)}
                          caption={htmlToPlainText(item.alt || d.title || "")}
                          hint={!isPages}
                        />
                      </div>
                    )
                  ) : (
                    <div className="about-figure-placeholder pb-photo-frame" style={aspect} aria-hidden="true" />
                  )}
                  {item.alt ? (
                    <figcaption>
                      {isRichHtml(item.alt) ? (
                        <RichText as="div" text={item.alt} />
                      ) : (
                        item.alt
                      )}
                    </figcaption>
                  ) : null}
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
                <RichText as="h2" text={d.title} />
                {d.summary ? <RichText as="p" className="section-lead" text={d.summary} /> : null}
              </div>
              <span className="panel-joint-toggle" role="button">
                {d.toggleLabel || "Show joint details"}
              </span>
            </summary>
            <div className="panel-joint-body">
              <div className="panel-joint-main">
                <div className="panel-joint-copy">
                  {d.body ? <RichText text={d.body} paragraphs /> : null}
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
                        {page.lead ? <RichText as="p" text={page.lead} /> : null}
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
              <RichText as="h2" text={d.title} />
              <RichText as="p" text={d.body} />
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
            {section.data.title ? <RichText as="strong" text={section.data.title} /> : null}
            <RichText as="p" text={section.data.body} />
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
