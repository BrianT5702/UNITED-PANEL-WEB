import { PrismaClient } from "@prisma/client";
import { defaultHomeContent } from "../src/lib/defaults";
import { HOME_SECTION_KEYS } from "../src/lib/types";

const prisma = new PrismaClient();

async function main() {
  for (const key of HOME_SECTION_KEYS) {
    await prisma.contentSection.upsert({
      where: { page_key: { page: "home", key } },
      create: {
        page: "home",
        key,
        data: JSON.stringify(defaultHomeContent[key]),
      },
      update: {
        data: JSON.stringify(defaultHomeContent[key]),
      },
    });
  }
  console.log("Seeded homepage content sections:", HOME_SECTION_KEYS.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
