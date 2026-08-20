import { defaultHomeContent } from "./defaults";
import { defaultPirContent, defaultPuContent } from "./panels";
import { productIntroSections } from "./product-intro";
import { panelProductToDocument } from "./panel-to-document";
import type { PageDocument, PageSection } from "./page-document";
import { newId } from "./page-document";
import { SITE_PAGES } from "./pages";

function aboutDoc(
  title: string,
  about: NonNullable<PageDocument["about"]>,
  sections: PageSection[],
): PageDocument {
  return { title, chrome: "about", about, sections };
}

function homeDocument(): PageDocument {
  const h = defaultHomeContent;
  return {
    title: "Homepage",
    chrome: "default",
    sections: [
      {
        id: "home-hero",
        type: "hero",
        data: {
          brand: h.hero.brand,
          headline: h.hero.headline,
          lead: h.hero.lead,
          backgroundImage: h.hero.backgroundImage,
          buttons: [],
        },
      },
      {
        id: "home-proof",
        type: "proof",
        data: { items: h.proof.items.map((i) => ({ ...i })) },
      },
      {
        id: "home-gateways",
        type: "cardGrid",
        columns: 2,
        data: {
          eyebrow: "Explore",
          title: "What we offer",
          lead: "Start here for a quick overview — open each section for full details.",
          items: [
            {
              id: "about",
              eyebrow: "About Us",
              title: "Our company",
              text: "Profile, vision, R&D and certifications — who we are and how we manufacture.",
              href: "/about",
              image: "https://www.ur.com.my/userfiles/image/newfactoryoutlok.png",
            },
            {
              id: "products",
              eyebrow: "Products",
              title: "Insulated panels",
              text: "PIR, PU and RockWool panel systems for cold rooms and industrial envelopes.",
              href: "/products",
              image: "https://www.ur.com.my/userFiles/image/8.jpg",
            },
            {
              id: "services",
              eyebrow: "Services",
              title: "Advisory & support",
              text: "Guidance for cold storage planning, panel selection and project delivery.",
              href: "/services",
              image: "https://www.ur.com.my/userfiles/image/fronad2.jpg",
            },
            {
              id: "parts",
              eyebrow: "Refrigeration Parts",
              title: "Parts & brands",
              text: "Authorised refrigeration components from leading global brands.",
              href: "/parts",
              image: "https://www.ur.com.my/userfiles/image/front-spare-part.jpg",
            },
          ],
        },
      },
      {
        id: "home-contact",
        type: "contactCta",
        data: {
          eyebrow: h.contact.eyebrow,
          title: h.contact.title,
          body: h.contact.body,
          email: h.contact.email,
          phone: h.contact.phone,
          whatsapp: h.contact.whatsapp,
          ctaLabel: "Contact Us",
          ctaHref: "/contact",
        },
      },
    ],
  };
}

function productsHubDocument(): PageDocument {
  return {
    title: "Products",
    chrome: "default",
    sections: [
      {
        id: "prod-hero",
        type: "hero",
        data: {
          brand: "United Panel",
          headline: "Insulated panel systems",
          lead: "PIR, PU, and RockWool — three cores for cold storage and industrial projects. Choose a system below, then open full specifications on each product page.",
          backgroundImage: "/uploads/About/FactoryLook.png",
          size: "short",
          buttons: [],
        },
      },
      ...productIntroSections.map(
        (section, index): PageSection => ({
          id: `intro-${section.id}`,
          type: "mediaText",
          columns: 2,
          data: {
            eyebrow: section.eyebrow,
            title: section.title,
            body: [section.summary, ...section.points.map((p) => `• ${p}`)].join("\n\n"),
            image: section.image,
            linkLabel: section.cta,
            linkHref: section.href,
            imageSide: index % 2 === 0 ? "left" : "right",
            imageAspect: "wide",
          },
        }),
      ),
    ],
  };
}

