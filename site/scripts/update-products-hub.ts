/**
 * One-time: overwrite the CMS products hub document with current defaults.
 * Run: npx tsx scripts/update-products-hub.ts
 */
import { PrismaClient } from "@prisma/client";
import { getDefaultPageDocument } from "../src/lib/page-defaults";

const prisma = new PrismaClient();

async function main() {
  const document = getDefaultPageDocument("products");
  await prisma.contentSection.upsert({
    where: { page_key: { page: "products", key: "document" } },
    create: {
      page: "products",
      key: "document",
      data: JSON.stringify(document),
    },
    update: {
      data: JSON.stringify(document),
    },
  });
  console.log("Updated CMS document for page: products");
  console.log(`Sections: ${document.sections.map((s) => s.id).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
