export type PanelCert = {
  id: string;
  name: string;
  detail: string;
  image: string;
  href?: string;
};

export type PanelProductContent = {
  slug: string;
  brand: string;
  headline: string;
  lead: string;
  tagline?: string;
  primaryCta: string;
  secondaryCta: string;
  heroImage: string;
  mediaLabel: string;
  proof: { id: string; index: string; title: string; text: string }[];
  overviewEyebrow: string;
  overviewTitle: string;
  overviewBody1: string;
  overviewBody2: string;
  overviewImage: string;
  /** Optional rotating photos for the overview visual (starts at overviewImageStartIndex) */
  overviewImages?: string[];
  overviewImageStartIndex?: number;
  overviewLinkLabel?: string;
  overviewLinkHref?: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresLead?: string;
  features: string[];
  finishes?: {
    eyebrow: string;
    title: string;
    lead?: string;
    items: { name: string; image: string; alt: string }[];
  };
  applications?: {
    eyebrow: string;
    title: string;
    lead: string;
    items: string[];
    images?: { src: string; alt: string }[];
  };
  jointDetails?: {
    eyebrow: string;
    title: string;
    summary: string;
    body: string;
    image: string;
    imageAlt: string;
    pages?: { title: string; lead?: string; src: string; alt: string }[];
  };
  specsEyebrow: string;
  specsTitle: string;
  specsLead: string;
  specs: { label: string; value: string }[];
  physicalProperties?: {
    eyebrow: string;
    title: string;
    lead?: string;
    headers: string[];
    rows: string[][];
    note?: string;
  };
  /** Optional comparison table (e.g. equivalent insulation thickness) */
  comparisonTable?: {
    eyebrow: string;
    title: string;
    lead?: string;
    headers: string[];
    rows: string[][];
    note?: string;
  };
  roofing?: {
    eyebrow: string;
    title: string;
    body: string;
    specs: { label: string; value: string }[];
    note?: string;
  };
  certsEyebrow: string;
  certsTitle: string;
  certsLead: string;
  certifications: PanelCert[];
  gallery?: { src: string; alt: string }[];
  related: { title: string; text: string; href: string; image: string }[];
  contactEyebrow: string;
  contactTitle: string;
  contactBody: string;
  email: string;
  phone: string;
  whatsapp: string;
  footerTagline: string;
};

export type PirContent = Omit<
  PanelProductContent,
  "slug" | "related" | "certsEyebrow" | "certsTitle" | "certsLead" | "certifications" | "gallery" | "footerTagline" | "overviewLinkLabel" | "overviewLinkHref"
> & {
  certifications?: PanelCert[];
  certsEyebrow?: string;
  certsTitle?: string;
  certsLead?: string;
  gallery?: { src: string; alt: string }[];
};

