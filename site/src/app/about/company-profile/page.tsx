import type { Metadata } from "next";
import { AboutShell } from "@/components/site/AboutShell";

export const metadata: Metadata = {
  title: "Company Profile | United Panel-System",
};

const IMG = {
  factory: "https://www.ur.com.my/userfiles/image/newfactoryoutlok.png",
  panels: "https://www.ur.com.my/userfiles/image/smallp.png",
  quality: "https://www.ur.com.my/userFiles/image/8.jpg",
  line: "https://www.ur.com.my/userFiles/image/4.jpg",
  parts: "https://www.ur.com.my/userfiles/image/front-spare-part.jpg",
  banner: "https://www.ur.com.my/userfiles/image/bannerpg2.png",
};

export default function CompanyProfilePage() {
  return (
    <AboutShell
      title="Company Profile"
      crumbs={[{ label: "Company Profile" }]}
      activeHref="/about/company-profile"
      image={IMG.factory}
    >
      <div className="profile">
        <header className="profile-intro">
          <p className="about-lead">
            Since 1978, United Panel-System (M) Sdn. Bhd. has specialised in insulated panels
            for walk-in cold rooms and refrigeration storage — proudly made in Malaysia.
          </p>
          <ul className="profile-stats" aria-label="Company highlights">
            <li>
              <strong>1978</strong>
              <span>Established</span>
            </li>
            <li>
              <strong>Johor</strong>
              <span>HQ &amp; factory</span>
            </li>
            <li>
              <strong>ASEAN</strong>
              <span>First PIR Double Belt Continuous Line*</span>
            </li>
            <li>
              <strong>FM</strong>
              <span>Approved PIR panels</span>
            </li>
          </ul>
          <p className="about-note">*as of December 31, 2015</p>
        </header>

        <section className="profile-split" aria-labelledby="profile-story">
          <div className="profile-split-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.factory} alt="United Panel-System manufacturing facility in Johor" />
          </div>
          <div className="profile-split-copy">
            <p className="profile-kicker">Our story</p>
            <h2 id="profile-story">Built for cold storage</h2>
            <p>
              Formerly United Refrigerator Trading Sdn. Bhd., we produce injection polyurethane
              (PU), polyisocyanurate (PIR) and RockWool insulated panels for
              commercial and industrial refrigeration.
            </p>
            <p>
              Head office and production sit in Johor. Being Malaysia’s largest multi-purpose
              plant of its kind, we also supply a complete range of refrigeration system products.
            </p>
          </div>
        </section>

        <section className="profile-pillars" aria-label="What sets us apart">
          <article className="profile-pillar">
            <div className="profile-pillar-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.line} alt="Automated panel production" />
            </div>
            <div className="profile-pillar-body">
              <h3>In-house production</h3>
              <p>
                First and only PIR Double Belt Continuous Line in ASEAN* for cold store panels
                and roofing. FM Approved PIR panels are manufactured in-house on a fully
                automated continuous line.
              </p>
            </div>
          </article>
          <article className="profile-pillar">
            <div className="profile-pillar-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.quality} alt="UR insulated panel products" />
            </div>
            <div className="profile-pillar-body">
              <h3>Trusted quality</h3>
              <p>
                Decades of industry experience and product quality have earned continued support
                from customers across commercial and industrial refrigeration.
              </p>
            </div>
          </article>
        </section>

        <section className="profile-gallery" aria-label="Facilities and products">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.banner} alt="United Panel manufacturing environment" />
            <figcaption>Manufacturing</figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.parts} alt="Refrigeration parts and systems" />
            <figcaption>Systems &amp; parts</figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.panels} alt="Insulated panel detailing" />
            <figcaption>Panel products</figcaption>
          </figure>
        </section>
      </div>
    </AboutShell>
  );
}
