export type CertifiedPage = {
  slug: string;
  href: string;
  navLabel: string;
  title: string;
  short: string;
  image: string;
  heroImage?: string;
};

/** Catalogue-aligned certification tabs (UR PIR Catalogue — Certified Quality / Fire Performance). */
export const CERTIFIED_PAGES: CertifiedPage[] = [
  {
    slug: "fm-global",
    href: "/about/certified/fm-global",
    navLabel: "FM Global Approval",
    title: "FM Global (FM) Approval",
    short: "Class 1 — FM 4880 / 4881 · includes UBC-26 room test",
    image: "/uploads/pir/certs/fm.png",
    heroImage: "/uploads/pir/certs/catalogue-page-20.jpg",
  },
  {
    slug: "tuv",
    href: "/about/certified/tuv",
    navLabel: "TÜV Fire Classification",
    title: "TÜV Fire Classification",
    short: "Reaction to Fire Classification B-s1,d0 — TÜV Singapore",
    image: "/uploads/pir/certs/tuv.jpg",
    heroImage: "/uploads/pir/certs/catalogue-page-22.jpg",
  },
  {
    slug: "quality-recognition",
    href: "/about/certified/quality-recognition",
    navLabel: "ISO, SIRIM & Bomba",
    title: "ISO, SIRIM & Bomba",
    short: "ISO 9001:2015 · SIRIM QAS (incl. BS 8414-2) · Bomba Malaysia",
    image: "/uploads/pir/certs/iso.jpg",
    heroImage: "/uploads/pir/certs/catalogue-page-18.jpg",
  },
];
