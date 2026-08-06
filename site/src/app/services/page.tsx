import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_NAV } from "@/lib/nav";
import { defaultHomeContent } from "@/lib/defaults";

export const metadata: Metadata = {
  title: "Services | United Panel-System",
  description: "Advisory and cold storage project support from United Panel-System.",
};

const services = defaultHomeContent.services;
const settings = defaultHomeContent.settings;
const footer = { ...defaultHomeContent.footer, tagline: "Services" };

export default function ServicesPage() {
  return (
    <>
      <SiteHeader settings={settings} navItems={SITE_NAV} />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <p className="eyebrow">{services.eyebrow}</p>
            <h1>{services.title}</h1>
            <p className="section-lead">{services.lead}</p>
          </div>
        </section>
        <section className="section section-compact">
          <div className="offer-grid">
            {services.items.map((item) => (
              <article className="offer-card" key={item.id}>
                <div className="offer-card-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" />
                </div>
                <div className="offer-card-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
          <p style={{ marginTop: "1.5rem" }}>
            <Link className="text-link" href="/contact">
              Enquire about services →
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
