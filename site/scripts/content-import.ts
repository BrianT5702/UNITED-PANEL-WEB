import { importCmsSnapshot } from "../src/lib/cms-sync";
import { prisma } from "../src/lib/db";

async function main() {
  const result = await importCmsSnapshot({ force: true });
  if (result.skipped) {
    console.log("No usable content/cms-snapshot.json found — skipped import.");
    return;
  }
  console.log(`Imported ${result.updated} CMS rows from content/cms-snapshot.json`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
