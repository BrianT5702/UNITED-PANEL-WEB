/**
 * Phase 2 imported page documents — arranged content from ur.com.my research plan.
 * Wired from page-defaults.ts for the high/medium priority stubs.
 */
import type { PageDocument, PageSection } from "./page-document";

const CONTACT = {
  email: "sales@ur.com.my",
  phone: "+60 00-000 0000",
  whatsapp: "+60 00-000 0000",
};

function cta(
  id: string,
  opts: { eyebrow: string; title: string; body: string; ctaLabel?: string; ctaHref?: string },
): PageSection {
  return {
    id,
    type: "contactCta",
    data: {
      eyebrow: opts.eyebrow,
      title: opts.title,
      body: opts.body,
      email: CONTACT.email,
      phone: CONTACT.phone,
      whatsapp: CONTACT.whatsapp,
      ctaLabel: opts.ctaLabel ?? "Contact us →",
      ctaHref: opts.ctaHref ?? "/contact",
    },
  };
}

/** Optional light hub polish — factory photo, insulation chart + secondary product links after PIR/PU/RockWool intros */
export function productsHubExtraSections(): PageSection[] {
  return [
    {
      id: "prod-factory-photo",
      type: "gallery",
      columns: 1,
      data: {
        layout: "pages",
        title: "From our plant",
        items: [
          {
            id: "pir-wrap-1",
            src: "/uploads/products/pir-panels-wrapping.png",
            alt: "PIR panel stacks and wrapping machine at the United Panel factory",
          },
        ],
      },
    },
    {
      id: "prod-insulation-intro",
      type: "richText",
      data: {
        eyebrow: "Insulation advantage",
        title: "Equivalent thickness for the same degree of insulation",
        body:
          "Panel cores such as polyurethane (PU) deliver strong thermal performance in a modest thickness. The chart below compares the approximate material thickness needed for a similar degree of insulation — from common bricks down to polyurethane (PU).",
      },
    },
    {
      id: "prod-insulation-chart",
      type: "gallery",
      columns: 1,
      data: {
        layout: "pages",
        items: [
          {
            id: "insul-compare-1",
            src: "/uploads/products/insulation-comparison.png",
            alt: "Equivalent thickness required for the same degree of insulation — common bricks 860 mm down to polyurethane (PU) 25 mm",
          },
        ],
      },
    },
    {
      id: "prod-more",
      type: "cardGrid",
      columns: 3,
      data: {
        eyebrow: "Also available",
        title: "Applications, systems & openings",
        lead: "Beyond core panel systems — specify doors, refrigeration systems, and cold-storage applications for your project.",
        items: [
          {
            id: "hub-apps",
            eyebrow: "Use cases",
            title: "Applications",
            text: "Chillers, freezers, food processing, clean rooms, pharma storage, warehouses, and more.",
            href: "/products/applications",
            image: "/uploads/applications/banner-cold-storage-needs.png",
          },
          {
            id: "hub-ref",
            eyebrow: "Systems",
            title: "Refrigeration systems",
            text: "Customised refrigeration systems matched to cold-room load and environment.",
            href: "/products/refrigeration-systems",
            image: "/uploads/refrigeration-systems/system-01.png",
          },
          {
            id: "hub-doors",
            eyebrow: "Openings",
            title: "Insulated doors",
            text: "Swing, sliding, sectional, dock solutions, impact doors, and PVC strip curtains.",
            href: "/products/insulated-doors",
            image: "/uploads/insulated-doors/door-00.png",
          },
        ],
      },
    },
  ];
}