export const defaultPirContent: PanelProductContent = {
  slug: "pir",
  brand: "United Panel · PIR",
  headline: "Polyisocyanurate (PIR) Panels",
  tagline: "ASEAN’s First & Only PIR Double Belt Continuous Line",
  lead: "Quality premium PIR panels from ASEAN’s first and only PIR Double Belt Continuous Line — FM Global (FM) approved Class 1 without height restrictions, with published product range, finishes and typical physical properties.",
  primaryCta: "Request a Quote",
  secondaryCta: "View specifications",
  heroImage: "/uploads/pir/install-wall.jpg",
  mediaLabel: "",
  proof: [
    {
      id: "1",
      index: "01",
      title: "ASEAN Double Belt Continuous Line",
      text: "The first and only PIR Double Belt Continuous Line in ASEAN for cold store panels.",
    },
    {
      id: "2",
      index: "02",
      title: "FM Global (FM) approved",
      text: "Class 1 to FM Approvals Standard 4880 / 4881 for walls, roof/ceiling and exterior wall systems — valid without height restrictions.",
    },
    {
      id: "3",
      index: "03",
      title: "Fire classified & cladding tested",
      text: "TÜV Reaction to Fire Classification B-s1,d0, and UR PIR insulated panels have passed BS 8414-2 for external cladding systems.",
    },
  ],
  overviewEyebrow: "Overview",
  overviewTitle: "ASEAN’s first Double Belt Continuous Line",
  overviewBody1:
    "Over the past 30 years, we have been recognised as one of the most established panel manufacturers in our industry. Our continuous effort in keeping up with our market’s current technology extends to our manufacturing capabilities. All of our PIR panels are manufactured in our own premises to ensure that tight control and stringent quality standards are met.",
  overviewBody2:
    "We are the first PIR Double Belt Continuous production line in the ASEAN region for insulation purposes. A PIR continuous production line is ideal for high-volume production of insulating panels, and our specialised team is able to cater for this complex turnkey manufacturing system.",
  overviewImage: "/uploads/pir/facility.jpg",
  overviewImages: [
    "/uploads/pir/facility.jpg",
    "/uploads/pir/production-line.jpg",
    "/uploads/pir/coldroom-install.jpg",
    "/uploads/pir/project-site.jpg",
  ],
  overviewImageStartIndex: 0,
  overviewLinkLabel: "About FM Global approval →",
  overviewLinkHref: "/about/certified/fm-global",
  featuresEyebrow: "Advantages",
  featuresTitle: "What PIR panels offer",
  featuresLead:
    "PIR has the best insulation rating of all widely-used thermal insulation materials due to the low heat-conductivity. In addition to its thermal performance, PIR panels offer:",
  features: [
    "Superior fire resistance — reduced flammability compared with other panel cores",
    "Moisture resistant — closed-cell foam properties",
    "Stronger parallel compression strength — better dimensional stability",
    "More savings — lower energy costs for both heating and cooling",
    "Faster delivery time — foam has a faster reaction rate",
    "No restrictions on length in a single panel — produced on a continuous line",
    "Environmental benefits — PIR cores contain no CFCs or HCFCs",
    "ASEAN’s first PIR Double Belt Continuous Line for insulation, with in-house manufacture under stringent quality control",
    "Ideal for high-volume production — specialised team support for complex turnkey manufacturing",
  ],
  finishes: {
    eyebrow: "Surface finishes",
    title: "Ribbed, Micro Lining and Flat",
    lead: "Choose the outer profile that suits the façade or room finish.",
    items: [
      {
        name: "Ribbed",
        image: "/uploads/pir/finish-ribbed.png",
        alt: "UR PIR panel with ribbed surface finish",
      },
      {
        name: "Micro Lining",
        image: "/uploads/pir/finish-micro-lining.png",
        alt: "UR PIR panel with micro lining surface finish",
      },
      {
        name: "Flat",
        image: "/uploads/pir/finish-flat.png",
        alt: "UR PIR panel with flat surface finish",
      },
    ],
  },
  applications: {
    eyebrow: "Applications",
    title: "Where PIR panels are used",
    lead: "Suitable for insulated wall, ceiling and exterior cladding systems — including cold storage and industrial envelopes. PIR panels are suitable for both temperature-controlled and hygiene-safe environments for a temperature range between +20°C to −40°C.",
    items: [
      "Insulated walls and ceilings",
      "Exterior wall cladding systems",
      "Cold storage and freezer rooms",
      "Food processing facilities",
      "Warehouses and industrial buildings",
      "Clean rooms and controlled environments",
    ],
    images: [
      {
        src: "/uploads/pir/install-wall.jpg",
        alt: "UR PIR panels during cold room wall installation",
      },
      {
        src: "/uploads/pir/UNITED.jpeg",
        alt: "UR PIR For New RockWool Production Line",
      },
      {
        src: "/uploads/pir/cladding-project.jpg",
        alt: "PIR panel cladding on a multi-storey industrial project",
      },
      {
        src: "/uploads/pir/install-tall.jpg",
        alt: "Large-scale UR PIR panel wall installation",
      },
      {
        src: "/uploads/pir/app-industrial-facade.jpg",
        alt: "Industrial facility clad with UR PIR panels",
      },
      {
        src: "/uploads/pir/app-warehouse.jpg",
        alt: "Warehouse with PIR panel exterior cladding",
      },
      {
        src: "/uploads/pir/app-cladding-wall.jpg",
        alt: "Close view of PIR panel exterior cladding",
      },
      {
        src: "/uploads/pir/app-crane-install.jpg",
        alt: "Crane installing a long UR PIR wall panel",
      },
      {
        src: "/uploads/pir/app-highbay-interior.jpg",
        alt: "High-bay interior PIR panel installation",
      },
      {
        src: "/uploads/pir/app-processing-corridor.jpg",
        alt: "PIR panel walls in a processing corridor",
      },
      {
        src: "/uploads/pir/app-coldroom-interior.jpg",
        alt: "Finished cold room with white PIR panels",
      },
      {
        src: "/uploads/pir/app-coldroom-install.jpg",
        alt: "Cold room PIR panel installation in progress",
      },
    ],
  },
  jointDetails: {
    eyebrow: "Joint detail",
    title: "UR PIR Panel Joint",
    summary:
      "Interlocking tongue & groove joints by thickness, plus typical installation joint details. Expand to view the full diagrams.",
    body: "UR PIR panels use an interlocking tongue-and-groove joint. The male and female profiles lock together for a continuous insulated wall or ceiling line with a clean, sealed connection between panels.",
    image: "/uploads/pir/joints/panel-joint.png",
    imageAlt: "PIR Panel Joint — interlocking tongue and groove diagram",
    pages: [
      {
        title: "Typical panel profile and joints",
        lead: "Male, female and after-joint profiles for 50–200 mm panel thicknesses.",
        src: "/uploads/pir/joints/typical-profiles.jpg",
        alt: "Joint Details — typical panel profile and joints for 50mm to 200mm",
      },
      {
        title: "Installation joint details",
        lead:
          "Wall-to-wall, corner, floor, ceiling suspension, nylon hanger, and concrete wall connections.",
        src: "/uploads/pir/joints/installation-details.jpg",
        alt: "PIR installation joint details — wall, ceiling, floor and concrete connections",
      },
    ],
  },
  specsEyebrow: "Product range & data",
  specsTitle: "Specifications (PIR)",
  specsLead:
    "Product Range & Data. Insulation panels are manufactured in-house and delivered to projects’ sites for ready installation.",
  specs: [
    {
      label: "Dimension",
      value: "1150 mm × any desired length",
    },
    {
      label: "Thickness",
      value: "50 mm, 75 mm, 100 mm, 125 mm, 150 mm, 180 mm, 200 mm",
    },
    {
      label: "Joint",
      value: "UR PIR Panel Joint — interlocking tongue & groove (male / female)",
    },
    {
      label: "Skins — PPGI",
      value: "0.36 mm, 0.40 mm, 0.45 mm, 0.50 mm, 0.60 mm, 0.70 mm",
    },
    {
      label: "Skins — PVC laminated steel",
      value: "0.56 mm, 0.60 mm, 0.65 mm, 0.70 mm, 0.80 mm",
    },
    {
      label: "Surface finishes",
      value: "Ribbed · Micro Lining · Flat",
    },
  ],
  physicalProperties: {
    eyebrow: "Material data",
    title: "Typical physical properties (PIR)",
    lead: "Typical physical properties table.",
    headers: ["Property", "Test method", "Unit", "Result*"],
    rows: [
      ["Core density", "DIN EN ISO 845", "kg/m³", "40.1"],
      ["Thermal conductivity", "DIN EN 12667", "mW/m·K", "20.35"],
      ["Compression stress", "DIN EN 826 / ISO 844", "N/mm²", "0.153"],
      ["Dimensional stability (−30°C) — length", "DIN ISO 2796", "%", "−0.1"],
      ["Dimensional stability (−30°C) — width", "DIN ISO 2796", "%", "0.0"],
      ["Dimensional stability (−30°C) — height", "DIN ISO 2796", "%", "0.0"],
      ["Water absorption", "—", "Vol.-%", "1.5"],
      ["Closed cell content", "DIN ISO 4590", "%", "93"],
      ["Flammability", "DIN 4120", "B2", "5 cm flame height"],
    ],
    note: "*Based on sample submitted subjected to standard tests deviation.",
  },
  roofing: {
    eyebrow: "Roof panels",
    title: "UR PIR roof panels",
    body: "Roof panel profiles with 1000 mm cover width.",
    specs: [
      {
        label: "UR PIR ROOF Panel 25 mm",
        value: "Cover width 1000 mm · core 25 mm · overall height 59 mm · rib 38 mm",
      },
      {
        label: "UR PIR ROOF Panel 40 mm",
        value: "Cover width 1000 mm · core 40 mm · overall height 74 mm · rib 38 mm",
      },
    ],
  },
  certsEyebrow: "Product certification list",
  certsTitle: "Certified quality",
  certsLead:
    "UR PIR panel is FM Global (FM) approved and TÜV classified B-s1,d0, with ISO, SIRIM QAS International (including BS 8414-2 cladding fire testing) and Bomba recognition.",
  certifications: [
    {
      id: "fm",
      name: "FM Global (FM) Approval",
      detail:
        "Class 1 fire rating to FM Approvals Standard 4880 / 4881 — valid without height restrictions. Includes the UBC-26 room test: fire contained with no propagation; core charring < 6.4 mm.",
      image: "/uploads/pir/certs/fm.png",
      href: "/about/certified/fm-global",
    },
    {
      id: "tuv",
      name: "TÜV Fire Classification",
      detail:
        "Tested and classified by TÜV Singapore — Reaction to Fire Classification B-s1,d0, in relation to reaction to fire behaviour, smoke production and flaming droplets.",
      image: "/uploads/pir/certs/tuv.jpg",
      href: "/about/certified/tuv",
    },
    {
      id: "quality",
      name: "ISO, SIRIM & Bomba",
      detail:
        "ISO 9001:2015 (Certification No. 17975-A), SIRIM QAS International — including BS 8414-2 external cladding fire testing — and Jabatan Bomba dan Penyelamat Malaysia recognition.",
      image: "/uploads/pir/certs/sirim.jpg",
      href: "/about/certified/quality-recognition",
    },
  ],
  gallery: [],
  related: [
    {
      title: "PU Panels",
      text: "Customisable polyurethane panels for interior and exterior cold storage use.",
      href: "/products/pu",
      image: "/uploads/pu/apps/site-01.jpg",
    },
    {
      title: "RockWool Panels",
      text: "Mineral-wool core panels from Malaysia’s first fully automated RockWool line.",
      href: "/products/rockwool",
      image: "/uploads/rockwool/RockWool Panels.jpeg",
    },
  ],
  contactEyebrow: "Next step",
  contactTitle: "Enquire about PIR panels",
  contactBody:
    "Share thickness, project type, and location. Our team will follow up with suitable PIR options and lead times.",
  email: "sales@ur.com.my",
  phone: "+607 355 8000",
  whatsapp: "+607 355 8000",
  footerTagline: "PIR Panels",
};