function rockwoolDocument(): PageDocument {
  return {
    title: "RockWool Panels",
    chrome: "default",
    sections: [
      {
        id: "rw-hero",
        type: "hero",
        data: {
          brand: "United Panel · RockWool",
          headline: "Malaysia’s First Fully Automated RockWool Line",
          lead: "Fire-resilient cold room panels, produced with precision automation — built for performance you can trust.",
          backgroundImage: "https://www.ur.com.my/userfiles/image/WIW3.png",
          buttons: [],
        },
      },
      {
        id: "rw-proof",
        type: "proof",
        data: {
          items: [
            {
              id: "rw1",
              index: "01",
              title: "Fully Automated",
              text: "Consistent quality from Malaysia’s first fully automated RockWool production line.",
            },
            {
              id: "rw2",
              index: "02",
              title: "Fire Resilience",
              text: "RockWool mineral core engineered for stronger fire performance in cold room applications.",
            },
            {
              id: "rw3",
              index: "03",
              title: "Cold Room Ready",
              text: "Insulated panel solutions designed for cold storage, freezers, and food facilities.",
            },
          ],
        },
      },
      {
        id: "rw-material",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "The Material",
          title: "What is RockWool?",
          body: "RockWool is a mineral wool insulation made from natural stone fibres. In cold room panels, it provides stable thermal insulation with a core valued for its non-combustible character, durability, and reliable performance in temperature-controlled environments.",
          image: "/uploads/rockwool/RockWool Material.jpeg",
          imageSide: "right",
        },
      },
      {
        id: "rw-attributes",
        type: "cardGrid",
        columns: 2,
        data: {
          eyebrow: "Core attributes",
          title: "What RockWool is good at",
          items: [
            {
              id: "attr1",
              title: "Fire Performance",
              text: "Mineral fibre core supports stronger fire resilience for industrial and cold storage environments.",
            },
            {
              id: "attr2",
              title: "Thermal Stability",
              text: "Reliable insulation behaviour to help protect temperature-controlled spaces.",
            },
            {
              id: "attr3",
              title: "Dimensional Integrity",
              text: "A robust core that holds form under demanding operating conditions.",
            },
            {
              id: "attr4",
              title: "Acoustic Comfort",
              text: "Natural fibre structure contributes to quieter, more controlled facilities.",
            },
          ],
        },
      },
      {
        id: "rw-capability",
        type: "featureList",
        data: {
          eyebrow: "Our Capability",
          title: "Automation that sets a new benchmark",
          lead: "United Panel brings RockWool panel production into a fully automated line — the first of its kind in Malaysia. The result is repeatable quality, tighter process control, and panels built for professional cold room projects.",
          items: [
            "Local manufacturing capability you can visit and verify",
            "High-level process control for consistent panel output",
            "Cold room expertise backed by United Panel’s panel heritage",
            "Technical details available on request — not published in full",
          ],
        },
        buttons: [
          {
            id: "rw-cap-btn",
            label: "Discuss your project →",
            href: "/contact",
            style: "ghost",
            action: "link",
          },
        ],
      },
      {
        id: "rw-product",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "The Product",
          title: "What a RockWool panel is",
          body: "A finished insulated sandwich panel: metal facings bonded around a dense RockWool stone-fibre core. Built for walls and partitions that need thermal control with strong fire-conscious performance.",
          body2:
            "Clients receive a ready panel product — not raw insulation alone. The RockWool core sits between protective metal skins, ready for cold rooms, food facilities, data-centre envelopes, and industrial walls.",
          image: "/uploads/rockwool/RockWool Panels.jpeg",
          imageSide: "right",
          linkLabel: "Request specifications →",
          linkHref: "/contact",
        },
      },
      {
        id: "rw-product-points",
        type: "featureList",
        data: {
          eyebrow: "Built as a complete panel system",
          title: "Why teams specify RockWool panels",
          items: [
            "Fire-conscious core — mineral wool valued for non-combustible character in demanding buildings",
            "Stable thermal insulation — helps maintain controlled temperatures in storage and facility environments",
            "Automated Malaysian production — manufactured on United Panel’s fully automated RockWool line",
            "Project-matched options — thickness, facing finish, and joint details confirmed with our team",
          ],
        },
        note: "Full technical specifications and thickness ranges are available on enquiry — published figures will be added once approved.",
      },
      {
        id: "rw-specs",
        type: "specsTable",
        data: {
          eyebrow: "Product range & data",
          title: "Specifications (RockWool)",
          lead: "Directional product data for planning. Exact thickness, facing, joint and performance figures are confirmed per project once approved for publication.",
          rows: [
            { label: "Panel type", value: "Insulated sandwich panel (metal / RockWool / metal)" },
            { label: "Core", value: "RockWool mineral wool (stone fibre)" },
            { label: "Facing", value: "Metal skins — finish options confirmed per project" },
            { label: "Thickness range", value: "Available on enquiry (project-matched)" },
            { label: "Joint system", value: "Confirmed with our team for your use case" },
            { label: "Primary strengths", value: "Fire-conscious performance · thermal stability · dimensional integrity" },
            { label: "Typical uses", value: "Cold rooms, freezers, food facilities, data centres, industrial envelopes" },
            { label: "Production", value: "Malaysia’s first fully automated RockWool production line" },
            { label: "Certificates", value: "Pending — fire / quality / standards documents to be listed when issued" },
          ],
        },
        note: "Stakeholder preview — final claims, thicknesses, and certificates subject to management approval.",
        buttons: [
          {
            id: "rw-specs-btn",
            label: "Request full datasheet →",
            href: "/contact",
            style: "primary",
            action: "link",
          },
        ],
      },
      {
        id: "rw-certs",
        type: "cardGrid",
        columns: 3,
        data: {
          eyebrow: "Assurance",
          title: "Certificates & compliance",
          lead: "Verified documents will sit here once issued — compact proof for buyers and consultants.",
          items: [
            {
              id: "cert1",
              title: "Fire performance",
              text: "Certificate pending — to be published when issued.",
            },
            {
              id: "cert2",
              title: "Quality / product",
              text: "Certificate pending — to be published when issued.",
            },
            {
              id: "cert3",
              title: "Test / standards",
              text: "Certificate pending — to be published when issued.",
            },
          ],
        },
      },
      {
        id: "rw-applications",
        type: "cardGrid",
        columns: 2,
        data: {
          eyebrow: "Where It’s Used",
          title: "Applications RockWool panels serve",
          lead: "From cold storage to mission-critical buildings — RockWool panels are chosen where insulation and fire-conscious construction are both important. Final suitability is confirmed per project.",
          items: [
            {
              id: "app1",
              title: "Cold Rooms",
              text: "Chilled storage walls and partitions for food and logistics.",
              image: "/uploads/rockwool/RockWool Panel 3.jpeg",
            },
            {
              id: "app2",
              title: "Freezers & Food Facilities",
              text: "Lower-temperature rooms and hygiene-critical processing spaces.",
            },
            {
              id: "app3",
              title: "Data Centres",
              text: "External wall and envelope panels where fire performance and thermal control matter.",
            },
            {
              id: "app4",
              title: "Industrial Buildings",
              text: "Warehouses and facilities needing durable insulated panel construction.",
            },
          ],
        },
      },
      {
        id: "rw-contact",
        type: "contactCta",
        data: {
          eyebrow: "Next Step",
          title: "Enquire about RockWool panels",
          body: "Share your project needs. Our team will follow up with suitable panel options and specifications — detailed technical data available on request.",
          email: "sales@ur.com.my",
          phone: "+60 00-000 0000",
          whatsapp: "+60 00-000 0000",
          ctaLabel: "Contact Us",
          ctaHref: "/contact",
        },
      },
    ],
  };
}

