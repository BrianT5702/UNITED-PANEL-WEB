export type ProductIntroSection = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  points: string[];
  image: string;
  href: string;
  cta: string;
};

/** Brief hub intros for /products — full specs live on each product page */
export const productIntroSections: ProductIntroSection[] = [
  {
    id: "pir",
    eyebrow: "PIR",
    title: "Polyisocyanurate panels",
    summary:
      "ASEAN’s first PIR Double Belt Continuous Line — FM Approved Class 1, TÜV B-s1,d0, and BS 8414-2 tested. Built in-house for cold rooms and industrial envelopes.",
    points: [
      "FM 4880 / 4881 Class 1 — no height restriction",
      "Continuous-line consistency and finish options",
      "Full thicknesses, joints, and specs on the PIR page",
    ],
    image: "/uploads/pir/UNITED.jpeg",
    href: "/products/pir",
    cta: "View PIR panels →",
  },
  {
    id: "pu",
    eyebrow: "PU / PUR",
    title: "Polyurethane panels",
    summary:
      "Rigid PU foam panels for refrigeration and cold storage — high insulation in a modest thickness, with clip-lock / cam-lock joints and SIRIM-listed, Bomba-approved quality.",
    points: [
      "50–250 mm cores, 1150 mm width, custom length",
      "Clip-lock, cam-lock and semi cam-lock joints",
      "SIRIM QAS listed · Bomba approved · CFC-free",
    ],
    image: "/uploads/pu/apps/install-blue-warehouse.jpg",
    href: "/products/pu",
    cta: "View PU panels →",
  },
  {
    id: "rockwool",
    eyebrow: "RockWool",
    title: "Mineral-wool panels",
    summary:
      "RockWool core panels from Malaysia’s first fully automated RockWool line — a fire-conscious option beside our PIR and PU systems.",
    points: [
      "Mineral-wool (stone fibre) core",
      "Built for fire-conscious cold rooms and envelopes",
      "Same in-house manufacturing discipline as our foam lines",
    ],
    image: "/uploads/About/FactoryLook.png",
    href: "/products/rockwool",
    cta: "View RockWool panels →",
  },
];
