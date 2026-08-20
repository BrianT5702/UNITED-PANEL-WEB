import type { PanelProductContent } from "./panels";
import type { PageDocument, PageSection } from "./page-document";
import { newId } from "./page-document";

/** Convert a product panel blob into editable page sections */
export function panelProductToDocument(content: PanelProductContent): PageDocument {
  const sections: PageSection[] = [];

  sections.push({
    id: newId("hero"),
    type: "hero",
    data: {
      brand: content.brand,
      headline: content.headline,
      lead: content.lead,
      tagline: content.tagline,
      backgroundImage: content.heroImage,
      buttons: [],
    },
  });

  if (content.proof?.length) {
    sections.push({
      id: newId("proof"),
      type: "proof",
      data: { items: content.proof.map((p) => ({ ...p })) },
    });
  }

  sections.push({
    id: newId("overview"),
    type: "mediaText",
    columns: 2,
    data: {
      eyebrow: content.overviewEyebrow,
      title: content.overviewTitle,
      body: content.overviewBody1,
      body2: content.overviewBody2,
      image: content.overviewImage,
      images: content.overviewImages?.map((src, i) => ({
        id: newId(`ov${i}`),
        src,
        alt: "Overview photo",
      })),
      linkLabel: content.overviewLinkLabel,
      linkHref: content.overviewLinkHref,
      imageSide: "left",
    },
  });

  sections.push({
    id: newId("features"),
    type: "featureList",
    data: {
      eyebrow: content.featuresEyebrow,
      title: content.featuresTitle,
      lead: content.featuresLead,
      items: [...content.features],
    },
  });

  if (content.finishes?.items?.length) {
    sections.push({
      id: newId("finishes"),
      type: "cardGrid",
      columns: 3,
      data: {
        eyebrow: content.finishes.eyebrow,
        title: content.finishes.title,
        lead: content.finishes.lead,
        items: content.finishes.items.map((item, i) => ({
          id: newId(`fin${i}`),
          title: item.name,
          text: item.alt || "",
          image: item.image,
        })),
      },
    });
  }

  if (content.applications) {
    sections.push({
      id: newId("apps"),
      type: "featureList",
      data: {
        eyebrow: content.applications.eyebrow,
        title: content.applications.title,
        lead: content.applications.lead,
        items: [...content.applications.items],
        images: content.applications.images?.map((img, i) => ({
          id: newId(`ag${i}`),
          src: img.src,
          alt: img.alt,
        })),
      },
    });
  }

  if (content.jointDetails) {
    sections.push({
      id: "joint",
      type: "jointDetails",
      data: {
        eyebrow: content.jointDetails.eyebrow,
        title: content.jointDetails.title,
        summary: content.jointDetails.summary,
        body: content.jointDetails.body,
        image: content.jointDetails.image,
        imageAlt: content.jointDetails.imageAlt,
        toggleLabel: "Show joint details",
        hideLabel: "Hide joint details",
        pages: (content.jointDetails.pages || []).map((page, i) => ({
          id: newId(`jp${i}`),
          title: page.title,
          lead: page.lead,
          src: page.src,
          alt: page.alt,
        })),
      },
    });
  }

  sections.push({
    id: newId("specs"),
    type: "specsTable",
    data: {
      eyebrow: content.specsEyebrow,
      title: content.specsTitle,
      lead: content.specsLead,
      rows: content.specs.map((r) => ({ ...r })),
    },
  });

  if (content.physicalProperties) {
    sections.push({
      id: newId("props"),
      type: "dataTable",
      data: {
        eyebrow: content.physicalProperties.eyebrow,
        title: content.physicalProperties.title,
        lead: content.physicalProperties.lead,
        headers: [...content.physicalProperties.headers],
        rows: content.physicalProperties.rows.map((r) => [...r]),
        note: content.physicalProperties.note,
      },
    });
  }

  if (content.roofing) {
    sections.push({
      id: newId("roofing"),
      type: "specsTable",
      data: {
        eyebrow: content.roofing.eyebrow,
        title: content.roofing.title,
        lead: content.roofing.body,
        rows: content.roofing.specs.map((r) => ({ ...r })),
      },
    });
    if (content.roofing.note) {
      sections.push({
        id: newId("roofnote"),
        type: "callout",
        data: { body: content.roofing.note },
      });
    }
  }

  if (content.certifications?.length) {
    sections.push({
      id: newId("certs"),
      type: "cardGrid",
      columns: 3,
      data: {
        eyebrow: content.certsEyebrow,
        title: content.certsTitle,
        lead: content.certsLead,
        items: content.certifications.map((c) => ({
          id: c.id,
          title: c.name,
          text: c.detail,
          image: c.image,
          href: c.href,
        })),
      },
    });
  }

  if (content.gallery?.length) {
    sections.push({
      id: newId("gallery"),
      type: "gallery",
      columns: 3,
      data: {
        title: "Gallery",
        items: content.gallery.map((g, i) => ({
          id: newId(`g${i}`),
          src: g.src,
          alt: g.alt,
        })),
      },
    });
  }

  if (content.related?.length) {
    sections.push({
      id: newId("related"),
      type: "cardGrid",
      columns: 2,
      data: {
        eyebrow: "Related",
        title: "Other panel systems",
        items: content.related.map((r, i) => ({
          id: newId(`rel${i}`),
          title: r.title,
          text: r.text,
          image: r.image,
          href: r.href,
        })),
      },
    });
  }

  sections.push({
    id: newId("contact"),
    type: "contactCta",
    data: {
      eyebrow: content.contactEyebrow,
      title: content.contactTitle,
      body: content.contactBody,
      fields: [
        ...(content.email
          ? [{ id: newId("cf"), label: "Email", value: content.email }]
          : []),
        ...(content.phone
          ? [{ id: newId("cf"), label: "Phone", value: content.phone }]
          : []),
        ...(content.whatsapp
          ? [{ id: newId("cf"), label: "WhatsApp", value: content.whatsapp }]
          : []),
      ],
      ctaLabel: "Contact Us",
      ctaHref: "/contact",
    },
  });

  return {
    title: content.headline,
    chrome: "default",
    sections,
  };
}