export function roofPanelsDocument(): PageDocument {
  return {
    title: "Roof Panels",
    chrome: "default",
    sections: [
      {
        id: "roof-hero",
        type: "hero",
        data: {
          brand: "United Panel · Roof",
          headline: "PIR roof panels for cold storage",
          lead: "Compressive strength, low weight, and dimensional stability — single-layer PIR roofing that cuts install time and delivers long-term energy savings.",
          backgroundImage: "/uploads/roof/roofing-photo.jpg",
          size: "short",
          buttons: [
            { id: "roof-specs", label: "View specifications", href: "#roof-specs", style: "primary", action: "section" },
            { id: "roof-contact", label: "Enquire →", href: "/contact", style: "ghost", action: "link" },
          ],
        },
      },
      {
        id: "roof-benefits",
        type: "proof",
        columns: 4,
        data: {
          items: [
            {
              id: "rb1",
              index: "01",
              title: "Lower install cost",
              text: "Single-layer PIR roofing reduces installation time and labour compared with multi-layer build-ups.",
            },
            {
              id: "rb2",
              index: "02",
              title: "Faster delivery on site",
              text: "Lightweight panels with easy handling help crews close the roof envelope sooner.",
            },
            {
              id: "rb3",
              index: "03",
              title: "Long-term energy savings",
              text: "Strong thermal performance supports lower cooling loads across the life of the building.",
            },
            {
              id: "rb4",
              index: "04",
              title: "Greener core choice",
              text: "PIR foam core is a more environmentally considerate option than many traditional materials.",
            },
          ],
        },
      },
      {
        id: "roof-overview",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "Overview",
          title: "UR® PIR roofing",
          body: "UR® PIR (polyisocyanurate) roofing is recognised for its compressive strength, low weight, ease of installation, and dimensional stability. A single insulation layer reduces installation time and costs while providing long-term energy savings for cold storage and industrial buildings.",
          body2:
            "The PIR foam core is more environmentally friendly than many alternative insulation materials — specify thickness and skin finish with our team for your project.",
          image: "/uploads/roof/roofing-photo.jpg",
          imageSide: "right",
          imageAspect: "landscape",
        },
      },
      {
        id: "roof-gallery",
        type: "gallery",
        data: {
          eyebrow: "Product photos",
          title: "Roof panel gallery",
          layout: "grid",
          imageAspect: "landscape",
          items: [
            { id: "rg1", src: "/uploads/roof/roofing-photo.jpg", alt: "UR PIR roofing panel installation" },
            { id: "rg2", src: "/uploads/roof/roof-img2.png", alt: "UR PIR roof panel detail" },
          ],
        },
      },
      {
        id: "roof-specs",
        type: "specsTable",
        data: {
          eyebrow: "Specifications",
          title: "PIR roof panels",
          lead: "Cover width follows the dedicated roof product page (990 mm). Contact us for weight by thickness and available skin finishes.",
          rows: [
            { label: "Cover width × length", value: "990 mm × desired length" },
            { label: "Thickness", value: "25 mm / 40 mm" },
            { label: "Weight", value: "Varies by thickness — confirm with sales" },
            { label: "Skin", value: "Steel coil (upper / lower)" },
            { label: "Core", value: "Polyisocyanurate (PIR) foam" },
          ],
        },
        buttons: [
          { id: "roof-specs-cta", label: "Request full datasheet →", href: "/contact", style: "primary", action: "link" },
        ],
      },
      {
        id: "roof-icons",
        type: "cardGrid",
        columns: 3,
        data: {
          eyebrow: "Why teams specify PIR roofing",
          title: "Cost · energy · environment",
          variant: "certs",
          enlarge: false,
          items: [
            {
              id: "ri1",
              title: "Cost efficiency",
              text: "Fewer layers and faster install reduce project cost.",
              image: "/uploads/roof/cost.png",
            },
            {
              id: "ri2",
              title: "Energy performance",
              text: "Insulated roof envelope supports lower ongoing energy use.",
              image: "/uploads/roof/energy.png",
            },
            {
              id: "ri3",
              title: "Environmental profile",
              text: "PIR core chosen as a more environmentally friendly option.",
              image: "/uploads/roof/sun.png",
            },
          ],
        },
      },
      cta("roof-cta", {
        eyebrow: "Enquire",
        title: "Need roof panel specifications?",
        body: "Tell us your span, thickness preference, and facility type — we will follow up with suitable options.",
      }),
    ],
  };
}

