/**
 * Persist Phase 2 imported page defaults into CMS DB, then rely on content:export.
 * Run: npx tsx scripts/update-phase2-pages.ts
 */
import { PrismaClient } from "@prisma/client";
import { getDefaultPageDocument } from "../src/lib/page-defaults";

const prisma = new PrismaClient();

const PAGE_IDS = [
  "products",
  "products/roof",
  "products/applications",
  "products/refrigeration-systems",
  "products/insulated-doors",
  "services",
  "parts",
  "partners",
  "news",
  "career",
] as const;

async function upsertDocument(pageId: string) {
  const document = getDefaultPageDocument(pageId);
  await prisma.contentSection.upsert({
    where: { page_key: { page: pageId, key: "document" } },
    create: {
      page: pageId,
      key: "document",
      data: JSON.stringify(document),
    },
    update: {
      data: JSON.stringify(document),
    },
  });
  console.log(
    `Updated ${pageId} (${document.sections.length} sections) — ${document.title}`,
  );
}

async function main() {
  for (const id of PAGE_IDS) {
    await upsertDocument(id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