export const defaultPuContent: PanelProductContent = {
  slug: "pu",
  brand: "United Panel · PU",
  headline: "Polyurethane (PU) Insulation Panels",
  tagline: "One-stop solution for your cold storage needs",
  lead: "Highly customisable UR PU panels with a range of core thicknesses, finishes and joint systems — assembled vertically or horizontally for interior and exterior cold storage.",
  primaryCta: "Request a Quote",
  secondaryCta: "View specifications",
  heroImage: "/uploads/pu/apps/install-blue-warehouse.jpg",
  mediaLabel: "",
  proof: [
    {
      id: "1",
      index: "01",
      title: "High insulation, modest thickness",
      text: "PU foam delivers the same insulation as much thicker brick, wool or polystyrene — air and water cannot circulate inside the core.",
    },
    {
      id: "2",
      index: "02",
      title: "Clip, cam and semi cam-lock",
      text: "Tongue-and-groove clip-lock, cam-lock and semi cam-lock joints for clean wall and ceiling assembly.",
    },
    {
      id: "3",
      index: "03",
      title: "SIRIM listed · Bomba approved",
      text: "UR PU is a certified and listed product by SIRIM QAS International, and tested and approved by Bomba Malaysia for commercial and industrial use.",
    },
  ],
  overviewEyebrow: "Overview",
  overviewTitle: "Custom panels for real projects",
  overviewBody1:
    "Polyurethane panels are highly customisable. We have a range of core thicknesses, support finishings and panel joints to choose from. The rigid polyurethane foam is favoured for insulation panels because of its mechanical, chemical, biological and moisture properties.",
  overviewBody2:
    "Panels can be assembled by vertical or horizontal disposition and are suitable for interior and exterior applications — for restaurants, cold rooms, warehouses and industrial refrigeration fit-outs.",
  overviewImage: "/uploads/pu/apps/site-01.jpg",
  overviewImages: [
    "/uploads/pu/apps/site-01.jpg",
    "/uploads/pu/apps/site-02.jpg",
    "/uploads/pu/apps/install-blue-warehouse.jpg",
    "/uploads/pu/apps/app-5c.jpg",
    "/uploads/pu/apps/warehouse-11b.jpg",
    "/uploads/pu/03-assembly.jpg",
  ],
  overviewImageStartIndex: 0,
  featuresEyebrow: "Advantages of PU foam",
  featuresTitle: "What UR PU panels offer",
  featuresLead:
    "Excellent insulating efficiency, easy installation and maintenance, aesthetically pleasing finishes, and durable construction for daily cold-room use.",
  features: [
    "Food grade compliance",
    "Moisture and corrosion resistance",
    "Superior thermal performance — high insulation even with a modest material thickness",
    "High density mechanical strength — suitable for wall and roof applications",
    "Fire retardant — in a fire the foam does not drip or run, minimising flammable mass",
    "CFC free",
    "Air- and water-tight core — installation in all weather conditions",
    "Clip-lock, cam-lock and semi cam-lock tongue-and-groove joints",
  ],
  applications: {
    eyebrow: "Applications",
    title: "Where PU panels are used",
    lead: "Suitable for interior and exterior insulated walls, ceilings and cold-store envelopes.",
    items: [
      "Chiller and freezer rooms for fresh / frozen food",
      "Controlled atmosphere rooms",
      "Food processing rooms",
      "Production rooms",
      "Clean rooms",
      "Pharmaceutical storage rooms",
      "Warehouses",
      "Cross-docking facilities",
    ],
    images: [
      {
        src: "/uploads/pu/apps/app-5c.jpg",
        alt: "PU panel corridor in a cold storage facility",
      },
      {
        src: "/uploads/pu/apps/warehouse-11b.jpg",
        alt: "White PU panel walls and ceiling at loading docks",
      },
      {
        src: "/uploads/pu/apps/install-blue-warehouse.jpg",
        alt: "Installing tall UR PU wall panels in a warehouse",
      },
      {
        src: "/uploads/pu/01-finished.jpg",
        alt: "Finished PU panel interior",
      },
      {
        src: "/uploads/pu/apps/site-02.jpg",
        alt: "UR PU panels showing foam core and metal skins",
      },
    ],
  },
  jointDetails: {
    eyebrow: "Joint detail",
    title: "UR PU Panel Joint",
    summary:
      "Clip-lock, cam-lock and semi cam-lock tongue & groove joints, plus typical wall, ceiling and floor installation details. Expand to view the full diagrams.",
    body: "UR PU panels use interlocking tongue-and-groove joints. Clip-lock, cam-lock and semi cam-lock systems lock together for a continuous insulated wall or ceiling line, sealed with non-setting butyl, polysulphide or silicone as specified.",
    image: "/uploads/pu/joints/clip-joint-01.png",
    imageAlt: "PU panel clip joint — interlocking tongue and groove",
    pages: [
      {
        title: "Polyurethane panel clip joints",
        lead: "Tongue-and-groove clip joint profiles shown with product range and typical site photos.",
        src: "/uploads/pu/joints/product-range-page.jpg",
        alt: "PU insulation panels, specifications and clip joints",
      },
      {
        title: "Installation joint details",
        lead:
          "Ceiling-to-ceiling, door sectional, and wall-to-ceiling connections with 38 × 38 mm aluminium angles and N-mastic.",
        src: "/uploads/pu/joints/installation-details-1.jpg",
        alt: "PU installation joints — ceiling, door sectional and wall-to-ceiling details",
      },
      {
        title: "Corners, walls and ceiling hangers",
        lead:
          "Wall-to-wall corners, wall joints, large suspension and nylon hanger ceiling details.",
        src: "/uploads/pu/joints/installation-details-2.jpg",
        alt: "PU wall corner, wall joint, large suspension and nylon hanger details",
      },
    ],
  },
  specsEyebrow: "Product range & data",
  specsTitle: "Specifications (PU)",
  specsLead:
    "Insulation panels are manufactured in-house and delivered to project sites for ready installation.",
  specs: [
    { label: "Dimension", value: "1150 mm × desired length" },
    {
      label: "Thickness",
      value: "50 mm / 75 mm / 100 mm / 125 mm / 200 mm / 250 mm",
    },
    { label: "Weight", value: "Varies in accordance to thickness" },
    {
      label: "Skins — steel",
      value:
        "0.36 mm / 0.45 mm / 0.5 mm / 0.6 mm / 0.7 mm thick, 180 g/m² nominal zinc coating. Paint of polyester or silicone modified polyester. Colour: white (other colours and finishes available).",
    },
    {
      label: "Skins — aluminium & stainless steel",
      value: "Subject to quantities available",
    },
    {
      label: "Joints",
      value:
        "Clip-lock (tongue & groove) · Cam-lock system (tongue & groove) · Semi cam-lock system (tongue & groove)",
    },
    {
      label: "Sealants",
      value: "Non-setting butyl / polysulphide / silicone",
    },
  ],
  physicalProperties: {
    eyebrow: "Panel characteristics",
    title: "Typical physical properties (PU)",
    lead: "Typical physical properties of the rigid polyurethane foam used in UR PU panels.",
    headers: ["Property", "Test method", "Unit", "Result*"],
    rows: [
      ["Core density", "ISO EN 845", "kg/m³", "42 – 44"],
      ["Thermal conductivity", "DIN 52612", "W/m·K", "0.021"],
      ["Compressive stress", "DIN 53421", "N/mm²", "0.16"],
      ["Dimensional stability (−30°C / +80°C)", "DIN 53431", "%", "Max 0.1 / Max 0.2"],
      ["Water absorption", "DIN 53428", "Volume change (%)", "< 2"],
      ["Closed cell content", "ISO 4590", "%", "> 90"],
      ["Flexural strength", "DIN 53423", "N/mm²", "0.26"],
      ["Bending", "DIN 53423", "mm", "10"],
      ["Elongation at break", "—", "%", "5 – 10"],
      ["Water vapour transmission", "—", "Perm-in", "1.8 – 3.8"],
      ["Operating temperature", "—", "°C", "−40 to +80"],
    ],
    note: "*Based on sample, subject to standard tests deviations. UR panels have been certified by SIRIM QAS International and approved by the Malaysia fire authorities (BOMBA).",
  },
  comparisonTable: {
    eyebrow: "Insulation performance",
    title: "Equivalent thickness for the same degree of insulation",
    lead: "PU panels keep insulation high even with a modest material thickness. Air and water cannot penetrate and circulate within the panel walls.",
    headers: ["Material", "Thickness required"],
    rows: [
      ["Common bricks", "860 mm"],
      ["Concrete bricks", "380 mm"],
      ["Softwood", "140 mm"],
      ["Fibreboard", "65 mm"],
      ["Cork", "50 mm"],
      ["Mineral wool", "46 mm"],
      ["Polystyrene (PS)", "40 mm"],
      ["Polyurethane (PU)", "25 mm"],
    ],
  },
  certsEyebrow: "Certified, recognised and approved",
  certsTitle: "Certified quality",
  certsLead:
    "UR PU panel is a certified and listed product by SIRIM QAS International. PU insulation panels have also been tested and approved by Bomba Malaysia for commercial and industrial use. Manufacturing is ISO 9001:2015 certified, CFC-free, and eligible skins carry a corrosion-free finish warranty.",
  certifications: [
    {
      id: "sirim",
      name: "SIRIM QAS International",
      detail:
        "Certified and listed product — a recognised body for quality excellence.",
      image: "/uploads/pir/certs/sirim.jpg",
      href: "/about/certified/quality-recognition",
    },
    {
      id: "bomba",
      name: "Bomba Malaysia",
      detail:
        "Tested and approved by the Fire and Rescue Department of Malaysia for commercial and industrial use.",
      image: "/uploads/pir/certs/card-bomba.jpg",
      href: "/about/certified/quality-recognition",
    },
    {
      id: "warranty",
      name: "20-year corrosion-free warranty",
      detail:
        "Eligible corrosion-free steel skins — polyester or silicone-modified polyester on 180 g/m² zinc-coated steel. Ask us which coatings apply to your project.",
      image: "/uploads/pu/certs/warranty-20-year.png",
      href: "/contact",
    },
  ],
  gallery: [],
  related: [
    {
      title: "PIR Panels",
      text: "FM Approved continuous-line PIR for fire-critical cold stores.",
      href: "/products/pir",
      image: "/uploads/pir/UNITED.jpeg",
    },
    {
      title: "RockWool Panels",
      text: "Mineral-wool core panels for fire-conscious envelopes.",
      href: "/products/rockwool",
      image: "/uploads/rockwool/RockWool Panels.jpeg",
    },
  ],
  contactEyebrow: "Next step",
  contactTitle: "Enquire about PU panels",
  contactBody:
    "Tell us thickness, joint type, finish and project location — we’ll recommend the right PU panel configuration.",
  email: "sales@ur.com.my",
  phone: "+607 355 8000",
  whatsapp: "+607 355 8000",
  footerTagline: "PU Panels",
};
