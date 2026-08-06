import type { HomeContent } from "./types";

export const defaultHomeContent: HomeContent = {
  settings: {
    logoUrl: "https://www.ur.com.my/images/logo-2.png",
    siteName: "United Panel-System",
  },
  nav: {
    items: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about" },
      { label: "Products", href: "/products" },
      { label: "Services", href: "/services" },
      { label: "Refrigeration Parts", href: "/parts" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  hero: {
    brand: "United Panel-System",
    headline: "Solutions for your cold storage needs",
    lead: "Insulated panels, refrigeration parts, and advisory services — one stop for cold storage projects in Malaysia.",
    primaryCtaLabel: "View products",
    primaryCtaHref: "/products",
    secondaryCtaLabel: "Contact us",
    secondaryCtaHref: "/contact",
    backgroundImage: "https://www.ur.com.my/userfiles/image/WIW3.png",
    mediaLabel: "",
  },
  proof: {
    items: [
      {
        id: "p1",
        index: "01",
        title: "ASEAN PIR Double Belt Line",
        text: "First and only PIR Double Belt Continuous Line in ASEAN for cold store panels.",
      },
      {
        id: "p2",
        index: "02",
        title: "FM Approved PIR panels",
        text: "Fire-rated insulated panel solutions trusted for commercial and industrial cold storage.",
      },
      {
        id: "p3",
        index: "03",
        title: "Made in Malaysia since 1978",
        text: "Decades of cold room panel expertise from our manufacturing facilities in Johor.",
      },
    ],
  },
  products: {
    eyebrow: "Products",
    title: "Insulated panel systems",
    lead: "Overview of our panel range — open each product for full specifications and details.",
    items: [
      {
        id: "pir",
        title: "PIR Panels",
        text: "FM Approved polyisocyanurate panels from our continuous production line.",
        image: "/uploads/pir/facility.jpg",
        href: "/products/pir",
      },
      {
        id: "pur",
        title: "PU Panels",
        text: "Customisable polyurethane panels for cold storage construction.",
        image: "https://www.ur.com.my/userfiles/image/pro-pu-panel-01.jpg",
        href: "/products/pu",
      },
      {
        id: "rockwool",
        title: "RockWool Panels",
        text: "Mineral-wool core panels from Malaysia’s first fully automated RockWool line.",
        image: "/uploads/rockwool/RockWool Panels.jpeg",
        href: "/products/rockwool",
      },
    ],
  },
  parts: {
    eyebrow: "2 · Refrigeration parts",
    title: "Authorised parts & brands",
    lead: "We distribute world-renowned refrigeration components — compressors, controls, and system parts.",
    items: [
      {
        id: "parts-main",
        title: "Refrigeration Parts",
        text: "Authorised distributor for leading brands used across cold storage and refrigeration systems.",
        image: "https://www.ur.com.my/userfiles/image/front-spare-part.jpg",
        href: "/parts",
      },
      {
        id: "parts-brands",
        title: "Brand partners",
        text: "Bitzer, LU-VE, Danfoss, Emerson, and more — exclusive and authorised lines.",
        image: "https://www.ur.com.my/userfiles/image/blankk1.png",
        href: "/parts",
      },
    ],
  },
  services: {
    eyebrow: "3 · Services",
    title: "Advisory & project support",
    lead: "Experienced guidance for cold storage planning, panel selection, and project delivery.",
    items: [
      {
        id: "svc-advisory",
        title: "Advisory Services",
        text: "Comprehensive advisory for cold storage design, panel choice, and project requirements.",
        image: "https://www.ur.com.my/userfiles/image/fronad2.jpg",
        href: "/services",
      },
      {
        id: "svc-solutions",
        title: "Cold storage solutions",
        text: "End-to-end support for walk-in cold rooms, freezers, and industrial refrigeration facilities.",
        image: "https://www.ur.com.my/userfiles/image/bannerpg2.png",
        href: "/services",
      },
    ],
  },
  capability: {
    eyebrow: "Our capability",
    title: "Automated manufacturing you can trust",
    body: "Advanced continuous production in Malaysia — consistent quality for cold storage and industrial projects.",
    image: "https://www.ur.com.my/userfiles/image/bannerpg2.png",
    points: [
      "Continuous PIR production line — ASEAN first & only",
      "In-house manufacturing with tight quality control",
      "New RockWool automated line in Malaysia",
    ],
    ctaLabel: "Talk to our team →",
    ctaHref: "#contact",
  },
  certificates: {
    eyebrow: "Assurance",
    title: "Certificates & compliance",
    lead: "Independent certification and approvals that give buyers and consultants confidence.",
    items: [
      {
        id: "c1",
        label: "FM Global Approval",
        thumb: "",
        href: "https://www.ur.com.my/fm-global-approval-36.aspx",
      },
      {
        id: "c2",
        label: "ISO 9001:2015",
        thumb: "",
        href: "",
      },
      {
        id: "c3",
        label: "TÜV Classification",
        thumb: "",
        href: "",
      },
    ],
  },
  news: {
    visible: false,
    eyebrow: "News",
    title: "Latest updates",
    items: [
      {
        id: "n1",
        date: "01/Jul/23",
        title: "Malaysian International Food & Beverage Fair",
        href: "#",
      },
    ],
  },
  contact: {
    eyebrow: "Next step",
    title: "Enquire about your project",
    body: "Tell us about panels, parts, or advisory needs. Our team will follow up with suitable options.",
    email: "sales@ur.com.my",
    phone: "+60 00-000 0000",
    whatsapp: "+60 00-000 0000",
  },
  footer: {
    companyName: "United Panel-System(M) Sdn Bhd",
    tagline: "One stop solution for your cold storage needs",
    copyright: "All Rights Reserved. {year} United Panel-System(M) Sdn Bhd. (772009-A)",
    note: "",
  },
};
