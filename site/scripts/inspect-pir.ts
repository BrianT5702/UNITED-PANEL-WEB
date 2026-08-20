import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const r = await prisma.contentSection.findUnique({
    where: { page_key: { page: "products/pir", key: "document" } },
  });
  if (!r) {
    console.log("No products/pir document");
    return;
  }
  const d = JSON.parse(r.data);
  for (const s of d.sections) {
    console.log(
      s.id,
      s.type,
      s.data?.eyebrow || "",
      "|",
      s.data?.title || s.data?.headline || "",
    );
  }
}

main()
  .finally(() => prisma.$disconnect());