export function applicationsDocument(): PageDocument {
  return {
    title: "Applications",
    chrome: "default",
    sections: [
      {
        id: "apps-hero",
        type: "hero",
        data: {
          brand: "United Panel · Applications",
          headline: "Cold storage & industrial envelopes that perform",
          lead: "Specify FM-approved PIR and high-performance PU panel systems for chillers, freezers, food processing, clean rooms, pharmaceutical storage, and distribution — built for temperature control, hygiene, and fire performance.",
          backgroundImage: "/uploads/applications/banner-cold-storage-needs.png",
          size: "full",
          buttons: [
            { id: "apps-list", label: "Explore applications", href: "#apps-list", style: "primary", action: "section" },
            { id: "apps-contact", label: "Discuss your project →", href: "/contact", style: "ghost", action: "link" },
          ],
        },
      },
      {
        id: "apps-proof",
        type: "proof",
        columns: 3,
        data: {
          items: [
            {
              id: "ap1",
              index: "01",
              title: "Fire-rated PIR options",
              text: "FM Approved continuous-line PIR for cold stores where fire performance and thermal consistency are non-negotiable.",
            },
            {
              id: "ap2",
              index: "02",
              title: "High-performance PU",
              text: "SIRIM-listed and Bomba-approved PU panels for strong insulation in a practical thickness with fast tongue-and-groove assembly.",
            },
            {
              id: "ap3",
              index: "03",
              title: "Hygiene-ready & custom rooms",
              text: "Smooth finishes for food and pharma environments — plus custom cold rooms when standard sizes will not fit your layout.",
            },
          ],
        },
      },
      {
        id: "apps-pir",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "PIR solution",
          title: "Fire-critical cold stores deserve FM PIR",
          body: "FM-approved polyisocyanurate (PIR) panels deliver excellent fire performance for cold storage envelopes. The PIR core is produced via a continuous process with a pentane blowing agent — an ozone-friendly choice for modern facilities.",
          body2: "Specify PIR where fire rating, thermal performance, and continuous-line consistency matter most — from freezer rooms to large distribution centres.",
          image: "/uploads/pir/UNITED.jpeg",
          imageSide: "left",
          imageAspect: "landscape",
          linkLabel: "View PIR panels →",
          linkHref: "/products/pir",
        },
      },
      {
        id: "apps-pu",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "PU / PUR solution",
          title: "High-pressure foam between steel skins",
          body: "Polyurethane (PU) panels are formed under high pressure between steel skins for strong insulation in a practical thickness. Embedded tongue-and-groove joints support quick, clean assembly on site.",
          body2: "Ideal for refrigeration rooms and cold storage where speed of build, thermal efficiency, and certified quality (SIRIM / Bomba) are priorities.",
          image: "/uploads/pu/01-finished.jpg",
          imageSide: "right",
          imageAspect: "landscape",
          linkLabel: "View PU panels →",
          linkHref: "/products/pu",
        },
      },
      {
        id: "apps-list",
        type: "cardGrid",
        columns: 4,
        data: {
          eyebrow: "Applications",
          title: "Built for the spaces that keep product safe",
          lead: "Image-led look at where United Panel envelopes are specified — chillers, processing, clean rooms, pharma, and distribution.",
          imageAspect: "landscape",
          items: [
            {
              id: "a1",
              title: "Chiller & freezer rooms",
              text: "Fresh and frozen storage for food logistics and production staging.",
              image: "/uploads/pir/app-coldroom-interior.jpg",
            },
            {
              id: "a2",
              title: "Controlled atmosphere",
              text: "Tight temperature and humidity control for produce and specialised storage.",
              image: "/uploads/pir/coldroom-install.jpg",
            },
            {
              id: "a3",
              title: "Food processing",
              text: "Hygiene-ready process corridors with washable finishes.",
              image: "/uploads/pir/app-processing-corridor.jpg",
            },
            {
              id: "a4",
              title: "Production facilities",
              text: "Insulated envelopes for manufacturing and packing lines.",
              image: "/uploads/pir/production-line.jpg",
            },
            {
              id: "a5",
              title: "Clean rooms",
              text: "Controlled environments with clean joints and finishes.",
              image: "/uploads/pir/facility.jpg",
            },
            {
              id: "a6",
              title: "Pharmaceutical storage",
              text: "Temperature-managed storage for medical and pharma products.",
              image: "/uploads/pir/app-highbay-interior.jpg",
            },
            {
              id: "a7",
              title: "Warehouses",
              text: "Ambient and refrigerated warehouse envelopes and partitions.",
              image: "/uploads/pir/cladding-project.jpg",
            },
            {
              id: "a8",
              title: "Cross-docking",
              text: "Fast-turn cold-chain docks, staging rooms, and partitions.",
              image: "/uploads/pir/app-industrial-facade.jpg",
            },
          ],
        },
      },
      {
        id: "apps-why",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "Why United Panel",
          title: "One partner for panels, doors & refrigeration",
          body: "Specify a continuous-line panel system with recognised certifications, then complete the envelope with insulated doors and matched refrigeration — so design, supply, and on-site coordination stay under one roof.",
          body2: "Whether you need FM PIR for fire-critical stores, SIRIM / Bomba PU for efficient cold rooms, or a custom layout beyond the standard range, our team helps you match the build-up to the application.",
          image: "/uploads/pir/project-site.jpg",
          imageSide: "left",
          imageAspect: "landscape",
          linkLabel: "Talk to our team →",
          linkHref: "/contact",
        },
      },
      {
        id: "apps-custom",
        type: "callout",
        data: {
          title: "Custom cold rooms beyond the standard line",
          body: "Need dimensions, forms, or sizes outside our standard panel range? We configure custom cold rooms to match your layout — share drawings or room sizes and our team will propose a suitable build-up.",
        },
      },
      cta("apps-cta", {
        eyebrow: "Ready to specify?",
        title: "Match the right system to your application",
        body: "Tell us temperature range, fire requirements, hygiene needs, and room sizes — we will recommend PIR, PU, RockWool, doors, or a full refrigeration package.",
        ctaLabel: "Request a project consultation →",
      }),
    ],
  };
}

