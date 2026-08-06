import type { HomeContent } from "@/lib/types";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

const gateways = [
  {
    id: "about",
    eyebrow: "About Us",
    title: "Our company",
    text: "Profile, vision, R&D and certifications — who we are and how we manufacture.",
    href: "/about",
    image: "https://www.ur.com.my/userfiles/image/newfactoryoutlok.png",
  },
  {
    id: "products",
    eyebrow: "Products",
    title: "Insulated panels",
    text: "PIR, PU and RockWool panel systems for cold rooms and industrial envelopes.",
    href: "/products",
    image: "https://www.ur.com.my/userFiles/image/8.jpg",
  },
  {
    id: "services",
    eyebrow: "Services",
    title: "Advisory & support",
    text: "Guidance for cold storage planning, panel selection and project delivery.",
    href: "/services",
    image: "https://www.ur.com.my/userfiles/image/fronad2.jpg",
  },
  {
    id: "parts",
    eyebrow: "Refrigeration Parts",
    title: "Parts & brands",
    text: "Authorised refrigeration components from leading global brands.",
    href: "/parts",
    image: "https://www.ur.com.my/userfiles/image/front-spare-part.jpg",
  },
];

export function HomePage({ content }: { content: HomeContent }) {
  const { hero, proof, contact, footer, settings, nav } = content;

  return (
    <>
      <SiteHeader settings={settings} navItems={nav.items} />
      <main>
        <section className="hero hero-short" aria-label="Introduction">
          <div className="hero-media" aria-hidden="true">
            {hero.backgroundImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hero-photo" src={hero.backgroundImage} alt="" />
            ) : (
              <div className="hero-photo-fallback" />
            )}
            <div className="hero-veil" />
          </div>
          <div className="hero-content">
            <p className="hero-brand">{hero.brand}</p>
            <h1>{hero.headline}</h1>
            <p className="hero-lead">{hero.lead}</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href={hero.primaryCtaHref}>
                {hero.primaryCtaLabel}
              </a>
              <a className="btn btn-ghost" href={hero.secondaryCtaHref}>
                {hero.secondaryCtaLabel}
              </a>
            </div>
          </div>
        </section>

        <section className="proof" aria-label="Key highlights">
          {proof.items.map((item) => (
            <div className="proof-item" key={item.id}>
              <span className="proof-index">{item.index}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
          ))}
        </section>

        <section className="section section-compact" id="explore" aria-label="Explore United Panel">
          <div className="section-head">
            <p className="eyebrow">Explore</p>
            <h2>What we offer</h2>
            <p className="section-lead">
              Start here for a quick overview — open each section for full details.
            </p>
          </div>
          <div className="home-gateway-grid">
            {gateways.map((item) => (
              <a className="home-gateway-card" href={item.href} key={item.id}>
                <div className="home-gateway-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" />
                </div>
                <div className="home-gateway-body">
                  <p className="eyebrow">{item.eyebrow}</p>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <span className="product-card-link">Open →</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="section section-compact" id="contact-teaser">
          <div className="home-contact-teaser">
            <div>
              <p className="eyebrow">{contact.eyebrow}</p>
              <h2>{contact.title}</h2>
              <p>{contact.body}</p>
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
