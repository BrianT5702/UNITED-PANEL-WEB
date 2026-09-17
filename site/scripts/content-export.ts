import { exportCmsSnapshot } from "../src/lib/cms-sync";
import { prisma } from "../src/lib/db";

async function main() {
  const snap = await exportCmsSnapshot();
  if (!snap) {
    console.log("Export skipped (import in progress or disabled).");
    return;
  }
  console.log(`Exported ${snap.sections.length} CMS rows → content/cms-snapshot.json`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
