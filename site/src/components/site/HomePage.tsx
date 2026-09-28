import type { HomeContent } from "@/lib/types";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { LightboxImage } from "./LightboxImage";
import { imageFocusStyle, veilOpacity } from "@/lib/page-document";
import { RichText } from "@/components/site/RichText";

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
              <img
                className="hero-photo"
                src={hero.backgroundImage}
                alt=""
                style={imageFocusStyle(hero.imageFocus)}
              />
            ) : (
              <div className="hero-photo-fallback" />
            )}
            <div className="hero-veil" style={{ opacity: veilOpacity(hero.veilStrength) }} />
          </div>
          <div className="hero-content">
            <RichText as="p" className="hero-brand" text={hero.brand} />
            <RichText as="h1" text={hero.headline} />
            <RichText as="p" className="hero-lead" text={hero.lead} />
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
              <RichText as="h2" text={item.title} />
              <RichText as="p" text={item.text} />
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
              <article className="home-gateway-card" key={item.id}>
                <div className="home-gateway-media">
                  <LightboxImage src={item.image} alt={item.title} caption={item.title} hint={false} />
                </div>
                <a className="home-gateway-body" href={item.href}>
                  <p className="eyebrow">{item.eyebrow}</p>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <span className="product-card-link">Open →</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-compact" id="contact-teaser">
          <div className="home-contact-teaser">
            <div>
              <p className="eyebrow">{contact.eyebrow}</p>
              <RichText as="h2" text={contact.title} />
              <RichText as="p" text={contact.body} />
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