const aboutDefaults: Record<string, PageDocument> = {
  about: aboutDoc(
    "About Us",
    {
      crumbs: [],
      activeHref: "/about",
      image: "https://www.ur.com.my/userfiles/image/newfactoryoutlok.png",
      brand: "United Panel-System",
      lead: "Based in Johor since 1978, we manufacture insulated panel systems for cold rooms — backed by in-house production, research, and recognised certifications.",
    },
    [
      {
        id: "about-lead",
        type: "richText",
        data: {
          eyebrow: "United Panel-System",
          title: "Cold storage panels, made in Malaysia",
          body: "Based in Johor since 1978, we manufacture insulated panel systems for walk-in cold rooms and refrigeration storage — backed by in-house production, research, and recognised certifications.",
        },
      },
      {
        id: "about-hub",
        type: "cardGrid",
        columns: 2,
        data: {
          eyebrow: "Explore",
          title: "About our company",
          lead: "Start with who we are, then open vision, R&D, and the approvals behind our panels.",
          items: [
            {
              id: "a1",
              eyebrow: "01",
              title: "Company Profile",
              text: "Our history, facilities in Johor, and how we manufacture insulated panels for cold storage.",
              href: "/about/company-profile",
              image: "/uploads/About/FactoryLook.png",
            },
            {
              id: "a2",
              eyebrow: "02",
              title: "Vision & Mission",
              text: "The direction that guides our products, quality standards, and customer partnerships.",
              href: "/about/vision-mission",
              image: "/uploads/About/manufacturing.png",
            },
            {
              id: "a3",
              eyebrow: "03",
              title: "Research & Development",
              text: "How we improve panel performance, production methods, and application support.",
              href: "/about/research-development",
              image: "/uploads/About/line.jpg",
            },
            {
              id: "a4",
              eyebrow: "04",
              title: "Certified, Recognized and Approved",
              text: "FM Global, TÜV fire classification, and ISO, SIRIM & Bomba recognition.",
              href: "/about/certified",
              image: "/uploads/About/suction.jpg",
            },
          ],
        },
      },
    ],
  ),

  "about/company-profile": aboutDoc(
    "Company Profile",
    {
      crumbs: [{ label: "Company Profile" }],
      activeHref: "/about/company-profile",
      image: "/uploads/About/FactoryLook.png",
      brand: "United Panel-System",
      lead: "Since 1978 — insulated panels for walk-in cold rooms and refrigeration storage, proudly made in Malaysia.",
    },
    [
      {
        id: "cp-lead",
        type: "richText",
        data: {
          title: "Company Profile",
          body: "Since 1978, United Panel-System (M) Sdn. Bhd. has specialised in insulated panels for walk-in cold rooms and refrigeration storage — proudly made in Malaysia.",
        },
      },
      {
        id: "cp-stats",
        type: "stats",
        data: {
          items: [
            { id: "s1", value: "1978", label: "Established" },
            { id: "s2", value: "Johor", label: "HQ & factory" },
            { id: "s3", value: "ASEAN", label: "First PIR Double Belt Continuous Line" },
            { id: "s4", value: "FM", label: "Approved PIR panels" },
          ],
        },
      },
      {
        id: "cp-story",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "Our story",
          title: "Built for cold storage",
          body: "Formerly United Refrigerator Trading Sdn. Bhd., we produce injection polyurethane (PU), polyisocyanurate (PIR) and RockWool insulated panels for commercial and industrial refrigeration.",
          body2:
            "Head office and production sit in Johor. Being Malaysia’s largest multi-purpose plant of its kind, we also supply a complete range of refrigeration system products.",
          image: "/uploads/About/FactoryLook.png",
          imageSide: "left",
        },
      },
      {
        id: "cp-pillars",
        type: "cardGrid",
        columns: 2,
        data: {
          items: [
            {
              id: "p1",
              title: "In-house production",
              text: "First and only PIR Double Belt Continuous Line in ASEAN for cold store panels and roofing. FM Approved PIR panels are manufactured in-house on a fully automated continuous line.",
              image: "/uploads/About/line.jpg",
            },
            {
              id: "p2",
              title: "Trusted quality",
              text: "Decades of industry experience and product quality have earned continued support from customers across commercial and industrial refrigeration.",
              image: "/uploads/About/suction.jpg",
            },
          ],
        },
      },
      {
        id: "cp-gallery",
        type: "gallery",
        columns: 3,
        data: {
          items: [
            { id: "g1", src: "/uploads/About/manufacturing.png", alt: "Manufacturing" },
            { id: "g2", src: "", alt: "Systems & parts" },
            { id: "g3", src: "", alt: "Panel products" },
          ],
        },
      },
    ],
  ),

  "about/vision-mission": aboutDoc(
    "Vision & Mission",
    {
      crumbs: [{ label: "Vision & Mission" }],
      activeHref: "/about/vision-mission",
      image: "https://www.ur.com.my/userfiles/image/bannerpg2.png",
      brand: "United Panel-System",
      lead: "Advanced production, in-house quality control, and products trusted across commercial and industrial refrigeration.",
    },
    [
      {
        id: "vm-lead",
        type: "richText",
        data: {
          title: "Vision & Mission",
          body: "Advanced production, in-house quality control, and products trusted across commercial and industrial refrigeration — that is how UR® aims to lead.",
        },
      },
      {
        id: "vm-pillars",
        type: "cardGrid",
        columns: 2,
        data: {
          items: [
            {
              id: "mission",
              eyebrow: "Our mission",
              title: "Technology-led manufacturing",
              text: "We adopt a highly advanced technological approach in our production methods. We do not outsource our work. Customers are assured of high standards of quality and service control.",
              image: "/uploads/vision-mission/glueinjecting.jpg",
            },
            {
              id: "vision",
              eyebrow: "Our vision",
              title: "Lead through excellence",
              text: "All of us at UR® take great pride in the quality products that we manufacture and provide. We aim to be a leader in our field and will continue to strive towards products and service excellence.",
              image: "/uploads/vision-mission/suction.jpg",
            },
          ],
        },
      },
      {
        id: "vm-serve",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "Where we serve",
          title: "Trusted across industries",
          body: "Our reliable products have gained acceptance and recognition from customers and are widely used in restaurants, hotels, resorts, bakeries, supermarkets and other commercial and industrial applications.",
          image: "/uploads/vision-mission/cold.jpeg",
          imageSide: "left",
        },
      },
    ],
  ),

  "about/research-development": aboutDoc(
    "Research & Development",
    {
      crumbs: [{ label: "Research & Development" }],
      activeHref: "/about/research-development",
      image: "https://www.ur.com.my/userFiles/image/6.jpg",
      brand: "United Panel-System",
      lead: "Continuous R&D and computer-aided engineering keep our production methods, skills, and panel performance moving forward.",
    },
    [
      {
        id: "rd-lead",
        type: "richText",
        data: {
          title: "Research & Development",
          body: "Continuous research and development — using computer-aided engineering — keeps our production methods, skills, and knowledge moving forward.",
        },
      },
      {
        id: "rd-approach",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "Our approach",
          title: "Engineering-led improvement",
          body: "We acknowledge the need to continually conduct research and development in the usage of computer-aided engineering to further expand our skills and knowledge base in our production methods.",
          body2:
            "Experience and expertise in this field enable us to properly utilise the latest technologies available and embed them in our designs.",
          image: "https://www.ur.com.my/userfiles/image/rnd.png",
          imageSide: "left",
        },
      },
      {
        id: "rd-rw",
        type: "mediaText",
        columns: 2,
        data: {
          eyebrow: "New capability",
          title: "RockWool panels",
          body: "Alongside our PU and PIR range, we now manufacture RockWool mineral-wool core panels on Malaysia’s first fully automated RockWool production line.",
          body2: "Same in-house manufacturing discipline, with a mineral-wool core engineered for cold storage and building envelope use.",
          image: "/uploads/rockwool/RockWool Panel 3.jpeg",
          linkLabel: "Learn more about RockWool →",
          linkHref: "/products/rockwool",
          imageSide: "right",
        },
      },
    ],
  ),

  "about/certified": aboutDoc(
    "Certified Quality",
    {
      crumbs: [{ label: "Certified, Recognized and Approved" }],
      activeHref: "/about/certified",
      image: "/uploads/pir/certs/catalogue-page-17.jpg",
      brand: "United Panel-System",
      lead: "FM Global, TÜV fire classification, ISO, SIRIM and Bomba recognition — proof behind UR panel quality.",
    },
    [
      {
        id: "cert-gallery",
        type: "gallery",
        columns: 2,
        data: {
          items: [
            {
              id: "cg1",
              src: "/uploads/pir/certs/catalogue-page-17.jpg",
              alt: "Certified Quality — UR PIR Catalogue",
            },
            {
              id: "cg2",
              src: "/uploads/pir/certs/catalogue-page-18.jpg",
              alt: "UR Certifications wall",
            },
          ],
        },
      },
      {
        id: "cert-body",
        type: "richText",
        data: {
          title: "Certified, Recognized and Approved",
          body: "Quality control is an incontestable trait of UR panel products and we are well-equipped with the knowledge of the latest building, fire and environmental regulations.\n\nAs shown in the UR PIR Catalogue, our certifications include FM Global (FM) Approval, TÜV Fire Classification, BS 8414-2 external cladding fire testing, ISO 9001:2015, SIRIM Quality System / SIRIM QAS International, Jabatan Bomba dan Penyelamat Malaysia, and a cooperative agreement with UNDP towards HCFC Phase-Out Management Plans.",
        },
      },
      {
        id: "cert-cards",
        type: "cardGrid",
        columns: 3,
        data: {
          title: "Explore certifications",
          items: [
            {
              id: "fm",
              title: "FM Global (FM) Approval",
              text: "Class 1 — FM 4880 / 4881 · includes UBC-26 room test",
              image: "/uploads/pir/certs/fm.png",
              href: "/about/certified/fm-global",
            },
            {
              id: "tuv",
              title: "TÜV Fire Classification",
              text: "Reaction to Fire Classification B-s1,d0 — TÜV Singapore",
              image: "/uploads/pir/certs/tuv.jpg",
              href: "/about/certified/tuv",
            },
            {
              id: "iso",
              title: "ISO, SIRIM & Bomba",
              text: "ISO 9001:2015 · SIRIM QAS (incl. BS 8414-2) · Bomba Malaysia",
              image: "/uploads/pir/certs/iso.jpg",
              href: "/about/certified/quality-recognition",
            },
          ],
        },
      },
    ],
  ),

  "about/certified/fm-global": aboutDoc(
    "FM Global (FM) Approval",
    {
      crumbs: [
        { label: "Certified, Recognized and Approved", href: "/about/certified" },
        { label: "FM Global Approval" },
      ],
      activeHref: "/about/certified/fm-global",
      image: "/uploads/pir/certs/catalogue-page-20.jpg",
      brand: "United Panel-System",
      lead: "UR PIR panels are FM Global (FM) APPROVED — Class 1 to FM Approvals Standard 4880 / 4881, without height restrictions.",
    },
    [
      {
        id: "fm-logo",
        type: "gallery",
        columns: 1,
        data: { items: [{ id: "fml", src: "/uploads/pir/certs/fm.png", alt: "FM APPROVED logos" }] },
      },
      {
        id: "fm-body",
        type: "richText",
        data: {
          title: "FM Global (FM) Approval",
          body: "PIR is recognised by the industry as the fire safe alternative to other foam cores. UR PIR panel is FM Global (FM) APPROVED.\n\nUR PIR panels obtained Class 1 fire rating according to FM Approvals Standard 4880 and 4881. These ratings are valid without height restrictions.",
        },
      },
      { id: "fm-callout", type: "callout", data: { body: "Not FM Approved ≠ PIR" } },
      {
        id: "fm-page",
        type: "gallery",
        columns: 1,
        data: {
          items: [
            { id: "fmp", src: "/uploads/pir/certs/page20-hires.jpg", alt: "FM Global Approval catalogue page" },
          ],
        },
      },
      {
        id: "fm-room",
        type: "richText",
        data: {
          title: "FM Room Test (UBC-26)",
          body: "In order to obtain FM Approvals Standard 4880, UR PIR panels are subjected to a number of stringent tests. One of these tests is the UBC-26 room test.\n\nUR PIR panels test results show that fire is contained in the room and there is no fire propagation to the extremities of the panel construction.",
        },
      },
      {
        id: "fm-contact",
        type: "contactCta",
        data: {
          eyebrow: "Verify",
          title: "Confirm FM approval",
          body: "To verify UR® FM approved PIR panel, visit www.approvalguide.com or contact our team.",
          ctaLabel: "Contact us →",
          ctaHref: "/contact",
        },
      },
    ],
  ),

  "about/certified/tuv": aboutDoc(
    "TÜV Fire Classification",
    {
      crumbs: [
        { label: "Certified, Recognized and Approved", href: "/about/certified" },
        { label: "TÜV Fire Classification" },
      ],
      activeHref: "/about/certified/tuv",
      image: "/uploads/pir/certs/catalogue-page-22.jpg",
      brand: "United Panel-System",
      lead: "UR PIR panels are tested and classified by TÜV Singapore — product safety proven alongside FM Global approval.",
    },
    [
      {
        id: "tuv-logo",
        type: "gallery",
        columns: 1,
        data: { items: [{ id: "tl", src: "/uploads/pir/certs/tuv.jpg", alt: "TÜV SÜD" }] },
      },
      {
        id: "tuv-body",
        type: "richText",
        data: {
          title: "TÜV Fire Classification",
          body: "Product safety is of the utmost importance to us and our customers. In addition to obtaining FM Global (FM) approval, UR PIR panel has been tested and classified by TÜV Singapore.",
        },
      },
      {
        id: "tuv-callout",
        type: "callout",
        data: { title: "Classification", body: "REACTION TO FIRE CLASSIFICATION: B-s1,d0" },
      },
      {
        id: "tuv-contact",
        type: "contactCta",
        data: {
          eyebrow: "Reports",
          title: "Need the full report?",
          body: "Kindly contact us for the full report and further test details.",
          ctaLabel: "Contact us →",
          ctaHref: "/contact",
        },
      },
    ],
  ),

  "about/certified/quality-recognition": aboutDoc(
    "ISO, SIRIM & Bomba",
    {
      crumbs: [
        { label: "Certified, Recognized and Approved", href: "/about/certified" },
        { label: "ISO, SIRIM & Bomba" },
      ],
      activeHref: "/about/certified/quality-recognition",
      image: "/uploads/pir/certs/catalogue-page-18.jpg",
      brand: "United Panel-System",
      lead: "ISO 9001:2015, SIRIM QAS International, and Jabatan Bomba recognition behind our quality systems.",
    },
    [
      {
        id: "qr-lead",
        type: "richText",
        data: {
          title: "ISO, SIRIM & Bomba",
          body: "Alongside FM Global and TÜV fire classification, UR panel products are listed under quality and local recognition marks — including ISO 9001:2015, SIRIM QAS International (including BS 8414-2 cladding fire testing), and Jabatan Bomba dan Penyelamat Malaysia.",
        },
      },
      {
        id: "qr-logos",
        type: "gallery",
        columns: 3,
        data: {
          items: [
            { id: "iso", src: "/uploads/pir/certs/iso.jpg", alt: "ISO 9001:2015" },
            { id: "sirim", src: "/uploads/pir/certs/sirim.jpg", alt: "SIRIM QAS International" },
            { id: "bomba", src: "/uploads/pir/certs/bomba.png", alt: "Bomba Malaysia" },
          ],
        },
      },
      {
        id: "qr-iso",
        type: "richText",
        data: {
          title: "ISO 9001:2015",
          body: "UNITED PANEL-SYSTEM (M) SDN BHD is an ISO certified company — Certification No. 17975-A.",
        },
      },
      {
        id: "qr-sirim",
        type: "richText",
        data: {
          title: "SIRIM QAS International",
          body: "UR® panel is a certified and listed product by SIRIM QAS International. Under SIRIM QAS International, UR PIR insulated panels have also passed and met the requirements when tested to BS 8414-2 for external cladding systems.",
        },
      },
      {
        id: "qr-bomba",
        type: "richText",
        data: {
          title: "Jabatan Bomba dan Penyelamat Malaysia",
          body: "Locally, our insulation panels have been tested and approved by the Fire and Rescue Department of Malaysia (Bomba) for commercial and industrial use.",
        },
      },
    ],
  ),
};

