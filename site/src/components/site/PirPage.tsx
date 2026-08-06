import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import type { PirContent } from "@/lib/pir";

const settings = {
  logoUrl: "https://www.ur.com.my/images/logo-2.png",
  siteName: "United Panel-System",
};

const footer = {
  companyName: "United Panel-System(M) Sdn Bhd",
  tagline: "PIR Panels",
  copyright: "All Rights Reserved. {year} United Panel-System(M) Sdn Bhd. (772009-A)",
  note: "",
};

export function PirPage({ content }: { content: PirContent }) {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Panels", href: "/#products" },
    { label: "Parts", href: "/#parts" },
    { label: "Services", href: "/#services" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <>
      <SiteHeader settings={settings} navItems={navItems} />
      <main>
        <section className="hero hero-short" aria-label="PIR introduction">
          <div className="hero-media" aria-hidden="true">
            {content.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hero-photo" src={content.heroImage} alt="" />
            ) : (
              <div className="hero-photo-fallback" />
            )}
            <div className="hero-veil" />
            {content.mediaLabel ? (
              <div className="hero-media-label">{content.mediaLabel}</div>
            ) : null}
          </div>
          <div className="hero-content">
            <p className="hero-brand">{content.brand}</p>
            <h1>{content.headline}</h1>
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
          <a href="#features">Features</a>
          <a href="#specs">Specifications</a>
          <a href="#contact">Enquire</a>
          <a href="/products/rockwool">RockWool →</a>
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
            <div className="capability-visual">
              {content.overviewImage ? (
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
              <a className="text-link" href="https://www.ur.com.my/fm-global-approval-36.aspx">
                About FM Global approval →
              </a>
            </div>
          </div>
        </section>

        <section className="section section-compact" id="features">
          <div className="section-head">
            <p className="eyebrow">{content.featuresEyebrow}</p>
            <h2>{content.featuresTitle}</h2>
          </div>
          <ul className="pir-feature-list">
            {content.features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

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

        <section className="section section-compact" id="related">
          <div className="section-head">
            <p className="eyebrow">Also available</p>
            <h2>Other panel systems</h2>
          </div>
          <div className="offer-grid">
            <a className="offer-card" href="/products/pur">
              <div className="offer-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.ur.com.my/userfiles/image/fronad2.jpg" alt="" />
              </div>
              <div className="offer-card-body">
                <h3>PUR Panels</h3>
                <p>Durable polyurethane panels for cold storage construction.</p>
                <span className="product-card-link">View →</span>
              </div>
            </a>
            <a className="offer-card" href="/products/rockwool">
              <div className="offer-card-image">
                <span>Photo</span>
              </div>
              <div className="offer-card-body">
                <h3>RockWool Panels</h3>
                <p>Mineral-wool core panels with strong fire-conscious performance.</p>
                <span className="product-card-link">View →</span>
              </div>
            </a>
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