export function refrigerationSystemsDocument(): PageDocument {
  return {
    title: "Refrigeration Systems",
    chrome: "default",
    sections: [
      {
        id: "refsys-hero",
        type: "hero",
        data: {
          brand: "United Panel · Systems",
          headline: "Refrigeration systems for cold rooms",
          lead: "Customised refrigeration solutions matched to the environment and load demands of your cold storage project — distinct from our parts catalogue.",
          backgroundImage: "/uploads/refrigeration-systems/system-01.png",
          size: "short",
          buttons: [
            { id: "refsys-gallery", label: "View systems", href: "#refsys-gallery", style: "primary", action: "section" },
            { id: "refsys-contact", label: "Enquire →", href: "/contact", style: "ghost", action: "link" },
          ],
        },
      },
      {
        id: "refsys-body",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "Design & application",
          title: "Systems sized for your facility",
          body: "United Panel supplies customised refrigeration systems for the environments and load demands of cold rooms. Our team supports design and application across commercial and industrial temperature-controlled projects.",
          body2:
            "Share duty requirements, room volumes, and product temperatures — we will propose a suitable system package. For individual compressors, controls, and spare components, see Refrigeration Parts.",
          image: "/uploads/refrigeration-systems/system-02.png",
          imageSide: "right",
          imageAspect: "landscape",
          linkLabel: "Browse refrigeration parts →",
          linkHref: "/parts",
        },
      },
      {
        id: "refsys-gallery",
        type: "gallery",
        data: {
          eyebrow: "Systems gallery",
          title: "Installed refrigeration systems",
          layout: "grid",
          imageAspect: "landscape",
          items: [
            { id: "rs1", src: "/uploads/refrigeration-systems/system-01.png", alt: "United Panel refrigeration system 1" },
            { id: "rs2", src: "/uploads/refrigeration-systems/system-02.png", alt: "United Panel refrigeration system 2" },
            { id: "rs3", src: "/uploads/refrigeration-systems/system-03.png", alt: "United Panel refrigeration system 3" },
          ],
        },
      },
      {
        id: "refsys-links",
        type: "cardGrid",
        columns: 3,
        data: {
          eyebrow: "Related",
          title: "Continue exploring",
          items: [
            {
              id: "rl1",
              title: "Refrigeration parts",
              text: "Compressors, condensers, evaporators, copper, and more from authorised brands.",
              href: "/parts",
              image: "/uploads/parts/front-spare-part.jpg",
            },
            {
              id: "rl2",
              title: "Services & support",
              text: "Consultancy through commissioning, handover, and maintenance.",
              href: "/services",
              image: "/uploads/services/front-advisory.jpg",
            },
            {
              id: "rl3",
              title: "Applications",
              text: "Cold storage use cases from chillers to pharmaceutical rooms.",
              href: "/products/applications",
              image: "/uploads/applications/banner-cold-storage-needs.png",
            },
          ],
        },
      },
      cta("refsys-cta", {
        eyebrow: "Enquire",
        title: "Need a refrigeration system proposal?",
        body: "Send duty, room size, and temperature targets — our team will follow up with options.",
      }),
    ],
  };
}

