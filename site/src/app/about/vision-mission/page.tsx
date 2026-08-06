import type { Metadata } from "next";
import { AboutShell } from "@/components/site/AboutShell";

export const metadata: Metadata = {
  title: "Vision & Mission | United Panel-System",
};

const IMG = {
  hero: "https://www.ur.com.my/userfiles/image/bannerpg2.png",
  mission: "/uploads/vision-mission/glueinjecting.jpg",
  vision: "/uploads/vision-mission/suction.jpg",
  auto: "/uploads/vision-mission/auto.jpg",
  quality: "/uploads/vision-mission/outsource.jpg",
  cold: "/uploads/vision-mission/cold.jpeg",
  panels: "https://www.ur.com.my/userfiles/image/smallp.png",
};

export default function VisionMissionPage() {
  return (
    <AboutShell
      title="Vision & Mission"
      crumbs={[{ label: "Vision & Mission" }]}
      activeHref="/about/vision-mission"
      image={IMG.hero}
    >
      <div className="profile">
        <header className="profile-intro">
          <p className="about-lead">
            Advanced production, in-house quality control, and products trusted across commercial
            and industrial refrigeration — that is how UR® aims to lead.
          </p>
        </header>

        <section className="profile-pillars profile-pillars-tall" aria-label="Vision and mission">
          <article className="profile-pillar">
            <div className="profile-pillar-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.mission} alt="Automated panel production at United Panel" />
            </div>
            <div className="profile-pillar-body">
              <p className="profile-kicker">Our mission</p>
              <h3>Technology-led manufacturing</h3>
              <p>
                We adopt a highly advanced technological approach in our production methods.
                Production lines are automated and equipped with compressors and temperature
                controls. Finished panels are well-aligned — a standard still difficult to achieve
                due to the expertise and cost involved.
              </p>
              <p>
                We do not outsource our work. Customers are assured of high standards of quality
                and service control.
              </p>
            </div>
          </article>
          <article className="profile-pillar">
            <div className="profile-pillar-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.vision} alt="UR insulated panels ready for cold storage projects" />
            </div>
            <div className="profile-pillar-body">
              <p className="profile-kicker">Our vision</p>
              <h3>Lead through excellence</h3>
              <p>
                All of us at UR® take great pride in the quality products that we manufacture and
                provide. We aim to be a leader in our field and will continue to strive towards
                products and service excellence.
              </p>
            </div>
          </article>
        </section>

        <section className="profile-split" aria-labelledby="vm-deliver">
          <div className="profile-split-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.cold} alt="Cold storage and refrigeration applications" />
          </div>
          <div className="profile-split-copy">
            <p className="profile-kicker">Where we serve</p>
            <h2 id="vm-deliver">Trusted across industries</h2>
            <p>
              Our reliable products have gained acceptance and recognition from customers and are
              widely used in restaurants, hotels, resorts, bakeries, supermarkets and other
              commercial and industrial applications.
            </p>
            <ul className="profile-checklist">
              <li>Restaurants, hotels &amp; resorts</li>
              <li>Bakeries &amp; supermarkets</li>
              <li>Commercial &amp; industrial cold storage</li>
            </ul>
          </div>
        </section>

        <section className="profile-feature-row" aria-label="How we deliver">
          <article>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.auto} alt="In-house automated production line" />
            <h3>Automated lines</h3>
            <p>Compressors, temperature controls, and precise panel alignment in-house.</p>
          </article>
          <article>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.quality} alt="Quality-controlled panel manufacturing" />
            <h3>No outsourcing</h3>
            <p>Quality and service stay under our control from production to delivery.</p>
          </article>
          <article>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.panels} alt="Finished insulated panels" />
            <h3>Proven products</h3>
            <p>Accepted and recognised by customers across refrigeration sectors.</p>
          </article>
        </section>
      </div>
    </AboutShell>
  );
}
