import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_NAV } from "@/lib/nav";

const settings = {
  logoUrl: "https://www.ur.com.my/images/logo-2.png",
  siteName: "United Panel-System",
};

const footer = {
  companyName: "United Panel-System(M) Sdn Bhd",
  tagline: "RockWool",
  copyright: "All Rights Reserved. {year} United Panel-System(M) Sdn Bhd. (772009-A)",
  note: "Stakeholder preview — placeholder content. Final claims, thicknesses, and certificates subject to management approval.",
};

export function RockWoolPage() {
  return (
    <>
      <SiteHeader settings={settings} navItems={SITE_NAV} />
      <main>
        <section className="hero" aria-label="Introduction">
          <div className="hero-media" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hero-photo"
              src="https://www.ur.com.my/userfiles/image/WIW3.png"
              alt=""
            />
            <div className="hero-veil" />
            <div className="hero-media-label">
              Production line photo
            </div>
          </div>
          <div className="hero-content">
            <p className="hero-brand">United Panel · RockWool</p>
            <h1>Malaysia’s First Fully Automated RockWool Line</h1>
            <p className="hero-lead">
              Fire-resilient cold room panels, produced with precision automation — built for
              performance you can trust.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#contact">
                Request a Quote
              </a>
              <a className="btn btn-ghost" href="#products">
                View Products
              </a>
            </div>
          </div>
        </section>

        <section className="proof" aria-label="Key highlights">
          <div className="proof-item">
            <span className="proof-index">01</span>
            <h2>Fully Automated</h2>
            <p>Consistent quality from Malaysia’s first fully automated RockWool production line.</p>
          </div>
          <div className="proof-item">
            <span className="proof-index">02</span>
            <h2>Fire Resilience</h2>
            <p>
              RockWool mineral core engineered for stronger fire performance in cold room
              applications.
            </p>
          </div>
          <div className="proof-item">
            <span className="proof-index">03</span>
            <h2>Cold Room Ready</h2>
            <p>Insulated panel solutions designed for cold storage, freezers, and food facilities.</p>
          </div>
        </section>

        <section className="section" id="rockwool">
          <div className="rw-material-split">
            <div className="rw-material-copy">
              <p className="eyebrow">The Material</p>
              <h2>What is RockWool?</h2>
              <p className="section-lead">
                RockWool is a mineral wool insulation made from natural stone fibres. In cold room
                panels, it provides stable thermal insulation with a core valued for its
                non-combustible character, durability, and reliable performance in
                temperature-controlled environments.
              </p>
              <div className="attribute-grid">
                <article className="attribute">
                  <h3>Fire Performance</h3>
                  <p>
                    Mineral fibre core supports stronger fire resilience for industrial and cold
                    storage environments.
                  </p>
                </article>
                <article className="attribute">
                  <h3>Thermal Stability</h3>
                  <p>Reliable insulation behaviour to help protect temperature-controlled spaces.</p>
                </article>
                <article className="attribute">
                  <h3>Dimensional Integrity</h3>
                  <p>A robust core that holds form under demanding operating conditions.</p>
                </article>
                <article className="attribute">
                  <h3>Acoustic Comfort</h3>
                  <p>Natural fibre structure contributes to quieter, more controlled facilities.</p>
                </article>
              </div>
            </div>
            <div className="rw-material-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/uploads/rockwool/RockWool Material.jpeg"
                alt="RockWool mineral-wool core material stacked for panel production"
              />
            </div>
          </div>
        </section>

        <section className="section" id="capability">
          <div className="capability">
            <div className="capability-visual">
              <span>Factory / machine photo placeholder</span>
            </div>
            <div>
              <p className="eyebrow">Our Capability</p>
              <h2>Automation that sets a new benchmark</h2>
              <p>
                United Panel brings RockWool panel production into a fully automated line — the
                first of its kind in Malaysia. The result is repeatable quality, tighter process
                control, and panels built for professional cold room projects.
              </p>
              <ul className="capability-list">
                <li>Local manufacturing capability you can visit and verify</li>
                <li>High-level process control for consistent panel output</li>
                <li>Cold room expertise backed by United Panel’s panel heritage</li>
                <li>Technical details available on request — not published in full</li>
              </ul>
              <a className="text-link" href="#contact">
                Discuss your project →
              </a>
            </div>
          </div>
        </section>

        <section className="section" id="products">
          <div className="rw-product-split">
            <div className="rw-product-copy">
              <p className="eyebrow">The Product</p>
              <h2>What a RockWool panel is</h2>
              <p className="section-lead">
                A finished insulated sandwich panel: metal facings bonded around a dense RockWool
                stone-fibre core. Built for walls and partitions that need thermal control with
                strong fire-conscious performance.
              </p>
              <h3>Built as a complete panel system</h3>
              <p>
                Clients receive a ready panel product — not raw insulation alone. The RockWool core
                sits between protective metal skins, ready for cold rooms, food facilities,
                data-centre envelopes, and industrial walls.
              </p>
              <ul className="product-points">
                <li>
                  <strong>Fire-conscious core</strong>
                  Mineral wool is valued for non-combustible character in demanding buildings.
                </li>
                <li>
                  <strong>Stable thermal insulation</strong>
                  Helps maintain controlled temperatures in storage and facility environments.
                </li>
                <li>
                  <strong>Automated Malaysian production</strong>
                  Manufactured on United Panel’s fully automated RockWool line for consistent
                  output.
                </li>
                <li>
                  <strong>Project-matched options</strong>
                  Thickness, facing finish, and joint details confirmed with our team for your use
                  case.
                </li>
              </ul>
              <p className="product-note">
                Full technical specifications and thickness ranges are available on enquiry —
                published figures will be added once approved.
              </p>
              <a className="text-link" href="#contact">
                Request specifications →
              </a>
            </div>

            <div className="rw-product-visuals">
              <div className="panel-anatomy" aria-label="Simple panel structure">
                <div className="anatomy-layer anatomy-skin">
                  <span>Outer metal facing</span>
                </div>
                <div className="anatomy-layer anatomy-core">
                  <span>RockWool core</span>
                  <small>Stone fibre · thermal + fire-conscious</small>
                </div>
                <div className="anatomy-layer anatomy-skin">
                  <span>Inner metal facing</span>
                </div>
              </div>
              <figure className="rw-product-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/uploads/rockwool/RockWool Panels.jpeg"
                  alt="Finished RockWool insulated panel"
                />
              </figure>
            </div>
          </div>
        </section>

        <section className="section" id="certificates">
          <div className="cert-band">
            <div className="cert-intro">
              <p className="eyebrow">Assurance</p>
              <h2>Certificates &amp; compliance</h2>
              <p>
                Verified documents will sit here once issued — compact proof for buyers and
                consultants.
              </p>
            </div>
            <div className="cert-strip">
              <figure className="cert-chip">
                <div className="cert-thumb">
                  <span>Cert</span>
                </div>
                <figcaption>
                  Fire performance <em>(pending)</em>
                </figcaption>
              </figure>
              <figure className="cert-chip">
                <div className="cert-thumb">
                  <span>Cert</span>
                </div>
                <figcaption>
                  Quality / product <em>(pending)</em>
                </figcaption>
              </figure>
              <figure className="cert-chip">
                <div className="cert-thumb">
                  <span>Cert</span>
                </div>
                <figcaption>
                  Test / standards <em>(pending)</em>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="section" id="applications">
          <div className="section-head">
            <p className="eyebrow">Where It’s Used</p>
            <h2>Applications RockWool panels serve</h2>
            <p className="section-lead">
              From cold storage to mission-critical buildings — RockWool panels are chosen where
              insulation and fire-conscious construction are both important. Final suitability is
              confirmed per project.
            </p>
          </div>
          <div className="app-row app-row-4">
            <article className="app-item">
              <div className="app-image">
                <span>Photo</span>
              </div>
              <h3>Cold Rooms</h3>
              <p>Chilled storage walls and partitions for food and logistics.</p>
            </article>
            <article className="app-item">
              <div className="app-image">
                <span>Photo</span>
              </div>
              <h3>Freezers &amp; Food Facilities</h3>
              <p>Lower-temperature rooms and hygiene-critical processing spaces.</p>
            </article>
            <article className="app-item">
              <div className="app-image">
                <span>Photo</span>
              </div>
              <h3>Data Centres</h3>
              <p>
                External wall and envelope panels where fire performance and thermal control
                matter.
              </p>
            </article>
            <article className="app-item">
              <div className="app-image">
                <span>Photo</span>
              </div>
              <h3>Industrial Buildings</h3>
              <p>Warehouses and facilities needing durable insulated panel construction.</p>
            </article>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="contact-panel">
            <div>
              <p className="eyebrow">Next Step</p>
              <h2>Enquire about RockWool panels</h2>
              <p>
                Share your project needs. Our team will follow up with suitable panel options and
                specifications — detailed technical data available on request.
              </p>
              <ul className="contact-meta">
                <li>
                  <span>Email</span>
                  sales@ur.com.my
                </li>
                <li>
                  <span>Phone</span>
                  +60 00-000 0000
                </li>
                <li>
                  <span>WhatsApp</span>
                  +60 00-000 0000
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
                <textarea name="message" rows={4} placeholder="Project type, thickness needed, location…" />
              </label>
              <button className="btn btn-primary" type="submit">
                Send Enquiry
              </button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
