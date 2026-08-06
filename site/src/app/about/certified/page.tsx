import type { Metadata } from "next";
import Link from "next/link";
import { AboutShell } from "@/components/site/AboutShell";
import { CERTIFIED_PAGES } from "@/lib/certified";

export const metadata: Metadata = {
  title: "Certified Quality | United Panel-System",
};

export default function CertifiedPage() {
  return (
    <AboutShell
      title="Certified Quality"
      crumbs={[{ label: "Certified, Recognized and Approved" }]}
      activeHref="/about/certified"
      image="/uploads/pir/certs/catalogue-page-17.jpg"
    >
      <div className="about-image-grid">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/pir/certs/catalogue-page-17.jpg"
            alt="UR Certified Quality — FM Approvals featured in the PIR Catalogue"
          />
          <figcaption>Certified Quality — UR PIR Catalogue</figcaption>
        </figure>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/pir/certs/catalogue-page-18.jpg"
            alt="UR certifications including ISO, TÜV, SIRIM, Bomba and UNDP"
          />
          <figcaption>UR Certifications wall</figcaption>
        </figure>
      </div>

      <p className="about-lead">
        Quality control is an incontestable trait of UR panel products and we are well-equipped with
        the knowledge of the latest building, fire and environmental regulations.
      </p>
      <p>
        We are constantly among the first to know of any legislative developments and changes, and
        are actively involved with our customers’ consultation processes in both domestic and
        international export markets.
      </p>
      <p>
        As shown in the UR PIR Catalogue, our certifications include FM Global (FM) Approval, TÜV
        Fire Classification, BS 8414-2 external cladding fire testing, ISO 9001:2015, SIRIM Quality
        System / SIRIM QAS International, Jabatan Bomba dan Penyelamat Malaysia, and a cooperative
        agreement with the United Nations Development Programme (UNDP) towards HCFC Phase-Out
        Management Plans.
      </p>
      <p>
        These are a testament of our high standards in panel production, safety, social awareness
        and reliability — and they drive us to continuously deliver excellence to our customers.
      </p>

      <h2>Explore certifications</h2>
      <div className="about-hub-grid about-hub-grid-certs">
        {CERTIFIED_PAGES.map((cert) => (
          <Link className="about-hub-card about-hub-card-cert" href={cert.href} key={cert.slug}>
            <span className="about-hub-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cert.image} alt="" />
            </span>
            <span>
              <h3>{cert.title}</h3>
              <p>{cert.short}</p>
            </span>
          </Link>
        ))}
      </div>
    </AboutShell>
  );
}
