/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script (runs without tsx) */
/**
 * One-off content update: Partners page "Brand logo wall" (41 single-logo tiles)
 * -> "Logo slideshow" (6 slides, several logos per slide, like the old ur.com.my slider).
 *
 * Updates BOTH content/cms-snapshot.json (re-imported on every page load) and the DB.
 * Backs up the full old Partners document first (content/backups/…) so nothing is lost.
 * Safe to run twice: does nothing if the slideshow is already there.
 *
 * Run from the site folder:  node scripts/update-partners-logo-slideshow.cjs
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const NEW_SECTION = {
  "id": "partners-logo-slides",
  "type": "gallery",
  "data": {
    "eyebrow": "Authorised distributorships",
    "title": "Brands we supply",
    "layout": "logoSlides",
    "slideshowAutoplay": true,
    "slideshowIntervalSec": 5,
    "items": [
      {
        "id": "logo-slide-1",
        "src": "/uploads/partners/slides/authorised-1.png",
        "alt": "BASF · Hailiang · SAMPO · CSC Steel · Grant Ice Systems · FERMOD · Every Control Group"
      },
      {
        "id": "logo-slide-2",
        "src": "/uploads/partners/slides/authorised-2.png",
        "alt": "Danfoss · EMERSON Climate Technologies · EBMPAPST · WeiGuang Motor & Fans · Airmender · Alco Controls · MTH"
      },
      {
        "id": "logo-slide-3",
        "src": "/uploads/partners/slides/authorised-3.png",
        "alt": "FLEXELEC · Saginomiya · Maneurop · Castel · KK · Scotsman Ice System · Guntner"
      },
      {
        "id": "logo-slide-4",
        "src": "/uploads/partners/slides/authorised-4.png",
        "alt": "Embraco · Harris · HUB · DAN Doors · KASON · ASPERA · SUNISO"
      },
      {
        "id": "logo-slide-5",
        "src": "/uploads/partners/slides/authorised-5.png",
        "alt": "GEMLINE · BERNZOMATIC · TMI · DORIN · AC & R · Bristol Compressors · Tecumseh"
      },
      {
        "id": "logo-slide-6",
        "src": "/uploads/partners/slides/authorised-6.png",
        "alt": "KEMBLA · PARAGON · Anaconda · Grupo Repro · Packless · GOMAX"
      }
    ]
  }
};
const OLD_CALLOUT = "The logo wall shows a selection of authorised lines.";
const NEW_CALLOUT = "The slideshow shows a selection of authorised lines.";

function isOldWall(s) {
  return (
    s &&
    s.type === "gallery" &&
    (s.id === "partners-authorised" ||
      (s.data && s.data.layout === "logos" && Array.isArray(s.data.items) && s.data.items.length > 8))
  );
}

/** Returns { doc, changed } */
function migrate(doc) {
  if (!doc || !Array.isArray(doc.sections)) return { doc, changed: false };
  if (doc.sections.some((s) => s && s.id === NEW_SECTION.id)) {
    // Slideshow already there (e.g. added automatically) - just drop the old wall if still present
    const before = doc.sections.length;
    const sections = doc.sections.filter((s) => !isOldWall(s));
    return { doc: { ...doc, sections }, changed: sections.length !== before };
  }
  const sections = [...doc.sections];
  const i = sections.findIndex(isOldWall);
  const fresh = JSON.parse(JSON.stringify(NEW_SECTION));
  if (i >= 0) sections.splice(i, 1, fresh);
  else {
    const ex = sections.findIndex((s) => s && s.id === "partners-exclusive");
    sections.splice(ex >= 0 ? ex + 1 : sections.length, 0, fresh);
  }
  for (const s of sections) {
    if (s && s.type === "callout" && s.data && typeof s.data.body === "string") {
      s.data.body = s.data.body.replace(OLD_CALLOUT, NEW_CALLOUT);
    }
  }
  return { doc: { ...doc, sections }, changed: true };
}

async function main() {
  const root = process.cwd();
  const snapshotPath = path.join(root, "content", "cms-snapshot.json");
  const backupDir = path.join(root, "content", "backups");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const prisma = new PrismaClient();
  try {
    const row = await prisma.contentSection.findUnique({
      where: { page_key: { page: "partners", key: "document" } },
    });
    const dbDoc = row ? JSON.parse(row.data) : null;

    let snapshot = null;
    let snapEntry = null;
    if (fs.existsSync(snapshotPath)) {
      snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
      snapEntry = (snapshot.sections || []).find((s) => s.page === "partners" && s.key === "document");
    }
    const snapDoc = snapEntry
      ? typeof snapEntry.data === "string"
        ? JSON.parse(snapEntry.data)
        : snapEntry.data
      : null;

    const snapResult = snapEntry && snapDoc ? migrate(snapDoc) : null;
    const dbResult = row && dbDoc ? migrate(dbDoc) : null;

    if ((snapResult && snapResult.changed) || (dbResult && dbResult.changed)) {
      fs.mkdirSync(backupDir, { recursive: true });
      const backupFile = path.join(backupDir, `partners-document-before-logo-slideshow-${stamp}.json`);
      fs.writeFileSync(
        backupFile,
        JSON.stringify({ note: "Partners page before the logo slideshow update", db: dbDoc, snapshot: snapDoc }, null, 2),
      );
      console.log("Backup written:", path.relative(root, backupFile));
    }

    if (snapResult) {
      if (snapResult.changed) {
        snapEntry.data = snapResult.doc;
        fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + "\n");
        console.log("Updated content/cms-snapshot.json");
      } else console.log("content/cms-snapshot.json already up to date");
    } else console.log("No Partners page in content/cms-snapshot.json (skipped)");

    if (dbResult) {
      if (dbResult.changed) {
        await prisma.contentSection.update({
          where: { page_key: { page: "partners", key: "document" } },
          data: { data: JSON.stringify(dbResult.doc) },
        });
        console.log("Updated database (Partners page)");
      } else console.log("Database already up to date");
    } else console.log("No Partners page in the database yet (the site will create it with the slideshow)");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
