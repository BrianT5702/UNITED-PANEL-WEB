/**
 * Overwrite the CMS PU product page (and products hub intro) from catalogue defaults.
 * Run: npx tsx scripts/update-pu-page.ts
 */
import { PrismaClient } from "@prisma/client";
import { getDefaultPageDocument } from "../src/lib/page-defaults";

const prisma = new PrismaClient();

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
    `Updated CMS document for page: ${pageId} (${document.sections.length} sections)`,
  );
}

async function main() {
  await upsertDocument("products/pu");
  await upsertDocument("products");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
