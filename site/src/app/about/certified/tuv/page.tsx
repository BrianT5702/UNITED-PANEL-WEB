import type { Metadata } from "next";
import { AboutShell } from "@/components/site/AboutShell";

export const metadata: Metadata = {
  title: "TÜV Fire Classification | United Panel-System",
};

export default function TuvPage() {
  return (
    <AboutShell
      title="TÜV Fire Classification"
      crumbs={[
        { label: "Certified, Recognized and Approved", href: "/about/certified" },
        { label: "TÜV Fire Classification" },
      ]}
      activeHref="/about/certified/tuv"
      image="/uploads/pir/certs/catalogue-page-22.jpg"
    >
      <figure className="about-figure about-figure-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/uploads/pir/certs/tuv.jpg" alt="TÜV SÜD certification mark" />
        <figcaption>TÜV SÜD</figcaption>
      </figure>

      <p className="about-lead">
        Product safety is of the utmost importance to us and our customers. In addition to obtaining
        FM Global (FM) approval and to ensure that our panels meet the legal and safety requirements
        of relevant bodies and countries, <strong>UR PIR panel</strong> has been tested and
        classified by <strong>TÜV Singapore</strong> with a rating of:
      </p>

      <p className="about-highlight">REACTION TO FIRE CLASSIFICATION: B-s1,d0</p>

      <p>
        This classification is in relation to UR PIR panel’s reaction to fire behaviour, smoke
        production and flaming droplets.
      </p>

      <figure className="about-figure about-figure-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uploads/pir/certs/catalogue-page-22.jpg"
          alt="TÜV Fire Classification certificates from the UR PIR Catalogue"
        />
        <figcaption>TÜV Fire Classification</figcaption>
      </figure>

      <p>Kindly contact us for the full report and further test details.</p>
      <a className="text-link" href="/contact">
        Contact us →
      </a>
    </AboutShell>
  );
}
