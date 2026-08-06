export type NavItem = { label: string; href: string };

export type HeroContent = {
  brand: string;
  headline: string;
  lead: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  backgroundImage: string;
  mediaLabel: string;
};

export type ProofItem = {
  id: string;
  index: string;
  title: string;
  text: string;
};

export type ProofContent = {
  items: ProofItem[];
};

export type ProductItem = {
  id: string;
  title: string;
  text: string;
  image: string;
  href: string;
};

export type ProductsContent = {
  eyebrow: string;
  title: string;
  lead: string;
  items: ProductItem[];
};

/** Compact homepage teasers (parts, services) */
export type OfferItem = {
  id: string;
  title: string;
  text: string;
  image: string;
  href: string;
};

export type OfferContent = {
  eyebrow: string;
  title: string;
  lead: string;
  items: OfferItem[];
};

export type CapabilityContent = {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  points: string[];
  ctaLabel: string;
  ctaHref: string;
};

export type CertificateItem = {
  id: string;
  label: string;
  thumb: string;
  href: string;
};

export type CertificatesContent = {
  eyebrow: string;
  title: string;
  lead: string;
  items: CertificateItem[];
};

export type NewsItem = {
  id: string;
  date: string;
  title: string;
  href: string;
};

export type NewsContent = {
  visible: boolean;
  eyebrow: string;
  title: string;
  items: NewsItem[];
};

export type ContactContent = {
  eyebrow: string;
  title: string;
  body: string;
  email: string;
  phone: string;
  whatsapp: string;
};

export type FooterContent = {
  companyName: string;
  tagline: string;
  copyright: string;
  note: string;
};

export type SiteSettings = {
  logoUrl: string;
  siteName: string;
};

export type HomeContent = {
  settings: SiteSettings;
  nav: { items: NavItem[] };
  hero: HeroContent;
  proof: ProofContent;
  products: ProductsContent;
  parts: OfferContent;
  services: OfferContent;
  capability: CapabilityContent;
  certificates: CertificatesContent;
  news: NewsContent;
  contact: ContactContent;
  footer: FooterContent;
};

export const HOME_SECTION_KEYS = [
  "settings",
  "nav",
  "hero",
  "proof",
  "products",
  "parts",
  "services",
  "capability",
  "certificates",
  "news",
  "contact",
  "footer",
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export const SECTION_LABELS: Record<HomeSectionKey, string> = {
  settings: "Site settings",
  nav: "Navigation",
  hero: "Hero",
  proof: "Proof points",
  products: "Panels (main)",
  parts: "Refrigeration parts",
  services: "Services",
  capability: "Capability",
  certificates: "Certificates",
  news: "News teaser",
  contact: "Contact CTA",
  footer: "Footer",
};