function partsDocument(): PageDocument {
  const parts = defaultHomeContent.parts;
  return {
    title: "Refrigeration Parts",
    chrome: "default",
    sections: [
      {
        id: "parts-hero",
        type: "richText",
        data: { eyebrow: parts.eyebrow, title: parts.title, body: parts.lead },
      },
      {
        id: "parts-cards",
        type: "cardGrid",
        columns: 2,
        data: {
          items: parts.items.map((item) => ({
            id: item.id,
            title: item.title,
            text: item.text,
            image: item.image,
            href: item.href,
          })),
        },
      },
      {
        id: "parts-cta",
        type: "contactCta",
        data: {
          eyebrow: "Enquire",
          title: "Need refrigeration parts?",
          body: "Contact our team about authorised brands and components.",
          ctaLabel: "Enquire about parts →",
          ctaHref: "/contact",
        },
      },
    ],
  };
}

function servicesDocument(): PageDocument {
  const services = defaultHomeContent.services;
  return {
    title: "Services",
    chrome: "default",
    sections: [
      {
        id: "svc-hero",
        type: "richText",
        data: { eyebrow: services.eyebrow, title: services.title, body: services.lead },
      },
      {
        id: "svc-cards",
        type: "cardGrid",
        columns: 2,
        data: {
          items: services.items.map((item) => ({
            id: item.id,
            title: item.title,
            text: item.text,
            image: item.image,
            href: item.href,
          })),
        },
      },
      {
        id: "svc-cta",
        type: "contactCta",
        data: {
          eyebrow: "Enquire",
          title: "Need advisory support?",
          body: "Contact our team about cold storage planning and project delivery.",
          ctaLabel: "Enquire about services →",
          ctaHref: "/contact",
        },
      },
    ],
  };
}

