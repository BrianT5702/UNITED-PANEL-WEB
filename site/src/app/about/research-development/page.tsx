import type { Metadata } from "next";
import Link from "next/link";
import { AboutShell } from "@/components/site/AboutShell";

export const metadata: Metadata = {
  title: "Research & Development | United Panel-System",
};

const IMG = {
  hero: "https://www.ur.com.my/userFiles/image/6.jpg",
  approach: "https://www.ur.com.my/userfiles/image/rnd.png",
  rockwool: "/uploads/rockwool/RockWool Panel 3.jpeg",
};

export default function ResearchDevelopmentPage() {
  return (
    <AboutShell
      title="Research & Development"
      crumbs={[{ label: "Research & Development" }]}
      activeHref="/about/research-development"
      image={IMG.hero}
    >
      <div className="profile">
        <header className="profile-intro">
          <p className="about-lead">
            Continuous research and development — using computer-aided engineering — keeps our
            production methods, skills, and knowledge moving forward.
          </p>
        </header>

        <section className="profile-split" aria-labelledby="rd-story">
          <div className="profile-split-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.approach} alt="United Panel research and development" />
          </div>
          <div className="profile-split-copy">
            <p className="profile-kicker">Our approach</p>
            <h2 id="rd-story">Engineering-led improvement</h2>
            <p>
              We acknowledge the need to continually conduct research and development in the usage
              of computer-aided engineering to further expand our skills and knowledge base in our
              production methods.
            </p>
            <p>
              Experience and expertise in this field enable us to properly utilise the latest
              technologies available and embed them in our designs.
            </p>
          </div>
        </section>

        <section className="profile-split profile-split-reverse" aria-labelledby="rd-rockwool">
          <div className="profile-split-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMG.rockwool}
              alt="UR RockWool mineral-wool core panel"
            />
          </div>
          <div className="profile-split-copy">
            <p className="profile-kicker">New capability</p>
            <h2 id="rd-rockwool">RockWool panels</h2>
            <p>
              Alongside our PU and PIR range, we now manufacture RockWool mineral-wool core
              panels on Malaysia’s first fully automated RockWool production line — expanding
              options for fire-conscious cold room and industrial projects.
            </p>
            <p>
              Same in-house manufacturing discipline, with a mineral-wool core engineered for
              cold storage and building envelope use.
            </p>
            <p className="profile-inline-link">
              <Link href="/products/rockwool">Learn more about RockWool →</Link>
            </p>
          </div>
        </section>
      </div>
    </AboutShell>
  );
}
