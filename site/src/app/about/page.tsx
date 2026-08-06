import type { Metadata } from "next";
import Link from "next/link";
import { AboutShell, ABOUT_NAV } from "@/components/site/AboutShell";

export const metadata: Metadata = {
  title: "About Us | United Panel-System",
  description:
    "Company profile, vision & mission, R&D, and certifications — United Panel-System (M) Sdn Bhd.",
};

export default function AboutIndexPage() {
  return (
    <AboutShell
      title="About Us"
      crumbs={[]}
      activeHref="/about"
      image="https://www.ur.com.my/userfiles/image/newfactoryoutlok.png"
    >
      <figure className="about-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.ur.com.my/userfiles/image/newfactoryoutlok.png"
          alt="United Panel-System facility"
        />
        <figcaption>United Panel-System — Based in Johor, Malaysia</figcaption>
      </figure>
      <p className="about-lead">
        Learn about United Panel-System — our history, mission, research focus, and the
        certifications that back our cold storage panel solutions.
      </p>
      <div className="about-hub-grid">
        {ABOUT_NAV.map((item) => (
          <Link className="about-hub-card" href={item.href} key={item.href}>
            <h2>{item.label}</h2>
            {item.children ? (
              <p>{item.children.map((c) => c.label).join(" · ")}</p>
            ) : (
              <p>Read more →</p>
            )}
          </Link>
        ))}
      </div>
    </AboutShell>
  );
}
