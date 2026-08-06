import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_NAV } from "@/lib/nav";
import { defaultHomeContent } from "@/lib/defaults";
import { productIntroSections } from "@/lib/product-intro";

export const metadata: Metadata = {
  title: "Products | United Panel-System",
  description:
    "United Panels — PIR, PU and RockWool insulated panels. Overview, material guidance and links to full specifications.",
};

const products = defaultHomeContent.products;
const settings = defaultHomeContent.settings;
const footer = {
  ...defaultHomeContent.footer,
  tagline: "Products",
};

export default function ProductsHubPage() {
  return (
    <>
      <SiteHeader settings={settings} navItems={SITE_NAV} />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <p className="eyebrow">United Panel</p>
            <h1>United Panels — PIR, PU &amp; RockWool</h1>
            <p className="section-lead">
              An overview of our insulated panel cores — what each material offers, key data where
              available, then full specifications on each product page.
            </p>
          </div>
        </section>

        <nav className="jump-bar" aria-label="Panel types">
          {productIntroSections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.eyebrow.replace("About ", "")}
            </a>
          ))}
        </nav>

        <section className="section section-compact" aria-label="Product range">
          <div className="section-head">
            <p className="eyebrow">{products.eyebrow}</p>
            <h2>Choose a panel system</h2>
            <p className="section-lead">{products.lead}</p>
          </div>
          <div className="product-grid">
            {products.items.map((item) => (
              <a className="product-card" href={item.href} key={item.id}>
                <div className="product-card-image">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" />
                  ) : (
                    <span>Photo</span>
                  )}
                </div>
                <div className="product-card-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <span className="product-card-link">View details →</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {productIntroSections.map((section, index) => (
          <section
            className={`section section-compact product-intro${index % 2 === 1 ? " product-intro-alt" : ""}`}
            id={section.id}
            key={section.id}
          >
            <div className="product-intro-layout">
              <div className="product-intro-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={section.image} alt="" />
              </div>
              <div className="product-intro-copy">
                <p className="eyebrow">{section.eyebrow}</p>
                <h2>{section.title}</h2>
                <p>{section.summary}</p>
                <ul className="pir-feature-list product-intro-points">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {section.body?.map((para) => (
                  <p key={para.slice(0, 48)}>{para}</p>
                ))}
                <a className="text-link" href={section.href}>
                  {section.cta}
                </a>
              </div>
            </div>

            {section.tableRows && section.tableHeaders ? (
              <div className="product-data-block">
                <h3>{section.tableTitle}</h3>
                <div className="product-data-table-wrap">
                  <table className="product-data-table">
                    <thead>
                      <tr>
                        {section.tableHeaders.map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.tableRows.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell) => (
                            <td key={`${row[0]}-${cell}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {section.note ? <p className="about-note">{section.note}</p> : null}
              </div>
            ) : null}
          </section>
        ))}

        <section className="section section-compact">
          <div className="home-contact-teaser">
            <div>
              <p className="eyebrow">Need help choosing?</p>
              <h2>Talk to our team</h2>
              <p>
                Share your project type, temperature range and fire requirements — we’ll recommend
                the right panel core and thickness.
              </p>
            </div>
            <a className="btn btn-primary" href="/contact">
              Contact Us
            </a>
          </div>
        </section>
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