export function insulatedDoorsDocument(): PageDocument {
  return {
    title: "Insulated Doors",
    chrome: "default",
    sections: [
      {
        id: "doors-hero",
        type: "hero",
        data: {
          brand: "United Panel · Doors",
          headline: "Insulated doors for cold rooms",
          lead: "The right door protects freezer and chiller efficiency. We supply swing, sliding, sectional, dock, impact, and PVC curtain options — sized to your opening and temperature.",
          backgroundImage: "/uploads/insulated-doors/door-00.png",
          size: "short",
          buttons: [
            { id: "doors-types", label: "Door types", href: "#doors-types", style: "primary", action: "section" },
            { id: "doors-contact", label: "Enquire →", href: "/contact", style: "ghost", action: "link" },
          ],
        },
      },
      {
        id: "doors-intro",
        type: "richText",
        data: {
          eyebrow: "Selection",
          title: "Choose the opening that fits the room",
          body: "Insulated doors complete the cold storage envelope. Correct door type is essential for freezer and chiller efficiency — we help you select for required room temperature, traffic, and hygiene, then customise sizes and hardware to match United Panel wall systems.",
        },
      },
      {
        id: "doors-types",
        type: "featureList",
        data: {
          eyebrow: "Door types available",
          title: "Manual and automatic options",
          lead: "From walk-in swing doors to dock seals, impact doors, and PVC curtains — specify the opening that matches traffic and temperature.",
          items: [
            "Swing doors — insulated hinged doors for walk-in cold rooms and freezers",
            "Sliding doors — space-efficient sliding insulated doors for wider openings",
            "Sectional doors — for larger industrial openings",
            "Dock seals & shelters — seal the loading bay during docking",
            "Dock levellers — level docks for safe goods transfer",
            "Impact (PVC) doors — flexible doors for high-traffic openings",
            "PVC strip curtains — standard, low-temp, tinted, USDA-grade, and more",
          ],
          images: [
            { id: "wa1", src: "/uploads/insulated-doors/whatsapp-door-2026-09-18.jpg", alt: "" },
            { id: "d0", src: "/uploads/insulated-doors/door-00.png", alt: "" },
            { id: "d1", src: "/uploads/insulated-doors/door-01.png", alt: "" },
            { id: "d2", src: "/uploads/insulated-doors/door-02.png", alt: "" },
            { id: "d3", src: "/uploads/insulated-doors/door-03.png", alt: "" },
            { id: "d4", src: "/uploads/insulated-doors/door-04.png", alt: "" },
            { id: "d5", src: "/uploads/insulated-doors/door-05.png", alt: "" },
            { id: "d6", src: "/uploads/insulated-doors/door-06.png", alt: "" },
            { id: "d7", src: "/uploads/insulated-doors/door-07.png", alt: "" },
            { id: "d8", src: "/uploads/insulated-doors/door-08.png", alt: "" },
            { id: "d9", src: "/uploads/insulated-doors/door-09.png", alt: "" },
          ],
          imageAspect: "landscape",
          slideshowIntervalSec: 4,
        },
      },
      {
        id: "doors-gallery",
        type: "gallery",
        columns: 4,
        data: {
          title: "",
          layout: "grid",
          imageAspect: "landscape",
          items: [
            { id: "dg-wa", src: "/uploads/insulated-doors/whatsapp-door-2026-09-18.jpg", alt: "" },
            { id: "dg0", src: "/uploads/insulated-doors/door-00.png", alt: "" },
            { id: "dg1", src: "/uploads/insulated-doors/door-01.png", alt: "" },
            { id: "dg2", src: "/uploads/insulated-doors/door-02.png", alt: "" },
            { id: "dg3", src: "/uploads/insulated-doors/door-03.png", alt: "" },
            { id: "dg4", src: "/uploads/insulated-doors/door-04.png", alt: "" },
            { id: "dg5", src: "/uploads/insulated-doors/door-05.png", alt: "" },
            { id: "dg6", src: "/uploads/insulated-doors/door-06.png", alt: "" },
            { id: "dg7", src: "/uploads/insulated-doors/door-07.png", alt: "" },
            { id: "dg8", src: "/uploads/insulated-doors/door-08.png", alt: "" },
            { id: "dg9", src: "/uploads/insulated-doors/door-09.png", alt: "" },
            { id: "dg12", src: "/uploads/insulated-doors/door-12.png", alt: "" },
            { id: "dg14", src: "/uploads/insulated-doors/door-14.png", alt: "" },
            { id: "dg15", src: "/uploads/insulated-doors/door-15.png", alt: "" },
          ],
        },
      },
      cta("doors-cta", {
        eyebrow: "Enquire",
        title: "Need doors sized to your openings?",
        body: "Share opening sizes, room temperature, and traffic type — we will recommend door and PVC options.",
      }),
    ],
  };
}

