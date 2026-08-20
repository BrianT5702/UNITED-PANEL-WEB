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
      "Rigid PU foam panels favoured for refrigeration and cold storage — strong thermal performance, moisture resistance, and food-grade suitability in a modest thickness.",
    points: [
      "High insulation in a slim core",
      "Moisture, corrosion, and structural strength",
      "SIRIM-backed quality for cold storage projects",
    ],
    image: "/uploads/About/manufacturing.png",
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
