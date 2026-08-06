import type { Metadata } from "next";
import { AboutShell } from "@/components/site/AboutShell";

export const metadata: Metadata = {
  title: "FM Global (FM) Approval | United Panel-System",
};

export default function FmGlobalPage() {
  return (
    <AboutShell
      title="FM Global (FM) Approval"
      crumbs={[
        { label: "Certified, Recognized and Approved", href: "/about/certified" },
        { label: "FM Global Approval" },
      ]}
      activeHref="/about/certified/fm-global"
      image="/uploads/pir/certs/catalogue-page-20.jpg"
    >
      <figure className="about-figure about-figure-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uploads/pir/certs/fm.png"
          alt="FM APPROVED and FM Approvals logos"
        />
        <figcaption>FM APPROVED · FM Approvals — Member of the FM Global Group</figcaption>
      </figure>

      <p className="about-lead">
        PIR is recognised by the industry as the fire safe alternative to other foam cores.{" "}
        <strong>UR PIR panel is FM Global (FM) APPROVED.</strong> FM Global (FM) has a stringent
        test for assessing reaction to fire, and certification is a testament of meeting the
        industry’s insurance needs.
      </p>
      <p>
        The FM APPROVED mark, which is backed by rigorous testing and research benchmark standards,
        ensures customers that the products they receive conform to the highest standards.
      </p>
      <p>
        <strong>UR PIR panels obtained Class 1 fire rating</strong> of insulated wall or wall and
        roof/ceiling panels, interior finish materials or coatings, and exterior wall systems
        according to <strong>FM Approvals Standard 4880</strong>. In addition, our panels fall in
        accordance with <strong>FM Approval Standard 4881</strong> for exterior wall systems.
      </p>
      <p>These ratings for our panels are valid without height restrictions.</p>
      <p>
        Together with our existing fire reports and certifications, we are able to offer our
        customers more solutions for their fire performance requirements.
      </p>

      <p className="about-highlight">Not FM Approved ≠ PIR</p>

      <figure className="about-figure about-figure-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uploads/pir/certs/page20-hires.jpg"
          alt="FM Global Approval page from the UR PIR Catalogue"
        />
        <figcaption>FM Global (FM) Approval</figcaption>
      </figure>

      <h2>FM Room Test (UBC-26)</h2>
      <p>
        In order to obtain FM Approvals Standard 4880, UR PIR panels are subjected to a number of
        stringent tests. One of these tests is the UBC-26 room test.
      </p>
      <p>
        UR PIR panels test results show that fire is contained in the room and there is no fire
        propagation to the extremities of the panel construction.
      </p>
      <ul className="about-bullet-list">
        <li>Fire ignition of 200 mm thick UR PIR panels</li>
        <li>Fire is contained in the room with no fire propagation</li>
        <li>
          Charring of core material (&lt; 6.4 mm) indicated no spread of flame, flashover or fire
          travel between facers
        </li>
      </ul>

      <div className="about-image-grid">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/pir/certs/fm-room.jpg"
            alt="FM Room Test — fire contained in the room"
          />
          <figcaption>Fire contained with no propagation</figcaption>
        </figure>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/pir/certs/catalogue-page-21.jpg"
            alt="FM Room Test (UBC-26) photo sequence from the UR PIR Catalogue"
          />
          <figcaption>Source: UR PIR Catalogue — FM Room Test</figcaption>
        </figure>
      </div>

      <p>
        To verify UR® FM approved PIR panel, visit{" "}
        <a href="https://www.approvalguide.com" target="_blank" rel="noreferrer">
          www.approvalguide.com
        </a>
        .
      </p>
      <a className="text-link" href="/contact">
        Contact us →
      </a>
    </AboutShell>
  );
}