export function servicesDocument(): PageDocument {
  return {
    title: "Services",
    chrome: "default",
    sections: [
      {
        id: "svc-hero",
        type: "hero",
        data: {
          brand: "United Panel · Services",
          headline: "Services and support",
          lead: "Comprehensive advisory from conception to completion — local and international experience coordinating cold storage projects end to end.",
          backgroundImage: "/uploads/services/front-advisory.jpg",
          size: "short",
          buttons: [
            { id: "svc-steps", label: "Our process", href: "#svc-steps", style: "primary", action: "section" },
            { id: "svc-enquire", label: "Enquire →", href: "/contact", style: "ghost", action: "link" },
          ],
        },
      },
      {
        id: "svc-overview",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "Professional advisory",
          title: "From first briefing to handover",
          body: "United Panel provides comprehensive advisory services drawing on local and international project experience. We coordinate from conception through completion so panels, refrigeration, and openings work as one system.",
          body2: "Whether you need a new cold room, an upgrade, or ongoing maintenance, our team stays with the project through each stage below.",
          image: "/uploads/services/img-support.jpg",
          imageSide: "right",
          imageAspect: "landscape",
        },
      },
      {
        id: "svc-steps",
        type: "featureList",
        data: {
          eyebrow: "Process",
          title: "Seven steps from consultancy to maintenance",
          lead: "A clear delivery path so owners know what happens next at every stage.",
          items: [
            "01 · Consultancy — review and assess your cold storage requirements",
            "02 · Site survey — confirm feasibility of the proposed solution on site",
            "03 · Design — engineers and draftsmen compute data, layouts, and drawings",
            "04 · Installation — trained workmen assemble the cold room and envelope",
            "05 · Commissioning — tune and test refrigeration systems for duty",
            "06 · Handover — hand the completed facility to the owner",
            "07 · Service & maintenance — periodic service to protect performance",
          ],
          images: [
            { id: "sv1", src: "/uploads/services/support.png", alt: "United Panel support" },
            { id: "sv2", src: "/uploads/services/img-support.jpg", alt: "Advisory and installation support" },
            { id: "sv3", src: "/uploads/services/front-advisory.jpg", alt: "Cold storage project support" },
          ],
          imageAspect: "square",
        },
      },
      {
        id: "svc-cards",
        type: "cardGrid",
        columns: 2,
        data: {
          eyebrow: "How we help",
          title: "Advisory highlights",
          items: [
            {
              id: "sc1",
              title: "Panel & system selection",
              text: "Match PIR, PU, RockWool, doors, and refrigeration to temperature and fire needs.",
              image: "/uploads/services/img-support.jpg",
            },
            {
              id: "sc2",
              title: "Project delivery",
              text: "Design, installation, commissioning, and handover coordinated under one advisory team.",
              image: "/uploads/services/front-advisory.jpg",
            },
          ],
        },
      },
      cta("svc-cta", {
        eyebrow: "Enquire",
        title: "Need advisory support?",
        body: "Contact our team about cold storage planning, panel selection, and project delivery.",
        ctaLabel: "Enquire about services →",
      }),
    ],
  };
}

export function partsDocument(): PageDocument {
  return {
    title: "Refrigeration Parts",
    chrome: "default",
    sections: [
      {
        id: "parts-hero",
        type: "hero",
        data: {
          brand: "United Panel · Parts",
          headline: "Refrigeration parts",
          lead: "Components for cold storage construction — from compressors and condensers to copper fittings and evaporators. Authorised brands, advised by our team.",
          backgroundImage: "/uploads/parts/front-spare-part.jpg",
          size: "short",
          buttons: [
            { id: "parts-cats", label: "Browse categories", href: "#parts-cats", style: "primary", action: "section" },
            { id: "parts-partners", label: "Brand partners →", href: "/partners", style: "ghost", action: "link" },
          ],
        },
      },
      {
        id: "parts-intro",
        type: "richText",
        data: {
          eyebrow: "Supply",
          title: "Parts for cold storage construction",
          body: "We supply refrigeration components used in cold storage room construction. Our team advises on product questions — contact us for the full list, sizing, and availability. Brands include Bitzer, LU-VE, Danfoss, Emerson, and many more via our authorised distributorships.",
        },
      },
      {
        id: "parts-cats",
        type: "cardGrid",
        columns: 3,
        data: {
          eyebrow: "Categories",
          title: "Refrigeration part categories",
          lead: "Six core categories for cold room builds and maintenance. Ask for the full catalogue.",
          items: [
            {
              id: "pc1",
              title: "Accumulators / receivers / separators",
              text: "Vessel and separation components for refrigeration circuits.",
              image: "/uploads/parts/accumulators-receivers-separators.png",
            },
            {
              id: "pc2",
              title: "Compressors",
              text: "Compressors for commercial and industrial cold storage duties.",
              image: "/uploads/parts/compressor.png",
            },
            {
              id: "pc3",
              title: "Condensers",
              text: "Air- and water-cooled condensers for system heat rejection.",
              image: "/uploads/parts/condenser.png",
            },
            {
              id: "pc4",
              title: "Condensing units",
              text: "Packaged condensing units matched to evaporators and duty.",
              image: "/uploads/parts/condensing-unit.png",
            },
            {
              id: "pc5",
              title: "Copper tubes, coils & fittings",
              text: "Tube, coil, and fitting supplies for refrigeration pipework.",
              image: "/uploads/parts/copper.png",
            },
            {
              id: "pc6",
              title: "Evaporators / unit coolers",
              text: "Unit coolers and evaporators for chillers and freezers.",
              image: "/uploads/parts/evaporators.png",
            },
          ],
        },
      },
      {
        id: "parts-brands",
        type: "cardGrid",
        columns: 2,
        data: {
          eyebrow: "Brands",
          title: "Authorised brand partners",
          items: [
            {
              id: "pb1",
              title: "Exclusive & authorised lines",
              text: "Bitzer and LU-VE exclusive distributorships, plus a wide authorised brand wall.",
              href: "/partners",
              image: "/uploads/partners/ep-bitzer.png",
            },
            {
              id: "pb2",
              title: "Need a specific part?",
              text: "Tell us the brand and model — we will confirm availability and lead time.",
              href: "/contact",
              image: "/uploads/partners/ep-lu-ve.png",
            },
          ],
        },
      },
      cta("parts-cta", {
        eyebrow: "Enquire",
        title: "Need refrigeration parts?",
        body: "Contact our team about authorised brands, sizing, and components.",
        ctaLabel: "Enquire about parts →",
      }),
    ],
  };
}

