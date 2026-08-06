import type { Metadata } from "next";
import { AboutShell } from "@/components/site/AboutShell";

export const metadata: Metadata = {
  title: "ISO, SIRIM & Bomba | United Panel-System",
};

export default function QualityRecognitionPage() {
  return (
    <AboutShell
      title="ISO, SIRIM & Bomba"
      crumbs={[
        { label: "Certified, Recognized and Approved", href: "/about/certified" },
        { label: "ISO, SIRIM & Bomba" },
      ]}
      activeHref="/about/certified/quality-recognition"
      image="/uploads/pir/certs/catalogue-page-18.jpg"
    >
      <p className="about-lead">
        Alongside FM Global and TÜV fire classification, UR panel products are listed in the UR PIR
        Catalogue under quality and local recognition marks — including ISO 9001:2015, SIRIM QAS
        International (including BS 8414-2 cladding fire testing), and Jabatan Bomba dan Penyelamat
        Malaysia.
      </p>

      <div className="about-image-grid about-logo-trio">
        <figure className="about-figure-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uploads/pir/certs/iso.jpg" alt="ISO 9001:2015 certification mark" />
          <figcaption>ISO 9001:2015</figcaption>
        </figure>
        <figure className="about-figure-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uploads/pir/certs/sirim.jpg" alt="SIRIM QAS International logo" />
          <figcaption>SIRIM QAS International</figcaption>
        </figure>
        <figure className="about-figure-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/pir/certs/bomba.png"
            alt="Jabatan Bomba dan Penyelamat Malaysia crest"
          />
          <figcaption>Bomba Malaysia</figcaption>
        </figure>
      </div>

      <h2>ISO 9001:2015</h2>
      <p>
        UNITED PANEL-SYSTEM (M) SDN BHD is an ISO certified company — a mark of our commitment
        towards continuous improvement of our quality products. Certification No.{" "}
        <strong>17975-A</strong>.
      </p>

      <h2>SIRIM QAS International</h2>
      <p>
        UR® panel is a certified and listed product by SIRIM QAS International — a recognised
        international body for quality excellence. The catalogue also shows SIRIM Quality System
        recognition among UR Certifications.
      </p>
      <p>
        Under SIRIM QAS International, UR PIR insulated panels have also{" "}
        <strong>passed and met the requirements when tested to BS 8414-2</strong> for external
        cladding systems. BS 8414 assesses fire safety of cladding applied to the external face of a
        building on a realistic scale.
      </p>

      <div className="about-image-grid">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/pir/certs/catalogue-page-23.jpg"
            alt="External Cladding Fire Test — UR PIR Catalogue"
          />
          <figcaption>External Cladding Fire Test</figcaption>
        </figure>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/pir/certs/catalogue-page-24.jpg"
            alt="BS 8414-2 fire test sequence — SIRIM QAS International"
          />
          <figcaption>BS 8414-2 test — SIRIM QAS International</figcaption>
        </figure>
      </div>

      <h2>Jabatan Bomba dan Penyelamat Malaysia</h2>
      <p>
        Locally, our insulation panels have been tested and approved by the Fire and Rescue
        Department of Malaysia (Bomba) for commercial and industrial use.
      </p>

      <figure className="about-figure about-figure-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uploads/pir/certs/catalogue-page-18.jpg"
          alt="UR Certifications wall from the UR PIR Catalogue"
        />
        <figcaption>UR Certifications</figcaption>
      </figure>

      <a className="text-link" href="/contact">
        Contact us →
      </a>
    </AboutShell>
  );
}