function contactDocument(): PageDocument {
  const contact = defaultHomeContent.contact;
  return {
    title: "Contact Us",
    chrome: "default",
    sections: [
      {
        id: "contact-hero",
        type: "richText",
        data: { eyebrow: contact.eyebrow, title: "Contact Us", body: contact.body },
      },
      {
        id: "contact-cta",
        type: "contactCta",
        data: {
          eyebrow: "Reach our team",
          title: "Sales & enquiries",
          body: "Email, phone, or WhatsApp — we will follow up with suitable options.",
          email: contact.email,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          ctaLabel: "Email sales",
          ctaHref: `mailto:${contact.email}`,
        },
      },
    ],
  };
}

/** Default page documents keyed by page id */
export const defaultPageDocuments: Record<string, PageDocument> = {
  home: homeDocument(),
  products: productsHubDocument(),
  "products/pir": panelProductToDocument(defaultPirContent),
  "products/pu": panelProductToDocument(defaultPuContent),
  "products/rockwool": rockwoolDocument(),
  parts: partsDocument(),
  services: servicesDocument(),
  contact: contactDocument(),
  ...aboutDefaults,
};

export function getDefaultPageDocument(pageId: string): PageDocument {
  const doc = defaultPageDocuments[pageId];
  if (doc) return structuredClone(doc);
  const meta = SITE_PAGES.find((p) => p.id === pageId);
  return {
    title: meta?.label || pageId,
    chrome: pageId.startsWith("about") ? "about" : "default",
    about: pageId.startsWith("about")
      ? { crumbs: [{ label: meta?.label || pageId }], activeHref: meta?.path || `/${pageId}`, image: "" }
      : undefined,
    sections: [
      {
        id: newId("richText"),
        type: "richText",
        data: { title: meta?.label || "New page", body: "Start editing this page in the admin." },
      },
    ],
  };
}
