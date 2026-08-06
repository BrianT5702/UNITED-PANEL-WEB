export type ProductIntroSection = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  points: string[];
  body?: string[];
  tableTitle?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  note?: string;
  image: string;
  href: string;
  cta: string;
};

/** Overview content adapted from ur.com.my United Panel Introduction + current RockWool line */
export const productIntroSections: ProductIntroSection[] = [
  {
    id: "pir",
    eyebrow: "About PIR",
    title: "Polyisocyanurate (PIR)",
    summary:
      "ASEAN’s first and only PIR Double Belt Continuous Line. FM Global (FM) approved Class 1 (4880 / 4881, no height restriction), TÜV B-s1,d0, and BS 8414-2 tested — manufactured in-house and delivered ready for installation.",
    points: [
      "ASEAN’s first & only PIR Double Belt Continuous Line",
      "FM Approvals 4880 / 4881 Class 1 — valid without height restrictions",
      "TÜV Reaction to Fire Classification B-s1,d0",
      "Passed BS 8414-2 external cladding fire test",
      "Insulation panels 50–200 mm · width 1150 mm · any desired length",
      "Roof panels 25 mm / 40 mm · cover width 1000 mm",
      "PPGI and PVC-laminated steel skins · Ribbed / Micro Lining / Flat finishes",
    ],
    body: [
      "PIR panels are available in a range of profiles, thicknesses and finishes. Typical physical properties in the catalogue include core density 40.1 kg/m³, thermal conductivity 20.35 mW/m·K, and closed cell content 93%.",
      "UR PIR roof panels are offered in 25 mm and 40 mm core thicknesses with 1000 mm cover width.",
    ],
    image: "/uploads/pir/facility.jpg",
    href: "/products/pir",
    cta: "View PIR panels & specs →",
  },
  {
    id: "pu",
    eyebrow: "About PU / PUR",
    title: "Polyurethane (PU)",
    summary:
      "Polyurethane (PUR), commonly called PU, is used in UR® panels. Rigid polyurethane foam is favoured for refrigeration and cold storage panels because of its mechanical, chemical, biological and moisture properties.",
    points: [
      "Food grade compliance",
      "Superior thermal performance",
      "Moisture and corrosion resistance",
      "High density mechanical strength",
      "Fire retardant (incorporated)",
      "CFC free",
    ],
    body: [
      "Insulation performance for PU panels is high even with a modest material thickness. Air and water cannot circulate within the panel walls, which supports better insulation and installation in varied weather conditions.",
      "PU panels are particularly suitable for wall and roof applications due to their structural strength. In the event of fire, the foam does not drip or run, helping minimise flammable mass and limit flame spread. Full typical physical properties are listed on the PU product page.",
    ],
    note: "UR® panels have been certified by SIRIM QAS International and approved by the Malaysia fire authorities (BOMBA).",
    image: "https://www.ur.com.my/userfiles/image/pro-pu-panel-01.jpg",
    href: "/products/pu",
    cta: "View PU panels & specs →",
  },
  {
    id: "rockwool",
    eyebrow: "About RockWool",
    title: "RockWool mineral-wool panels",
    summary:
      "Alongside PIR and PU, United Panel now manufactures RockWool mineral-wool core panels on Malaysia’s first fully automated RockWool production line — expanding options for fire-conscious cold room and industrial projects.",
    points: [
      "Mineral-wool (stone fibre) core",
      "Strong fire-conscious performance for envelopes and cold rooms",
      "Same in-house manufacturing discipline as our foam panel lines",
      "Suitable for cold storage and building envelope applications",
    ],
    body: [
      "RockWool complements our chemical-foam panel range. Choose the core that fits your project’s thermal, fire and budget requirements — our team can advise on the right system.",
    ],
    image: "/uploads/rockwool/RockWool Panels.jpeg",
    href: "/products/rockwool",
    cta: "View RockWool panels →",
  },
];