/**
 * Authorised brands, grouped several logos per slide (like the old ur.com.my home slider).
 * Slide pictures are built from the single logos in /uploads/partners/.
 */
export const PARTNER_LOGO_SLIDES: { src: string; brands: string[] }[] = [
  { src: "/uploads/partners/slides/authorised-1.png", brands: ["BASF", "Hailiang", "SAMPO", "CSC Steel", "Grant Ice Systems", "FERMOD", "Every Control Group"] },
  { src: "/uploads/partners/slides/authorised-2.png", brands: ["Danfoss", "EMERSON Climate Technologies", "EBMPAPST", "WeiGuang Motor & Fans", "Airmender", "Alco Controls", "MTH"] },
  { src: "/uploads/partners/slides/authorised-3.png", brands: ["FLEXELEC", "Saginomiya", "Maneurop", "Castel", "KK", "Scotsman Ice System", "Guntner"] },
  { src: "/uploads/partners/slides/authorised-4.png", brands: ["Embraco", "Harris", "HUB", "DAN Doors", "KASON", "ASPERA", "SUNISO"] },
  { src: "/uploads/partners/slides/authorised-5.png", brands: ["GEMLINE", "BERNZOMATIC", "TMI", "DORIN", "AC & R", "Bristol Compressors", "Tecumseh"] },
  { src: "/uploads/partners/slides/authorised-6.png", brands: ["KEMBLA", "PARAGON", "Anaconda", "Grupo Repro", "Packless", "GOMAX"] },
];

export function partnersLogoSlidesSection(): PageSection {
  return {
    id: "partners-logo-slides",
    type: "gallery",
    data: {
      eyebrow: "Authorised distributorships",
      title: "Brands we supply",
      layout: "logoSlides",
      slideshowAutoplay: true,
      slideshowIntervalSec: 5,
      items: PARTNER_LOGO_SLIDES.map((slide, i) => ({
        id: `logo-slide-${i + 1}`,
        src: slide.src,
        alt: slide.brands.join(" · "),
      })),
    },
  };
}

export function partnersDocument(): PageDocument {
  return {
    title: "Partners",
    chrome: "default",
    sections: [
      {
        id: "partners-intro",
        type: "richText",
        data: {
          eyebrow: "Distributorships",
          title: "Brand partners you can trust",
          body: "United Panel maintains reliable partner relationships as an authorised distributor for world-renowned refrigeration brands. Products supplied are authentic, certified originals — supporting cold storage builds with genuine components.",
        },
      },
      {
        id: "partners-exclusive",
        type: "gallery",
        data: {
          eyebrow: "Exclusive distributorships",
          title: "Bitzer · LU-VE",
          layout: "logos",
          imageAspect: "landscape",
          imageAlign: "center",
          items: [
            { id: "ex1", src: "/uploads/partners/ep-bitzer.png", alt: "Bitzer — exclusive distributorship" },
            { id: "ex2", src: "/uploads/partners/ep-lu-ve.png", alt: "LU-VE — exclusive distributorship" },
          ],
        },
      },
      partnersLogoSlidesSection(),
      {
        id: "partners-callout",
        type: "callout",
        data: {
          title: "Many other brands available",
          body: "The slideshow shows a selection of authorised lines. Contact us for the full brand list, including BASF, Hailiang, SAMPO, CSC Steel, Grant Ice Systems, FERMOD, Every Control, Danfoss, Emerson Climate Technologies, and more.",
          note: "Authenticity and certification verified through our distributorship agreements.",
        },
      },
      cta("partners-cta", {
        eyebrow: "Enquire",
        title: "Need a brand or part?",
        body: "Tell us which components you need — browse Refrigeration Parts or contact our team about authorised availability.",
        ctaLabel: "Enquire about parts →",
        ctaHref: "/parts",
      }),
    ],
  };
}

