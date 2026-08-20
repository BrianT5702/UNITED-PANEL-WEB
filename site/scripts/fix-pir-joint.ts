/**
 * Replace flat joint mediaText on products/pir with expandable jointDetails.
 * Run: npx tsx scripts/fix-pir-joint.ts
 */
import { PrismaClient } from "@prisma/client";
import { defaultPirContent } from "../src/lib/panels";
import { newId, type PageDocument, type PageSection } from "../src/lib/page-document";

const prisma = new PrismaClient();

function jointSection(): PageSection {
  const j = defaultPirContent.jointDetails!;
  return {
    id: "joint",
    type: "jointDetails",
    data: {
      eyebrow: j.eyebrow,
      title: j.title,
      summary: j.summary,
      body: j.body,
      image: j.image,
      imageAlt: j.imageAlt,
      toggleLabel: "Show joint details",
      hideLabel: "Hide joint details",
      pages: (j.pages || []).map((page, i) => ({
        id: newId(`jp${i}`),
        title: page.title,
        lead: page.lead,
        src: page.src,
        alt: page.alt,
      })),
    },
  };
}

async function main() {
  const row = await prisma.contentSection.findUnique({
    where: { page_key: { page: "products/pir", key: "document" } },
  });
  if (!row) throw new Error("products/pir document missing");
  const doc = JSON.parse(row.data) as PageDocument;
  let replaced = false;
  doc.sections = doc.sections.map((section) => {
    const isJoint =
      section.type === "jointDetails" ||
      section.id === "joint" ||
      section.id.startsWith("joint_") ||
      (section.type === "mediaText" &&
        (section.data.eyebrow?.toLowerCase().includes("joint") ||
          section.data.title?.toLowerCase().includes("joint")));
    if (!isJoint) return section;
    replaced = true;
    return jointSection();
  });
  if (!replaced) {
    const specsIdx = doc.sections.findIndex((s) => s.type === "specsTable");
    doc.sections.splice(specsIdx >= 0 ? specsIdx : doc.sections.length, 0, jointSection());
  }
  await prisma.contentSection.update({
    where: { page_key: { page: "products/pir", key: "document" } },
    data: { data: JSON.stringify(doc) },
  });
  console.log("Updated products/pir joint section to expandable jointDetails");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
