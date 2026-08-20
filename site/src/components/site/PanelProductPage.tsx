import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { OverviewSlideshow } from "@/components/site/OverviewSlideshow";
import { LightboxImage } from "@/components/site/LightboxImage";
import { DetailsCloseButton } from "@/components/site/DetailsCloseButton";
import type { PanelProductContent } from "@/lib/panels";
import { SITE_NAV } from "@/lib/nav";

const settings = {
  logoUrl: "https://www.ur.com.my/images/logo-2.png",
  siteName: "United Panel-System",
};

export function PanelProductPage({ content }: { content: PanelProductContent }) {
  const footer = {
    companyName: "United Panel-System(M) Sdn Bhd",
    tagline: content.footerTagline,
    copyright: "All Rights Reserved. {year} United Panel-System(M) Sdn Bhd. (772009-A)",
    note: "",
  };

  return (
    <>
      <SiteHeader settings={settings} navItems={SITE_NAV} />
      <main>
        <section className="hero hero-short" aria-label={`${content.headline} introduction`}>
          <div className="hero-media" aria-hidden="true">
            {content.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hero-photo" src={content.heroImage} alt="" />
            ) : (
              <div className="hero-photo-fallback" />
            )}
            <div className="hero-veil" />
          </div>
          <div className="hero-content">
            <p className="hero-brand">{content.brand}</p>
            <h1>{content.headline}</h1>
            {content.tagline ? <p className="hero-tagline">{content.tagline}</p> : null}
            <p className="hero-lead">{content.lead}</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#contact">
                {content.primaryCta}
              </a>
              <a className="btn btn-ghost" href="#specs">
                {content.secondaryCta}
              </a>
            </div>
          </div>
        </section>

        <nav className="jump-bar" aria-label="On this page">
          <a href="#overview">Overview</a>
          <a href="#features">Advantages</a>
          {content.finishes ? <a href="#finishes">Finishes</a> : null}
          {content.applications ? <a href="#applications">Applications</a> : null}
          {content.jointDetails ? <a href="#joint">Joint</a> : null}
          <a href="#specs">Specifications</a>
          {content.physicalProperties ? <a href="#properties">Properties</a> : null}
          {content.roofing ? <a href="#roofing">Roofing</a> : null}
          <a href="#certs">Certifications</a>
          <a href="#contact">Enquire</a>
        </nav>

        <section className="proof" aria-label="Key highlights">
          {content.proof.map((item) => (
            <div className="proof-item" key={item.id}>
              <span className="proof-index">{item.index}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
          ))}
        </section>

        <section className="section" id="overview">
          <div className="capability">
            <div className="capability-visual capability-visual-clear">
              {content.overviewImages && content.overviewImages.length > 0 ? (
                <OverviewSlideshow
                  images={content.overviewImages}
                  startIndex={content.overviewImageStartIndex ?? 0}
                />
              ) : content.overviewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.overviewImage} alt="" />
              ) : (
                <span>Photo</span>
              )}
            </div>
            <div>
              <p className="eyebrow">{content.overviewEyebrow}</p>
              <h2>{content.overviewTitle}</h2>
              <p>{content.overviewBody1}</p>
              <p>{content.overviewBody2}</p>
              {content.overviewLinkHref && content.overviewLinkLabel ? (
                <a className="text-link" href={content.overviewLinkHref}>
                  {content.overviewLinkLabel}
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="section section-compact" id="features">
          <div className="section-head">
            <p className="eyebrow">{content.featuresEyebrow}</p>
            <h2>{content.featuresTitle}</h2>
            {content.featuresLead ? (
              <p className="section-lead">{content.featuresLead}</p>
            ) : null}
          </div>
          <ul className="pir-feature-list">
            {content.features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {content.finishes && content.finishes.items.length > 0 ? (
          <section className="section section-compact" id="finishes">
            <div className="section-head">
              <p className="eyebrow">{content.finishes.eyebrow}</p>
              <h2>{content.finishes.title}</h2>
              {content.finishes.lead ? (
                <p className="section-lead">{content.finishes.lead}</p>
              ) : null}
            </div>
            <div className="panel-finish-grid">
              {content.finishes.items.map((finish) => (
                <figure className="panel-finish-card" key={finish.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={finish.image} alt={finish.alt} />
                  <figcaption>{finish.name}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {content.applications ? (
          <section className="section section-compact" id="applications">
            <div className="panel-app-layout">
              <div>
                <div className="section-head">
                  <p className="eyebrow">{content.applications.eyebrow}</p>
                  <h2>{content.applications.title}</h2>
                  <p className="section-lead">{content.applications.lead}</p>
                </div>
                <ul className="panel-app-grid panel-app-grid-two">
                  {content.applications.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              {content.applications.images && content.applications.images.length > 0 ? (
                <div className="panel-app-visual capability-visual capability-visual-clear">
                  <OverviewSlideshow
                    images={content.applications.images.map((shot) => shot.src)}
                    label="PIR panel application photos"
                  />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {content.jointDetails ? (
          <section className="section section-compact" id="joint">
            <details className="panel-joint">
              <summary className="panel-joint-summary">
                <div className="section-head panel-joint-head">
                  <p className="eyebrow">{content.jointDetails.eyebrow}</p>
                  <h2>{content.jointDetails.title}</h2>
                  <p className="section-lead">{content.jointDetails.summary}</p>
                </div>
                <span className="panel-joint-toggle" role="button" aria-hidden="true">
                  Show joint details
                </span>
              </summary>
              <div className="panel-joint-body">
                <div className="panel-joint-main">
                  <div className="panel-joint-copy">
                    <p>{content.jointDetails.body}</p>
                  </div>
                  <figure className="panel-joint-figure">
                    <LightboxImage
                      src={content.jointDetails.image}
                      alt={content.jointDetails.imageAlt}
                      caption={content.jointDetails.title}
                    />
                    <figcaption>{content.jointDetails.title}</figcaption>
                  </figure>
                </div>
                {content.jointDetails.pages && content.jointDetails.pages.length > 0 ? (
                  <div className="panel-joint-pages">
                    {content.jointDetails.pages.map((page) => (
                      <figure className="panel-joint-page" key={page.src}>
                        <div className="panel-joint-page-head">
                          <h3>{page.title}</h3>
                          {page.lead ? <p>{page.lead}</p> : null}
                        </div>
                        <LightboxImage
                          src={page.src}
                          alt={page.alt}
                          caption={page.title}
                        />
                      </figure>
                    ))}
                  </div>
                ) : null}
                <div className="panel-joint-footer">
                  <DetailsCloseButton
                    className="panel-joint-hide"
                    label="Hide joint details"
                  />
                </div>
              </div>
            </details>
          </section>
        ) : null}

        <section className="section section-compact" id="specs">
          <div className="section-head">
            <p className="eyebrow">{content.specsEyebrow}</p>
            <h2>{content.specsTitle}</h2>
            <p className="section-lead">{content.specsLead}</p>
          </div>
          <div className="spec-table">
            {content.specs.map((row) => (
              <div className="spec-row" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </div>
        </section>

        {content.physicalProperties ? (
          <section className="section section-compact" id="properties">
            <div className="section-head">
              <p className="eyebrow">{content.physicalProperties.eyebrow}</p>
              <h2>{content.physicalProperties.title}</h2>
              {content.physicalProperties.lead ? (
                <p className="section-lead">{content.physicalProperties.lead}</p>
              ) : null}
            </div>
            <div className="product-data-table-wrap">
              <table className="product-data-table">
                <thead>
                  <tr>
                    {content.physicalProperties.headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {content.physicalProperties.rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => (
                        <td key={`${row[0]}-${cell}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {content.physicalProperties.note ? (
              <p className="about-note">{content.physicalProperties.note}</p>
            ) : null}
          </section>
        ) : null}

        {content.roofing ? (
          <section className="section section-compact" id="roofing">
            <div className="section-head">
              <p className="eyebrow">{content.roofing.eyebrow}</p>
              <h2>{content.roofing.title}</h2>
              <p className="section-lead">{content.roofing.body}</p>
            </div>
            <div className="spec-table">
              {content.roofing.specs.map((row) => (
                <div className="spec-row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </div>
            {content.roofing.note ? <p className="about-note">{content.roofing.note}</p> : null}
          </section>
        ) : null}

        <section className="section section-compact" id="certs">
          <div className="section-head">
            <p className="eyebrow">{content.certsEyebrow}</p>
            <h2>{content.certsTitle}</h2>
            <p className="section-lead">{content.certsLead}</p>
          </div>
          <div className="panel-cert-grid">
            {content.certifications.map((cert) => {
              const inner = (
                <>
                  <div className="panel-cert-logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cert.image} alt="" />
                  </div>
                  <div className="panel-cert-body">
                    <h3>{cert.name}</h3>
                    <p>{cert.detail}</p>
                    {cert.href ? <span className="product-card-link">Learn more →</span> : null}
                  </div>
                </>
              );
              return cert.href ? (
                <a className="panel-cert-card" href={cert.href} key={cert.id}>
                  {inner}
                </a>
              ) : (
                <div className="panel-cert-card" key={cert.id}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>

        {content.gallery && content.gallery.length > 0 ? (
          <section className="section section-compact" aria-label="Product photos">
            <div className="panel-gallery">
              {content.gallery.map((shot) => (
                <figure key={shot.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shot.src} alt={shot.alt} />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section section-compact" id="related">
          <div className="section-head">
            <p className="eyebrow">Also available</p>
            <h2>Other panel systems</h2>
          </div>
          <div className="offer-grid">
            {content.related.map((item) => (
              <a className="offer-card" href={item.href} key={item.href}>
                <div className="offer-card-image">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" />
                  ) : (
                    <span>Photo</span>
                  )}
                </div>
                <div className="offer-card-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <span className="product-card-link">View →</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="section section-compact" id="contact">
          <div className="contact-panel">
            <div>
              <p className="eyebrow">{content.contactEyebrow}</p>
              <h2>{content.contactTitle}</h2>
              <p>{content.contactBody}</p>
              <ul className="contact-meta">
                <li>
                  <span>Email</span>
                  {content.email}
                </li>
                <li>
                  <span>Phone</span>
                  {content.phone}
                </li>
                <li>
                  <span>WhatsApp</span>
                  {content.whatsapp}
                </li>
              </ul>
            </div>
            <form className="contact-form" action="#" method="post">
              <label>
                Name
                <input name="name" required placeholder="Your name" />
              </label>
              <label>
                Company
                <input name="company" placeholder="Company name" />
              </label>
              <label>
                Email
                <input type="email" name="email" required placeholder="you@company.com" />
              </label>
              <label>
                Message
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Thickness needed, cold room / freezer, location…"
                />
              </label>
              <button className="btn btn-primary" type="submit">
                Send enquiry
              </button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