export function newsDocument(): PageDocument {
  return {
    title: "News",
    chrome: "default",
    sections: [
      {
        id: "news-intro",
        type: "richText",
        data: {
          eyebrow: "News / Events",
          title: "Company news and events",
          body: "Updates from United Panel-System — exhibitions, greetings, and announcements. Below is a seed of 2023 highlights; a fuller year-by-year archive can be migrated article-by-article later.",
        },
      },
      {
        id: "news-2023",
        type: "cardGrid",
        columns: 2,
        data: {
          eyebrow: "2023",
          title: "Recent highlights",
          items: [
            {
              id: "n1",
              eyebrow: "2023 Jul 01",
              title: "Malaysian International Food & Beverage Fair",
              text: "MIFB is Malaysia’s largest food and beverage trade event. We exhibited our latest products and were on-site to answer questions from visitors across the industry.",
            },
            {
              id: "n2",
              eyebrow: "2023 Apr 21",
              title: "Selamat Hari Raya",
              text: "Warm Hari Raya greetings from the United Panel team to our customers, partners, and friends.",
            },
            {
              id: "n3",
              eyebrow: "2022 Feb 01",
              title: "Happy Lunar New Year",
              text: "Season’s greetings for Lunar New Year from United Panel-System.",
            },
          ],
        },
      },
      {
        id: "news-archive",
        type: "callout",
        data: {
          title: "Archive years 2012–2023",
          body: "The previous site organised news by year (2012–2023). Individual articles can be migrated into this listing over time. For media or past event details, contact our team.",
        },
      },
      cta("news-cta", {
        eyebrow: "Media enquiries",
        title: "Questions about our latest work?",
        body: "Contact our team for project updates, product news, or media enquiries.",
      }),
    ],
  };
}

export function careerDocument(): PageDocument {
  return {
    title: "Career",
    chrome: "default",
    sections: [
      {
        id: "career-intro",
        type: "richText",
        data: {
          eyebrow: "Join our team",
          title: "Career",
          body: "Thank you for your interest in United Panel-System (M) Sdn. Bhd. We do not have new positions available currently. When openings arise, they will be posted here.\n\nWe welcome enquiries from people who want to grow with Malaysia’s cold storage panel manufacturing industry — feel free to send your CV for future consideration.",
        },
      },
      cta("career-cta", {
        eyebrow: "Enquire",
        title: "Interested in working with us?",
        body: "Send your enquiry or CV to our team — we will follow up when roles are open.",
        ctaLabel: "Send an enquiry →",
      }),
    ],
  };
}

export function virtualTourDocument(): PageDocument {
  return {
    title: "Virtual Tour",
    chrome: "default",
    sections: [
      {
        id: "vt-intro",
        type: "richText",
        data: {
          eyebrow: "Virtual Tour",
          title: "Project Site Tour",
          body:
            "During the COVID-19 pandemic, cold storage became more essential than ever. Food consumption and storage soared under lockdowns, increasing demand for reliable refrigerated facilities.\n\nUnited Panel-System (M) Sdn. Bhd. operated around the clock, manufacturing insulation panels to meet urgent timelines — with FM Approval as the gold standard.\n\nWe were tasked by the government to deliver emergency cold rooms and refrigeration solutions in response to the pandemic.\n\nInsulation panels and cold storage remain pivotal to food security, healthcare logistics, and vaccine storage infrastructure.",
          ctaLabel:
            "Kindly click here for more information on vaccine storage facilities with our insulated panels.",
          ctaHref:
            "https://www.basf.com/my/en/media/news-releases/asia-pacific/2021/06/insulated_panels_for_covid_19_vaccine_storage_facilities.html",
        },
      },
      {
        id: "vt-gallery",
        type: "gallery",
        columns: 4,
        data: {
          eyebrow: "Site tour",
          title: "Project site views",
          layout: "grid",
          imageAspect: "tall",
          items: [
            {
              id: "vt-loading-bay",
              src: "/uploads/virtual-tour/loading-bay.gif",
              alt: "Loading Bay",
            },
            {
              id: "vt-processing",
              src: "/uploads/virtual-tour/processing.gif",
              alt: "Processing",
            },
            {
              id: "vt-freezer",
              src: "/uploads/virtual-tour/freezer-room.gif",
              alt: "Freezer Room",
            },
            {
              id: "vt-system",
              src: "/uploads/virtual-tour/system.gif",
              alt: "System",
            },
          ],
        },
      },
    ],
  };
}
